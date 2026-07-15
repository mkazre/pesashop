const crypto = require('crypto');
const AutoposterTrend = require('../models/AutoposterTrend');
const AutoposterTrendCandidate = require('../models/AutoposterTrendCandidate');
const AutoposterDecision = require('../models/AutoposterDecision');
const Product = require('../models/Product');
const { matchTrendToProducts } = require('./autoposterTrendProductMatcher');
const { applySafetyClassification } = require('./autoposterTrendSafetyClassifier');
const { computeCandidateWeight, weightedSampleWithoutReplacement } = require('./autoposterWeightedSampler');
const { AUTOPOSTER_SENSITIVITY, AUTOPOSTER_PLATFORMS, AUTOPOSTER_TARGET_REGIONS, AUTOPOSTER_APPROVAL_STATUS } = require('../config/constants');

const DEFAULT_SAMPLE_COUNT = 4; // Spec 10.7: "Pick N candidates per run (default 3-5 across platforms)"

// One full sampling run (Spec 10.1's pipeline from "Cool-Down Filter" through
// "Weighted Random Sampler"), recording a full audit trail (Spec 11.4) —
// every candidate considered, not just the ones ultimately selected. Note on
// the model's field naming: AutoposterDecision.safetyPassed/safetyReason are
// repurposed here to mean "passed every pre-selection gate this stage
// checks" (cool-down hard caps + category-share caps), not brand-safety
// specifically — trend-level brand safety (Spec 10.10) already gated which
// trends reached candidate generation at all, earlier in this same run.
async function runTrendSampling({
  platforms = Object.values(AUTOPOSTER_PLATFORMS),
  region = AUTOPOSTER_TARGET_REGIONS.LOCAL_ZW,
  sampleCount = DEFAULT_SAMPLE_COUNT
} = {}) {
  const runId = crypto.randomUUID();

  // Brand safety, layers 1+3 (Phase 8's static blocklist already applied at
  // ingestion; layer 3's LLM trend-term classifier runs here, right before
  // a trend is allowed into product matching at all).
  const eligibleTrends = await AutoposterTrend.find({
    active: true,
    sensitivityFlag: { $ne: AUTOPOSTER_SENSITIVITY.BLOCKED }
  }).sort({ trendScore: -1 });

  const allCandidates = [];

  for (const trend of eligibleTrends) {
    await applySafetyClassification(trend); // may flip sensitivityFlag to 'blocked'
    if (trend.sensitivityFlag === AUTOPOSTER_SENSITIVITY.BLOCKED) continue;

    let candidateRows = await AutoposterTrendCandidate.find({ trend: trend._id });
    if (candidateRows.length === 0) candidateRows = await matchTrendToProducts(trend._id);

    for (const candidateRow of candidateRows) {
      const product = await Product.findById(candidateRow.product);
      if (!product) continue;
      product._similarity = candidateRow.similarity;

      for (const platform of platforms) {
        const result = await computeCandidateWeight(trend, product, platform, region);
        allCandidates.push({ trend, product, platform, region, ...result });
      }
    }
  }

  const selected = weightedSampleWithoutReplacement(allCandidates, sampleCount);
  const selectedSet = new Set(selected);

  const decisionDocs = [];
  for (const candidate of allCandidates) {
    const isSelected = selectedSet.has(candidate);
    decisionDocs.push({
      runId,
      trend: candidate.trend._id,
      product: candidate.product._id,
      platform: candidate.platform,
      selected: isSelected,
      weight: candidate.weight,
      safetyPassed: !candidate.blocked,
      safetyReason: candidate.reason,
      approvalStatus: isSelected ? AUTOPOSTER_APPROVAL_STATUS.PENDING : AUTOPOSTER_APPROVAL_STATUS.EXPIRED
    });
  }
  const created = decisionDocs.length > 0 ? await AutoposterDecision.insertMany(decisionDocs) : [];

  return {
    runId,
    trendsConsidered: eligibleTrends.length,
    candidatesConsidered: allCandidates.length,
    selected: created.filter((d) => d.selected).map((d) => ({ id: d._id, trend: d.trend, product: d.product, platform: d.platform, weight: d.weight }))
  };
}

module.exports = { runTrendSampling, DEFAULT_SAMPLE_COUNT };
