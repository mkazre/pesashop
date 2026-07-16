const { computeRecencyPenalty, computeCrossRegionDiscount, checkHardCaps, checkCategoryShareCap, computeEngagementGovernor } = require('./autoposterCooldownGuard');
const { getActiveCulturalEventBoosts } = require('./autoposterTrendIngestionRun');

// Weighted random sampler (Spec Section 10.7):
//   weight = trend_score * similarity * margin_factor * stock_factor
//          * recency_penalty * platform_fit * cultural_event_boost

// product_margin_factor: 0.5-1.5 based on margin band. Spec gives the range
// but not exact band cutoffs — this is a reasonable, documented choice, not
// an arbitrary one: <20% margin (thin/loss-leader) discouraged at 0.5,
// 20-40% (typical retail) neutral at 1.0, >40% (high-margin) favoured at 1.5.
function computeMarginFactor(product) {
  const price = product.salePrice || product.regularPrice;
  if (!price || !product.backendPrice) return 1.0; // no cost data — stay neutral, don't guess
  const margin = (price - product.backendPrice) / price;
  if (margin < 0.2) return 0.5;
  if (margin > 0.4) return 1.5;
  return 1.0;
}

// stock_factor: spec's literal 2 anchor points (0 if out of stock, 1.2 if
// >50 units); everything else defaults to a neutral 1.0 rather than
// interpolating values the spec doesn't specify.
function computeStockFactor(product) {
  if (product.outOfStock || product.stock <= 0) return 0;
  if (product.stock > 50) return 1.2;
  return 1.0;
}

// platform_fit: Spec Section 10.7 references "see 9.8" for this factor, but
// the received spec has no Section 9.8 (Section 9 only runs to 9.5) — a gap
// in the source document, not something to guess wildly at. Defaults to a
// neutral 1.0 (no adjustment) until MK can clarify what 9.8 was meant to
// contain.
function computePlatformFit() {
  return 1.0;
}

// Computes the full weight for one (trend, product, platform, region)
// candidate, applying the cool-down hard caps first (a blocked candidate
// gets weight 0 and is excluded, not just down-weighted).
async function computeCandidateWeight(trend, product, platform, region) {
  const hardCap = await checkHardCaps(product._id, platform, region);
  if (hardCap.blocked) return { weight: 0, blocked: true, reason: hardCap.reason };

  const categoryCap = await checkCategoryShareCap(product.categories, platform, region);
  if (categoryCap.blocked) return { weight: 0, blocked: true, reason: categoryCap.reason };

  const recencyPenalty = await computeRecencyPenalty(product._id, platform, region);
  const crossRegionDiscount = await computeCrossRegionDiscount(product._id, platform, region);
  const marginFactor = computeMarginFactor(product);
  const stockFactor = computeStockFactor(product);
  const platformFit = computePlatformFit();
  const culturalBoosts = await getActiveCulturalEventBoosts();
  const culturalEventBoost = culturalBoosts.length > 0 ? Math.max(...culturalBoosts) : 1.0;
  const engagementGovernor = await computeEngagementGovernor(platform, product.categories);

  // Admin "Pin" action (Spec 12.1) — force a high effective score for 24h,
  // bypassing the computed trendScore, rather than editing trendScore itself
  // (which would be overwritten by the next ingestion run anyway).
  const isPinned = trend.pinnedUntil && new Date(trend.pinnedUntil) > new Date();
  const effectiveTrendScore = isPinned ? 1.0 : trend.trendScore;

  const weight =
    effectiveTrendScore *
    (product._similarity ?? 1) *
    marginFactor *
    stockFactor *
    recencyPenalty *
    crossRegionDiscount *
    platformFit *
    culturalEventBoost *
    engagementGovernor;

  return { weight, blocked: false, breakdown: { trendScore: effectiveTrendScore, pinned: isPinned, similarity: product._similarity, marginFactor, stockFactor, recencyPenalty, crossRegionDiscount, platformFit, culturalEventBoost, engagementGovernor } };
}

// Weighted random selection without replacement (numpy.random.choice
// equivalent, Spec 10.7). Picks up to `count` candidates from a weighted
// pool; a candidate with weight 0 can never be picked.
//
// IMPORTANT: returns the SAME object references passed in, not copies.
// Nothing here mutates a candidate's own properties (only the pool array
// itself is spliced), so copying was unnecessary — and a spread-copy here
// previously broke callers that check `selectedSet.has(originalCandidate)`
// by reference (Set uses reference equality for objects), which silently
// produced an empty selection despite real positive weights. Caught live,
// not in a unit test, since the unit tests call this function directly and
// never round-trip through a Set the way runTrendSampling does.
function weightedSampleWithoutReplacement(candidates, count) {
  const pool = candidates.filter((c) => c.weight > 0);
  const picked = [];
  while (pool.length > 0 && picked.length < count) {
    const total = pool.reduce((sum, c) => sum + c.weight, 0);
    if (total <= 0) break;
    let r = Math.random() * total;
    let index = 0;
    for (; index < pool.length; index++) {
      r -= pool[index].weight;
      if (r <= 0) break;
    }
    picked.push(pool[index]);
    pool.splice(index, 1);
  }
  return picked;
}

module.exports = {
  computeMarginFactor,
  computeStockFactor,
  computePlatformFit,
  computeCandidateWeight,
  weightedSampleWithoutReplacement
};
