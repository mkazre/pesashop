const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const AutoposterDecision = require('../models/AutoposterDecision');
const AutoposterTrend = require('../models/AutoposterTrend');
const AutoposterCostLedger = require('../models/AutoposterCostLedger');
const { getAverageLLMLatencyMs, getXUsagePercent } = require('./autoposterCostControl');
const { AUTOPOSTER_TARGET_STATUS, AUTOPOSTER_ACCOUNT_STATUS } = require('../config/constants');

// Observability metrics (Spec Section 17) — every figure here is derived
// live from the real collections this build has been writing to since
// Phase 4/8/9, not a separately-maintained counter that could drift.

// Publishes per platform per hour (last 24h), plus success/failure ratio and
// average end-to-end latency from schedule to published.
async function getPublishMetrics() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const perPlatformPerHour = await AutoposterPostTarget.aggregate([
    { $match: { status: AUTOPOSTER_TARGET_STATUS.PUBLISHED, publishedAt: { $gte: since } } },
    {
      $group: {
        _id: { platform: '$platform', hour: { $dateTrunc: { date: '$publishedAt', unit: 'hour' } } },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.hour': 1 } }
  ]);

  const statusCounts = await AutoposterPostTarget.aggregate([
    { $match: { updatedAt: { $gte: since } } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const published = statusCounts.find((s) => s._id === AUTOPOSTER_TARGET_STATUS.PUBLISHED)?.count || 0;
  const failed = statusCounts.find((s) => s._id === AUTOPOSTER_TARGET_STATUS.FAILED)?.count || 0;
  const successFailureRatio = failed === 0 ? (published > 0 ? Infinity : null) : Math.round((published / failed) * 100) / 100;

  const latencyAgg = await AutoposterPostTarget.aggregate([
    { $match: { status: AUTOPOSTER_TARGET_STATUS.PUBLISHED, publishedAt: { $gte: since } } },
    { $project: { latencyMs: { $subtract: ['$publishedAt', '$scheduledFor'] } } },
    { $group: { _id: null, avgLatencyMs: { $avg: '$latencyMs' } } }
  ]);

  const queueDepth = await AutoposterPostTarget.countDocuments({ status: AUTOPOSTER_TARGET_STATUS.PENDING });

  return {
    perPlatformPerHour,
    publishedLast24h: published,
    failedLast24h: failed,
    successFailureRatio,
    avgEndToEndLatencyMs: latencyAgg[0]?.avgLatencyMs != null ? Math.round(latencyAgg[0].avgLatencyMs) : null,
    queueDepth
  };
}

async function getTokenRefreshFailures() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return AutoposterAuditLog.countDocuments({ action: 'token_refresh_failed', createdAt: { $gte: since } });
}

// Trend engine metrics (Spec 17): trends ingested per source per hour,
// candidates generated per run, approval rate per category, brand-safety
// rejections per day, average composer LLM latency, embedding cost per day.
async function getTrendMetrics() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const trendsIngestedPerSource = await AutoposterTrend.aggregate([
    { $match: { lastRefreshed: { $gte: since } } },
    { $unwind: '$sources' },
    { $group: { _id: '$sources', count: { $sum: 1 } } }
  ]);

  const candidatesPerRun = await AutoposterDecision.aggregate([
    { $group: { _id: '$runId', count: { $sum: 1 } } },
    { $sort: { _id: -1 } },
    { $limit: 1 }
  ]);

  const brandSafetyRejectionsToday = await AutoposterDecision.countDocuments({
    approvalStatus: 'rejected',
    safetyPassed: false,
    createdAt: { $gte: since }
  });

  const ledger = await AutoposterCostLedger.getCurrentMonth();
  const daysSoFarThisMonth = new Date().getUTCDate();
  const embeddingSpendPerDayEstimate = daysSoFarThisMonth > 0 ? ledger.embeddingSpendUSD / daysSoFarThisMonth : 0;

  return {
    trendsIngestedPerSourceLast24h: trendsIngestedPerSource,
    candidatesInMostRecentRun: candidatesPerRun[0]?.count || 0,
    brandSafetyRejectionsLast24h: brandSafetyRejectionsToday,
    avgComposerLLMLatencyMs: getAverageLLMLatencyMs(),
    embeddingSpendUSDThisMonth: Math.round(ledger.embeddingSpendUSD * 10000) / 10000,
    embeddingSpendUSDPerDayEstimate: Math.round(embeddingSpendPerDayEstimate * 10000) / 10000
  };
}

// Admin dashboard surfaces (Spec 17): needs_reauth count, failed posts in
// last 24h, next 10 scheduled posts, top 10 trending terms now, approval
// queue depth.
async function getDashboardSummary() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [needsReauthCount, failedPostsLast24h, nextScheduled, topTrends, approvalQueueDepth] = await Promise.all([
    AutoposterAccount.countDocuments({ status: AUTOPOSTER_ACCOUNT_STATUS.NEEDS_REAUTH }),
    AutoposterPostTarget.countDocuments({ status: AUTOPOSTER_TARGET_STATUS.FAILED, updatedAt: { $gte: since } }),
    AutoposterPostTarget.find({ status: AUTOPOSTER_TARGET_STATUS.PENDING }).sort({ scheduledFor: 1 }).limit(10).select('platform scheduledFor post'),
    AutoposterTrend.find({ active: true }).sort({ trendScore: -1 }).limit(10).select('term trendScore'),
    AutoposterDecision.countDocuments({ approvalStatus: 'pending', variants: { $ne: [] } })
  ]);

  return { needsReauthCount, failedPostsLast24h, nextScheduled, topTrends, approvalQueueDepth };
}

async function getObservabilitySummary() {
  const [publish, tokenRefreshFailures, trend, dashboard, xUsage] = await Promise.all([
    getPublishMetrics(),
    getTokenRefreshFailures(),
    getTrendMetrics(),
    getDashboardSummary(),
    getXUsagePercent()
  ]);
  return { publish, tokenRefreshFailuresLast24h: tokenRefreshFailures, trend, dashboard, xUsage };
}

module.exports = {
  getPublishMetrics,
  getTokenRefreshFailures,
  getTrendMetrics,
  getDashboardSummary,
  getObservabilitySummary
};
