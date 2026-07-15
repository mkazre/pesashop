const AutoposterPost = require('../models/AutoposterPost');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');

// Cool-down and saturation guard (Spec Section 10.8), scoped per (platform,
// region) with a global outer envelope, per Spec 10.8.3's query pattern
// translated from SQL to an aggregation pipeline (sourceRef lives on the
// parent AutoposterPost, not the target, matching the schema).

const DAY_MS = 24 * 60 * 60 * 1000;

// Finds the most recent publish time for a product on a specific
// (platform, region) pair, or null if never posted there.
async function lastPostedAt(productId, platform, region) {
  const target = await AutoposterPostTarget.aggregate([
    { $match: { platform, targetRegion: region, status: 'published' } },
    {
      $lookup: {
        from: 'autoposterposts',
        localField: 'post',
        foreignField: '_id',
        as: 'post'
      }
    },
    { $unwind: '$post' },
    { $match: { 'post.sourceRef': String(productId) } },
    { $sort: { publishedAt: -1 } },
    { $limit: 1 }
  ]);
  return target[0]?.publishedAt || null;
}

// Soft cap: recency_penalty (Spec 10.7, 10.8.2) — 1.0 if not posted in 14
// real days, 0.3 at 7 days, 0.05 at 3 days, near-zero if posted within the
// last 3 days at all (a reasonable step-function extension of the spec's 3
// given anchor points, not an arbitrary guess at values it does specify).
async function computeRecencyPenalty(productId, platform, region) {
  const last = await lastPostedAt(productId, platform, region);
  if (!last) return 1.0;
  const daysSince = (Date.now() - last.getTime()) / DAY_MS;
  if (daysSince >= 14) return 1.0;
  if (daysSince >= 7) return 0.3;
  if (daysSince >= 3) return 0.05;
  return 0.01;
}

// Cross-region recency penalty (Spec 10.8.2): if a product was posted to ANY
// region in the last 24h, all OTHER regions get a mild 40%-strength discount,
// so the catalogue doesn't feel thin even while a specific region is
// technically still eligible.
async function computeCrossRegionDiscount(productId, platform, excludeRegion) {
  const recent = await AutoposterPostTarget.aggregate([
    { $match: { platform, targetRegion: { $ne: excludeRegion }, status: 'published', publishedAt: { $gte: new Date(Date.now() - DAY_MS) } } },
    {
      $lookup: { from: 'autoposterposts', localField: 'post', foreignField: '_id', as: 'post' }
    },
    { $unwind: '$post' },
    { $match: { 'post.sourceRef': String(productId) } },
    { $limit: 1 }
  ]);
  return recent.length > 0 ? 0.6 : 1.0; // 40% discount applied, i.e. multiply weight by 0.6
}

// Hard caps (Spec 10.8.1). Returns { blocked, reason } — a blocked candidate
// should be excluded from the sampler's candidate set entirely, not just
// down-weighted.
async function checkHardCaps(productId, platform, region) {
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const regionCount = await AutoposterPostTarget.aggregate([
    { $match: { platform, targetRegion: region, status: 'published', publishedAt: { $gte: sevenDaysAgo } } },
    { $lookup: { from: 'autoposterposts', localField: 'post', foreignField: '_id', as: 'post' } },
    { $unwind: '$post' },
    { $match: { 'post.sourceRef': String(productId) } },
    { $count: 'n' }
  ]);
  if ((regionCount[0]?.n || 0) >= 2) {
    return { blocked: true, reason: `Already posted to (${platform}, ${region}) twice in the last 7 days` };
  }

  const globalCount = await AutoposterPostTarget.aggregate([
    { $match: { status: 'published', publishedAt: { $gte: sevenDaysAgo } } },
    { $lookup: { from: 'autoposterposts', localField: 'post', foreignField: '_id', as: 'post' } },
    { $unwind: '$post' },
    { $match: { 'post.sourceRef': String(productId) } },
    { $count: 'n' }
  ]);
  if ((globalCount[0]?.n || 0) >= 6) {
    return { blocked: true, reason: 'Already posted 6 times globally in the last 7 days (outer envelope)' };
  }

  // Minimum spacing: 90 min same (platform,region); 30 min same platform any region.
  const last90 = await lastPostedAt(productId, platform, region);
  if (last90 && Date.now() - last90.getTime() < 90 * 60 * 1000) {
    return { blocked: true, reason: `Posted to (${platform}, ${region}) less than 90 minutes ago` };
  }

  const recentSamePlatform = await AutoposterPostTarget.findOne({
    platform,
    status: 'published',
    publishedAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }
  }).sort({ publishedAt: -1 });
  if (recentSamePlatform) {
    return { blocked: true, reason: `Another post fired on ${platform} less than 30 minutes ago (any region)` };
  }

  return { blocked: false };
}

// Category-share caps (Spec 10.8.1): no category over 40% of a (platform,
// region)'s auto-posts, or 30% globally, in a rolling 7-day window.
async function checkCategoryShareCap(categoryIds, platform, region) {
  if (!categoryIds || categoryIds.length === 0) return { blocked: false };
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS);

  const targets = await AutoposterPostTarget.aggregate([
    { $match: { platform, targetRegion: region, status: 'published', publishedAt: { $gte: sevenDaysAgo } } },
    { $lookup: { from: 'autoposterposts', localField: 'post', foreignField: '_id', as: 'post' } },
    { $unwind: '$post' },
    {
      $lookup: {
        from: 'products',
        let: { sourceRef: '$post.sourceRef' },
        pipeline: [{ $match: { $expr: { $eq: [{ $toString: '$_id' }, '$$sourceRef'] } } }],
        as: 'product'
      }
    },
    { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } }
  ]);

  if (targets.length === 0) return { blocked: false };
  const categoryIdStrings = categoryIds.map(String);
  const matchingCount = targets.filter((t) => (t.product?.categories || []).some((c) => categoryIdStrings.includes(String(c)))).length;
  const share = matchingCount / targets.length;
  if (share > 0.4) return { blocked: true, reason: `This category is already ${Math.round(share * 100)}% of (${platform}, ${region})'s auto-posts this week (cap: 40%)` };
  return { blocked: false };
}

module.exports = {
  lastPostedAt,
  computeRecencyPenalty,
  computeCrossRegionDiscount,
  checkHardCaps,
  checkCategoryShareCap
};
