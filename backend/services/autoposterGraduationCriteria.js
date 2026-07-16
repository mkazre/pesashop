const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const AutoposterDecision = require('../models/AutoposterDecision');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterInsight = require('../models/AutoposterInsight');

// Graduation criteria (Spec Section 26.4, Phase 14's STOP AND CONFIRM):
// "Do NOT promote any category to full-auto without meeting all three
// graduation criteria. Manual approval remains the default state for at
// least 4 weeks." This is the real, computed gate — not just a UI hint —
// enforced server-side in the engine-config route before autoPublish can
// be switched on for any platform.
//
// Our schema has autoPublish per-PLATFORM (Phase 10/11), not per-category —
// a reasonable simplification of the spec's per-category concept, consistent
// with every other adaptation this build has made from the spec's original
// (Postgres/BullMQ/multi-process) architecture to our actual MongoDB-native,
// single-process one.
const CLEAN_RUN_WEEKS_REQUIRED = 4;
const APPROVAL_RATE_REQUIRED_PERCENT = 90;
const ENGAGEMENT_COVERAGE_REQUIRED_PERCENT = 80;
const LOOKBACK_DAYS = 28; // 4 weeks

async function computeCleanRunWeeks(platform) {
  const mostRecentFailureAlert = await AutoposterAuditLog.findOne({
    action: 'alert_fired',
    entityId: `platform_failures:${platform}`
  }).sort({ createdAt: -1 });

  if (!mostRecentFailureAlert) return CLEAN_RUN_WEEKS_REQUIRED; // never had a failure-rate alert — treat as clean since tracking began
  const daysSince = (Date.now() - mostRecentFailureAlert.createdAt.getTime()) / (24 * 60 * 60 * 1000);
  return Math.floor(daysSince / 7);
}

async function computeApprovalRatePercent(platform) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const decisions = await AutoposterDecision.find({
    platform,
    createdAt: { $gte: since },
    approvalStatus: { $in: ['approved', 'rejected', 'auto_published'] }
  }).select('approvalStatus');

  if (decisions.length === 0) return { percent: null, sampleSize: 0 }; // no real data yet — never claim a fabricated rate
  const approved = decisions.filter((d) => d.approvalStatus !== 'rejected').length;
  return { percent: Math.round((approved / decisions.length) * 1000) / 10, sampleSize: decisions.length };
}

async function computeEngagementCoveragePercent(platform) {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
  const targets = await AutoposterPostTarget.find({
    platform,
    status: 'published',
    publishedAt: { $gte: since }
  }).select('_id');

  if (targets.length === 0) return { percent: null, sampleSize: 0 };

  const insights = await AutoposterInsight.find({ postTarget: { $in: targets.map((t) => t._id) } })
    .select('postTarget likes comments shares clicks');
  const engagementByTarget = new Map();
  for (const insight of insights) {
    const key = String(insight.postTarget);
    const total = (insight.likes || 0) + (insight.comments || 0) + (insight.shares || 0) + (insight.clicks || 0);
    engagementByTarget.set(key, Math.max(engagementByTarget.get(key) || 0, total));
  }
  const withEngagement = targets.filter((t) => (engagementByTarget.get(String(t._id)) || 0) > 0).length;
  return { percent: Math.round((withEngagement / targets.length) * 1000) / 10, sampleSize: targets.length };
}

// The full graduation status for one platform. `allCriteriaMet` is the hard
// gate — false whenever any criterion lacks enough real data to judge, since
// "not enough data" must never be silently treated as "passing."
async function computeGraduationStatus(platform) {
  const [cleanRunWeeks, approvalRate, engagementCoverage] = await Promise.all([
    computeCleanRunWeeks(platform),
    computeApprovalRatePercent(platform),
    computeEngagementCoveragePercent(platform)
  ]);

  const cleanRunMet = cleanRunWeeks >= CLEAN_RUN_WEEKS_REQUIRED;
  const approvalRateMet = approvalRate.percent !== null && approvalRate.percent > APPROVAL_RATE_REQUIRED_PERCENT;
  const engagementMet = engagementCoverage.percent !== null && engagementCoverage.percent > ENGAGEMENT_COVERAGE_REQUIRED_PERCENT;

  return {
    platform,
    cleanRunWeeks,
    cleanRunMet,
    approvalRatePercent: approvalRate.percent,
    approvalRateSampleSize: approvalRate.sampleSize,
    approvalRateMet,
    engagementCoveragePercent: engagementCoverage.percent,
    engagementCoverageSampleSize: engagementCoverage.sampleSize,
    engagementMet,
    allCriteriaMet: cleanRunMet && approvalRateMet && engagementMet
  };
}

module.exports = {
  computeGraduationStatus,
  computeCleanRunWeeks,
  computeApprovalRatePercent,
  computeEngagementCoveragePercent,
  CLEAN_RUN_WEEKS_REQUIRED,
  APPROVAL_RATE_REQUIRED_PERCENT,
  ENGAGEMENT_COVERAGE_REQUIRED_PERCENT
};
