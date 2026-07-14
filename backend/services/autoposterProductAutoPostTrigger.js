const AutoposterPost = require('../models/AutoposterPost');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterPostProfile = require('../models/AutoposterPostProfile');
const AutoposterCaptionTemplate = require('../models/AutoposterCaptionTemplate');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const { resolveProductPost, resolveMedia, effectiveConfig } = require('./autoposterProductPostResolver');
const { AUTOPOSTER_POST_STATUS, AUTOPOSTER_ACCOUNT_STATUS } = require('../config/constants');

// Direct service call (Spec Section 9.4), not a domain-event bus — per the
// Phase 0 decision, since this codebase has no EventEmitter pattern to plug
// into. Called directly from routes/products.js at the point a product
// transitions into a published state.
//
// Was a product transitioning into "published"? Spec 9.1's product.published
// hook only fires once, at the moment a product first goes live — not on
// every subsequent edit of an already-published product.
function isPublishedState(product) {
  return product.status === 'active' && product.isActive === true;
}

function wasJustPublished(before, after) {
  const wasPublished = before ? isPublishedState(before) : false;
  return !wasPublished && isPublishedState(after);
}

// Creates the auto-post (one AutoposterPost + one AutoposterPostTarget per
// selected, actively-connected platform account) for a product that just
// went live with auto-posting enabled. Never throws — a problem here should
// never block or fail the product save/create request that triggered it.
async function triggerProductAutoPost(product) {
  try {
    if (!product.autoPostEnabled) return null;
    if (!product.autoPostPlatforms || product.autoPostPlatforms.length === 0) return null;

    const profile = product.postProfileId
      ? await AutoposterPostProfile.findById(product.postProfileId)
      : await AutoposterPostProfile.findOne({ isDefault: true });
    if (!profile) {
      console.error(`[autoposter] product ${product._id} has auto-post enabled but no post profile is resolvable (no explicit profile, no store default)`);
      return null;
    }

    const template = product.captionTemplateId ? await AutoposterCaptionTemplate.findById(product.captionTemplateId) : null;

    const accounts = await AutoposterAccount.find({
      platform: { $in: product.autoPostPlatforms },
      status: AUTOPOSTER_ACCOUNT_STATUS.ACTIVE
    });
    if (accounts.length === 0) {
      console.log(`[autoposter] product ${product._id} auto-post skipped — no active connected account for platforms [${product.autoPostPlatforms.join(', ')}]`);
      return null;
    }

    // Media is shared across all targets (Spec 4.2 — mediaRefs lives on the
    // post, not per-target), resolved once using the base profile config.
    const mediaRefs = resolveMedia(product, effectiveConfig(profile, accounts[0].platform));

    const post = await AutoposterPost.create({
      title: `Auto-post: ${product.name}`,
      mediaRefs,
      linkUrl: `${process.env.FRONTEND_URL || 'https://pesashop.com'}/product/${product.slug}`,
      source: 'product_auto',
      sourceRef: String(product._id),
      status: AUTOPOSTER_POST_STATUS.SCHEDULED,
      scheduledFor: new Date() // immediate — the spec's optional "delay before social announce" store setting isn't built in this pass
    });

    const targetDocs = accounts.map((account) => {
      const resolved = resolveProductPost(product, profile, account.platform, template);
      return {
        post: post._id,
        account: account._id,
        platform: account.platform,
        captionOverride: resolved.caption,
        hashtags: resolved.hashtags,
        scheduledFor: post.scheduledFor
      };
    });
    await AutoposterPostTarget.insertMany(targetDocs);

    await AutoposterAuditLog.create({
      action: 'product_auto_post_created',
      entityType: 'AutoposterPost',
      entityId: String(post._id),
      payload: { productId: String(product._id), productName: product.name, platforms: accounts.map((a) => a.platform), profileId: String(profile._id) }
    });

    return post;
  } catch (error) {
    console.error(`[autoposter] product auto-post trigger failed for product ${product._id}:`, error.message);
    return null;
  }
}

module.exports = { triggerProductAutoPost, isPublishedState, wasJustPublished };
