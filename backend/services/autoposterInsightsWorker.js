const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterPost = require('../models/AutoposterPost');
const AutoposterInsight = require('../models/AutoposterInsight');
const AutoposterVariantPerformance = require('../models/AutoposterVariantPerformance');
const AutoposterAccount = require('../models/AutoposterAccount');
const Product = require('../models/Product');
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

// Feedback loop (Spec 10.9.2, 11.6, Phase 12): feeds ONE mature engagement
// figure per post into the (platform, category, variantStyle) A/B
// aggregate — deliberately only the 7d snapshot, not every window. 1h/24h
// are still-growing numbers; folding them in too would count the same
// post's engagement multiple times and skew the aggregate toward whichever
// style happens to get posted more often, not whichever style performs
// better. A post with no variantStyle (manually composed, not through the
// trend engine) or no product category simply isn't scored — nothing to
// group it by.
async function recordVariantPerformance(target, metrics) {
  const post = await AutoposterPost.findById(target.post);
  if (!post?.variantStyle) return;

  const product = post.sourceRef ? await Product.findById(post.sourceRef).select('categories') : null;
  const category = product?.categories?.[0];
  if (!category) return;

  const engagement = (metrics?.likes || 0) + (metrics?.comments || 0) + (metrics?.shares || 0) + (metrics?.clicks || 0);

  await AutoposterVariantPerformance.findOneAndUpdate(
    { platform: target.platform, category: String(category), variantStyle: post.variantStyle },
    { $inc: { postsCount: 1, totalEngagement: engagement }, $set: { lastUpdated: new Date() } },
    { upsert: true }
  );
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
      const account = await AutoposterAccount.findById(target.account);
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
      if (w.key === '7d') await recordVariantPerformance(target, metrics);
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

module.exports = { runInsightsCollection, collectInsightsForTarget, windowsAlreadyCaptured, recordVariantPerformance, WINDOWS };
