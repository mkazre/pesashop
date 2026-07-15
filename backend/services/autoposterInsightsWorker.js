const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterInsight = require('../models/AutoposterInsight');
const { getAdapter } = require('./autoposterAdapterRegistry');

// Insights worker (Spec Section 4.4, 12.4, Phase 12): scheduled fetches at
// 1h/24h/7d post-publish. Each window is fetched at most once per target —
// a snapshot already captured for a window is never re-fetched, so a target
// naturally "graduates" through 1h -> 24h -> 7d over real time.
const WINDOWS = [
  { key: '1h', afterMs: 60 * 60 * 1000 },
  { key: '24h', afterMs: 24 * 60 * 60 * 1000 },
  { key: '7d', afterMs: 7 * 24 * 60 * 60 * 1000 }
];

async function windowsAlreadyCaptured(postTargetId) {
  const snapshots = await AutoposterInsight.find({ postTarget: postTargetId }).select('raw.window');
  return new Set(snapshots.map((s) => s.raw?.window).filter(Boolean));
}

// Fetches and stores exactly the insight windows that are now due for one
// published target. Missing platform credentials degrade gracefully (logs,
// skips) rather than throwing — same pattern as every other adapter call.
async function collectInsightsForTarget(target) {
  if (!target.publishedAt) return { fetched: 0 };
  const captured = await windowsAlreadyCaptured(target._id);
  const elapsedMs = Date.now() - target.publishedAt.getTime();

  let fetched = 0;
  for (const w of WINDOWS) {
    if (captured.has(w.key)) continue;
    if (elapsedMs < w.afterMs) continue;

    try {
      const adapter = getAdapter(target.platform);
      if (!adapter.fetchInsights) continue;
      const account = await require('../models/AutoposterAccount').findById(target.account);
      const metrics = await adapter.fetchInsights(target.externalPostId, account);
      await AutoposterInsight.create({
        postTarget: target._id,
        impressions: metrics?.impressions,
        reach: metrics?.reach,
        likes: metrics?.likes,
        comments: metrics?.comments,
        shares: metrics?.shares,
        clicks: metrics?.clicks,
        raw: { ...metrics, window: w.key }
      });
      fetched++;
    } catch (error) {
      console.error(`[autoposter-insights] fetch failed for target ${target._id} (${w.key}):`, error.message);
    }
  }
  return { fetched };
}

async function runInsightsCollection() {
  const targets = await AutoposterPostTarget.find({
    status: 'published',
    publishedAt: { $gte: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) } // nothing older than 7d+buffer ever needs a new window
  });

  let totalFetched = 0;
  for (const target of targets) {
    const { fetched } = await collectInsightsForTarget(target);
    totalFetched += fetched;
  }
  return { targetsChecked: targets.length, snapshotsFetched: totalFetched };
}

module.exports = { runInsightsCollection, collectInsightsForTarget, windowsAlreadyCaptured, WINDOWS };
