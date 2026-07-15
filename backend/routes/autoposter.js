const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/auth');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterOAuthState = require('../models/AutoposterOAuthState');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const AutoposterPost = require('../models/AutoposterPost');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterPostProfile = require('../models/AutoposterPostProfile');
const AutoposterCaptionTemplate = require('../models/AutoposterCaptionTemplate');
const AutoposterDesign = require('../models/AutoposterDesign');
const AutoposterTrend = require('../models/AutoposterTrend');
const { runTrendIngestion } = require('../services/autoposterTrendIngestionRun');
const { runTrendSampling } = require('../services/autoposterTrendSamplingRun');
const AutoposterDecision = require('../models/AutoposterDecision');
const {
  listApprovalQueue,
  approveDecision,
  rejectDecision,
  snoozeDecision,
  isKillSwitchEngaged,
  setKillSwitch
} = require('../services/autoposterApprovalQueue');
const Product = require('../models/Product');
const { resolveProductPost } = require('../services/autoposterProductPostResolver');
const { encryptToken } = require('../services/autoposterTokenCrypto');
const {
  AUTOPOSTER_PLATFORMS,
  AUTOPOSTER_ACCOUNT_STATUS,
  AUTOPOSTER_POST_STATUS,
  AUTOPOSTER_TARGET_STATUS,
  AUTOPOSTER_CAPTION_LIMITS
} = require('../config/constants');

const facebookOAuth = require('../services/autoposterOAuthFacebook');
const instagramOAuth = require('../services/autoposterOAuthInstagram');
const xOAuth = require('../services/autoposterOAuthX');
const linkedinOAuth = require('../services/autoposterOAuthLinkedIn');
const tiktokOAuth = require('../services/autoposterOAuthTikTok');

const ADAPTERS = {
  facebook: facebookOAuth,
  instagram: instagramOAuth,
  x: xOAuth,
  linkedin: linkedinOAuth,
  tiktok: tiktokOAuth
};

function getAdapter(platform) {
  const adapter = ADAPTERS[platform];
  if (!adapter) {
    const err = new Error(`Unknown platform: ${platform}. Must be one of ${Object.values(AUTOPOSTER_PLATFORMS).join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  return adapter;
}

// Exchanges the auth code for tokens and resolves the concrete account(s) to
// store. Facebook/Instagram can resolve to multiple Pages from one OAuth grant;
// the others resolve to exactly one account.
async function resolveAccountsForPlatform(platform, adapter, code, codeVerifier) {
  if (platform === 'facebook') {
    const { accessToken } = await adapter.exchangeCodeForLongLivedUserToken(code);
    const pages = await adapter.fetchManagedPages(accessToken);
    return pages.map(p => ({ externalId: p.externalId, displayName: p.displayName, accessToken: p.accessToken }));
  }
  if (platform === 'instagram') {
    const { accessToken } = await adapter.exchangeCodeForLongLivedUserToken(code);
    const pages = await adapter.fetchManagedPages(accessToken);
    const resolved = [];
    for (const page of pages) {
      const ig = await adapter.resolveInstagramBusinessAccount(page.externalId, page.accessToken);
      if (ig) resolved.push({ externalId: ig.externalId, displayName: `${page.displayName} (Instagram)`, accessToken: ig.accessToken });
    }
    return resolved;
  }
  if (platform === 'x') {
    const tokenSet = await adapter.exchangeCodeForToken(code, codeVerifier);
    const user = await adapter.fetchAuthenticatedUser(tokenSet.accessToken);
    return [{ externalId: user.externalId, displayName: user.displayName, ...tokenSet }];
  }
  if (platform === 'linkedin') {
    const tokenSet = await adapter.exchangeCodeForToken(code);
    const member = await adapter.fetchAuthenticatedMember(tokenSet.accessToken);
    return [{ externalId: member.externalId, displayName: member.displayName, ...tokenSet }];
  }
  if (platform === 'tiktok') {
    const tokenSet = await adapter.exchangeCodeForToken(code);
    return [{ externalId: tokenSet.externalId, displayName: 'TikTok Account', ...tokenSet }];
  }
  throw new Error(`No account resolver implemented for platform ${platform}`);
}

// GET /api/autoposter/oauth/:platform/start — admin-authenticated, returns the
// platform authorize URL for the frontend to redirect the browser to.
router.get('/oauth/:platform/start', protect, adminOnly, async (req, res) => {
  try {
    const { platform } = req.params;
    const adapter = getAdapter(platform);

    const state = crypto.randomBytes(24).toString('hex');
    let codeChallenge;
    let codeVerifier;

    if (platform === 'x') {
      const pkce = adapter.generatePkcePair();
      codeVerifier = pkce.codeVerifier;
      codeChallenge = pkce.codeChallenge;
    }

    const url = platform === 'x'
      ? adapter.buildAuthorizeUrl(state, { codeChallenge })
      : adapter.buildAuthorizeUrl(state);

    await AutoposterOAuthState.create({ state, platform, codeVerifier, initiatedBy: req.user._id });

    res.json({ success: true, url });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

// GET /api/autoposter/oauth/:platform/callback — public. The platform redirects
// the browser here directly (no bearer token available); the `state` value
// minted during /start is the CSRF/authenticity guard instead.
//
// IMPORTANT: Facebook and Instagram share one Meta app and therefore one
// registered redirect URI (Meta's dashboard requires an exact match — you can't
// register two). Whichever :platform segment happens to be in that shared URI,
// this handler does NOT trust req.params.platform to decide facebook vs
// instagram — it looks up the true platform from the stored OAuth state
// (set correctly at /start time, based on which "Connect X" button was
// clicked), since that's the only thing here we haven't received from an
// unauthenticated redirect.
router.get('/oauth/:platform/callback', async (req, res) => {
  const adminUrl = process.env.ADMIN_URL || 'http://localhost:3005';
  let platform; // resolved from stored state below, not from req.params — see note above

  try {
    const { code, state, error: platformError } = req.query;

    if (platformError) {
      return res.redirect(`${adminUrl}/autoposter/accounts?error=${encodeURIComponent(platformError)}`);
    }

    const storedState = await AutoposterOAuthState.findOneAndDelete({ state });
    if (!storedState) {
      return res.redirect(`${adminUrl}/autoposter/accounts?error=invalid_or_expired_state`);
    }

    platform = storedState.platform;
    const adapter = getAdapter(platform);
    const accounts = await resolveAccountsForPlatform(platform, adapter, code, storedState.codeVerifier);

    for (const acc of accounts) {
      await AutoposterAccount.findOneAndUpdate(
        { platform, externalId: acc.externalId },
        {
          platform,
          externalId: acc.externalId,
          displayName: acc.displayName,
          accessTokenEnc: encryptToken(acc.accessToken),
          refreshTokenEnc: acc.refreshToken ? encryptToken(acc.refreshToken) : undefined,
          tokenExpiresAt: acc.expiresInSeconds ? new Date(Date.now() + acc.expiresInSeconds * 1000) : undefined,
          scopes: adapter.scopes,
          status: AUTOPOSTER_ACCOUNT_STATUS.ACTIVE
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      await AutoposterAuditLog.create({
        actor: storedState.initiatedBy,
        action: 'connect_account',
        entityType: 'AutoposterAccount',
        entityId: acc.externalId,
        payload: { platform, displayName: acc.displayName }
      });
    }

    res.redirect(`${adminUrl}/autoposter/accounts?connected=${platform}`);
  } catch (error) {
    console.error(`[autoposter] OAuth callback error (${platform}):`, error.message);
    res.redirect(`${adminUrl}/autoposter/accounts?error=${encodeURIComponent(error.message)}`);
  }
});

// GET /api/autoposter/accounts — list connected accounts. Token fields are
// select:false on the schema, so they never leave the database via this route.
router.get('/accounts', protect, adminOnly, async (req, res) => {
  try {
    const accounts = await AutoposterAccount.find().sort({ createdAt: -1 });
    res.json({ success: true, data: accounts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/autoposter/accounts/:id — disconnect/revoke.
router.delete('/accounts/:id', protect, adminOnly, async (req, res) => {
  try {
    const account = await AutoposterAccount.findByIdAndDelete(req.params.id);
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    await AutoposterAuditLog.create({
      actor: req.user._id,
      action: 'disconnect_account',
      entityType: 'AutoposterAccount',
      entityId: String(account._id),
      payload: { platform: account.platform, displayName: account.displayName }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/autoposter/accounts/:id/refresh — force a token refresh.
router.post('/accounts/:id/refresh', protect, adminOnly, async (req, res) => {
  try {
    const account = await AutoposterAccount.findById(req.params.id).select('+accessTokenEnc +refreshTokenEnc');
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });

    const adapter = getAdapter(account.platform);
    if (typeof adapter.refreshAccessToken !== 'function') {
      return res.status(400).json({
        success: false,
        message: `${account.platform} does not support programmatic refresh — reconnect via OAuth instead`
      });
    }

    const { decryptToken } = require('../services/autoposterTokenCrypto');
    const currentSecret = account.refreshTokenEnc
      ? decryptToken(account.refreshTokenEnc)
      : decryptToken(account.accessTokenEnc); // Facebook/Instagram refresh from the current access token, not a refresh token

    const refreshed = await adapter.refreshAccessToken(currentSecret);

    account.accessTokenEnc = encryptToken(refreshed.accessToken);
    if (refreshed.refreshToken) account.refreshTokenEnc = encryptToken(refreshed.refreshToken);
    if (refreshed.expiresInSeconds) account.tokenExpiresAt = new Date(Date.now() + refreshed.expiresInSeconds * 1000);
    account.status = AUTOPOSTER_ACCOUNT_STATUS.ACTIVE;
    await account.save();

    await AutoposterAuditLog.create({
      actor: req.user._id,
      action: 'refresh_token',
      entityType: 'AutoposterAccount',
      entityId: String(account._id),
      payload: { platform: account.platform }
    });

    res.json({ success: true, data: { tokenExpiresAt: account.tokenExpiresAt } });
  } catch (error) {
    // A failed refresh means the account needs re-auth, not a 500 the admin can't act on.
    await AutoposterAccount.findByIdAndUpdate(req.params.id, { status: AUTOPOSTER_ACCOUNT_STATUS.NEEDS_REAUTH });
    res.status(400).json({ success: false, message: `Refresh failed, marked needs_reauth: ${error.message}` });
  }
});

// ─── Composer / Posts (Spec Sections 6, 15) ────────────────────────────────

// Validates each target's effective caption (override, falling back to the
// shared base caption) against its platform's hard limit (Spec 6.4). X's
// limit is skipped when a target is in thread mode, since thread mode splits
// the caption across multiple tweets client-side instead of one hard cap.
function validateCaptionLengths(baseCaption, targets) {
  const errors = [];
  for (const target of targets) {
    const caption = target.captionOverride || baseCaption || '';
    const limit = AUTOPOSTER_CAPTION_LIMITS[target.platform];
    const isThreadMode = target.platform === 'x' && target.extra?.threadMode;
    if (limit && !isThreadMode && caption.length > limit) {
      errors.push(`${target.platform}: caption is ${caption.length} characters, limit is ${limit}`);
    }
  }
  return errors;
}

// POST /api/autoposter/posts — create a draft or scheduled post with one
// target per selected platform.
router.post('/posts', protect, adminOnly, async (req, res) => {
  try {
    const { title, baseCaption, mediaRefs, linkUrl, scheduledFor, targets } = req.body;

    if (!Array.isArray(targets) || targets.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one platform target is required' });
    }

    const captionErrors = validateCaptionLengths(baseCaption, targets);
    if (captionErrors.length > 0) {
      return res.status(400).json({ success: false, message: captionErrors.join('; ') });
    }

    const post = await AutoposterPost.create({
      title,
      baseCaption,
      mediaRefs: mediaRefs || [],
      linkUrl,
      source: 'manual',
      scheduledFor: scheduledFor || undefined,
      status: scheduledFor ? AUTOPOSTER_POST_STATUS.SCHEDULED : AUTOPOSTER_POST_STATUS.DRAFT,
      createdBy: req.user._id
    });

    const createdTargets = await AutoposterPostTarget.insertMany(
      targets.map(t => ({
        post: post._id,
        account: t.account,
        platform: t.platform,
        targetRegion: t.targetRegion,
        captionOverride: t.captionOverride,
        hashtags: t.hashtags,
        firstComment: t.firstComment,
        extra: t.extra,
        scheduledFor: t.scheduledFor || scheduledFor || undefined
      }))
    );

    await AutoposterAuditLog.create({
      actor: req.user._id,
      action: 'create_post',
      entityType: 'AutoposterPost',
      entityId: String(post._id),
      payload: { platforms: targets.map(t => t.platform), status: post.status }
    });

    res.status(201).json({ success: true, data: { ...post.toObject(), targets: createdTargets } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/autoposter/posts — list posts, optionally filtered by status,
// platform, or a created-date range. Each post gets a lightweight targets
// summary (platform + status only) for the list view.
router.get('/posts', protect, adminOnly, async (req, res) => {
  try {
    const { status, platform, from, to } = req.query;
    const query = {};
    if (status) query.status = status;
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    let posts = await AutoposterPost.find(query).sort({ createdAt: -1 }).lean();

    if (platform) {
      const matchingPostIds = new Set((await AutoposterPostTarget.find({ platform }).distinct('post')).map(String));
      posts = posts.filter(p => matchingPostIds.has(String(p._id)));
    }

    const allTargets = await AutoposterPostTarget.find({ post: { $in: posts.map(p => p._id) } })
      .select('post platform status')
      .lean();
    const targetsByPost = allTargets.reduce((acc, t) => {
      const key = String(t.post);
      (acc[key] = acc[key] || []).push({ platform: t.platform, status: t.status });
      return acc;
    }, {});

    res.json({ success: true, data: posts.map(p => ({ ...p, targets: targetsByPost[String(p._id)] || [] })) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/autoposter/posts/:id — full post + targets (account populated).
router.get('/posts/:id', protect, adminOnly, async (req, res) => {
  try {
    const post = await AutoposterPost.findById(req.params.id).lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const targets = await AutoposterPostTarget.find({ post: post._id })
      .populate('account', 'platform displayName status')
      .lean();

    res.json({ success: true, data: { ...post, targets } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /api/autoposter/posts/:id — edit before publish. Replaces the full
// targets set when `targets` is provided, same as the create shape.
router.patch('/posts/:id', protect, adminOnly, async (req, res) => {
  try {
    const post = await AutoposterPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });
    if (![AUTOPOSTER_POST_STATUS.DRAFT, AUTOPOSTER_POST_STATUS.SCHEDULED].includes(post.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit a post with status "${post.status}"` });
    }

    const { title, baseCaption, mediaRefs, linkUrl, scheduledFor, targets } = req.body;

    if (targets) {
      const captionErrors = validateCaptionLengths(baseCaption ?? post.baseCaption, targets);
      if (captionErrors.length > 0) {
        return res.status(400).json({ success: false, message: captionErrors.join('; ') });
      }
    }

    if (title !== undefined) post.title = title;
    if (baseCaption !== undefined) post.baseCaption = baseCaption;
    if (mediaRefs !== undefined) post.mediaRefs = mediaRefs;
    if (linkUrl !== undefined) post.linkUrl = linkUrl;
    if (scheduledFor !== undefined) {
      post.scheduledFor = scheduledFor || undefined;
      post.status = scheduledFor ? AUTOPOSTER_POST_STATUS.SCHEDULED : AUTOPOSTER_POST_STATUS.DRAFT;
    }
    await post.save();

    if (targets) {
      await AutoposterPostTarget.deleteMany({ post: post._id });
      await AutoposterPostTarget.insertMany(
        targets.map(t => ({
          post: post._id,
          account: t.account,
          platform: t.platform,
          targetRegion: t.targetRegion,
          captionOverride: t.captionOverride,
          hashtags: t.hashtags,
          firstComment: t.firstComment,
          extra: t.extra,
          scheduledFor: t.scheduledFor || post.scheduledFor || undefined
        }))
      );
    }

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/autoposter/posts/:id — cancel. A never-published draft is
// hard-deleted (nothing to preserve); anything already scheduled is marked
// cancelled instead, so there's a record of what was scheduled and pulled.
router.delete('/posts/:id', protect, adminOnly, async (req, res) => {
  try {
    const post = await AutoposterPost.findById(req.params.id);
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    const previousStatus = post.status;
    if (previousStatus === AUTOPOSTER_POST_STATUS.DRAFT) {
      await AutoposterPostTarget.deleteMany({ post: post._id });
      await post.deleteOne();
    } else {
      post.status = AUTOPOSTER_POST_STATUS.CANCELLED;
      await post.save();
      await AutoposterPostTarget.updateMany(
        { post: post._id, status: AUTOPOSTER_TARGET_STATUS.PENDING },
        { status: AUTOPOSTER_TARGET_STATUS.SKIPPED }
      );
    }

    await AutoposterAuditLog.create({
      actor: req.user._id,
      action: 'cancel_post',
      entityType: 'AutoposterPost',
      entityId: String(post._id),
      payload: { previousStatus }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/autoposter/posts/:id/publish-now — stubbed 501. The scheduling
// engine (Phase 4) and platform adapters (Phase 5) don't exist yet, so there
// is nothing that can actually publish. The post itself is already saved via
// POST /posts — this endpoint just can't act on it yet, honestly.
router.post('/posts/:id/publish-now', protect, adminOnly, async (req, res) => {
  const post = await AutoposterPost.findById(req.params.id);
  if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

  res.status(501).json({
    success: false,
    message: 'Publishing isn\'t available yet — the scheduling engine (Phase 4) and platform adapters (Phase 5) haven\'t been built. This post is saved and will be publishable once those land.'
  });
});

// GET /api/autoposter/queue-status — visibility into the publisher worker
// (Spec 27.3's per-worker health endpoint concept, adapted: there's one
// in-process worker here, not a separate process/port, so this is a status
// summary rather than a liveness probe).
router.get('/queue-status', protect, adminOnly, async (req, res) => {
  try {
    const [pending, publishing, published24h, failed24h] = await Promise.all([
      AutoposterPostTarget.countDocuments({ status: AUTOPOSTER_TARGET_STATUS.PENDING }),
      AutoposterPostTarget.countDocuments({ status: AUTOPOSTER_TARGET_STATUS.PUBLISHING }),
      AutoposterPostTarget.countDocuments({ status: AUTOPOSTER_TARGET_STATUS.PUBLISHED, publishedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      AutoposterPostTarget.countDocuments({ status: AUTOPOSTER_TARGET_STATUS.FAILED, updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);
    res.json({ success: true, data: { pending, publishing, published24h, failed24h } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Product Post Profiles (Spec Section 9.5.2) ────────────────────────────
router.get('/profiles', protect, adminOnly, async (req, res) => {
  try {
    const profiles = await AutoposterPostProfile.find().sort({ isDefault: -1, name: 1 });
    res.json({ success: true, data: profiles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/profiles', protect, adminOnly, async (req, res) => {
  try {
    const profile = await AutoposterPostProfile.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/profiles/:id', protect, adminOnly, async (req, res) => {
  try {
    const profile = await AutoposterPostProfile.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    res.json({ success: true, data: profile });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/profiles/:id', protect, adminOnly, async (req, res) => {
  try {
    const profile = await AutoposterPostProfile.findById(req.params.id);
    if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
    if (profile.isDefault) return res.status(400).json({ success: false, message: 'Cannot delete the default profile — set a different profile as default first' });
    await profile.deleteOne();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Caption Templates (Spec Section 9.3) ──────────────────────────────────
router.get('/caption-templates', protect, adminOnly, async (req, res) => {
  try {
    const templates = await AutoposterCaptionTemplate.find().sort({ name: 1 });
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/caption-templates', protect, adminOnly, async (req, res) => {
  try {
    const template = await AutoposterCaptionTemplate.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.put('/caption-templates/:id', protect, adminOnly, async (req, res) => {
  try {
    const template = await AutoposterCaptionTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/caption-templates/:id', protect, adminOnly, async (req, res) => {
  try {
    await AutoposterCaptionTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/autoposter/products/:id/preview — renders the resolved caption per
// selected platform exactly as an auto-post would generate it (Spec 9.5.5),
// without creating any post. Query params: profileId (optional, falls back
// to the store default), templateId (optional), platforms (comma-separated).
router.get('/products/:id/preview', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('categories', 'name');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const profile = req.query.profileId
      ? await AutoposterPostProfile.findById(req.query.profileId)
      : await AutoposterPostProfile.findOne({ isDefault: true });
    if (!profile) return res.status(400).json({ success: false, message: 'No profile available to preview with' });

    const template = req.query.templateId ? await AutoposterCaptionTemplate.findById(req.query.templateId) : null;
    const platforms = (req.query.platforms || '').split(',').map((p) => p.trim()).filter(Boolean);
    if (platforms.length === 0) return res.status(400).json({ success: false, message: 'At least one platform is required to preview' });

    const preview = platforms.map((platform) => {
      const resolved = resolveProductPost(product, profile, platform, template);
      return { platform, caption: resolved.caption, hashtags: resolved.hashtags, media: resolved.media };
    });

    res.json({ success: true, data: preview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Visual Post Designer — Designs Library (Spec Section 7.5) ─────────────
router.get('/designs', protect, adminOnly, async (req, res) => {
  try {
    const query = {};
    if (req.query.templatesOnly === 'true') query.templateFlag = true;
    const designs = await AutoposterDesign.find(query).sort({ updatedAt: -1 });
    res.json({ success: true, data: designs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/designs/:id', protect, adminOnly, async (req, res) => {
  try {
    const design = await AutoposterDesign.findById(req.params.id);
    if (!design) return res.status(404).json({ success: false, message: 'Design not found' });
    res.json({ success: true, data: design });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/designs', protect, adminOnly, async (req, res) => {
  try {
    const design = await AutoposterDesign.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: design });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// PUT also serves the auto-save flow (Spec 7.4 — every 10 seconds).
router.put('/designs/:id', protect, adminOnly, async (req, res) => {
  try {
    const design = await AutoposterDesign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!design) return res.status(404).json({ success: false, message: 'Design not found' });
    res.json({ success: true, data: design });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.delete('/designs/:id', protect, adminOnly, async (req, res) => {
  try {
    await AutoposterDesign.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Trend Engine (Spec Section 13) ────────────────────────────────────────
router.get('/trends', protect, adminOnly, async (req, res) => {
  try {
    const { sensitivity, audience, minScore } = req.query;
    const query = { active: true };
    if (sensitivity) query.sensitivityFlag = sensitivity;
    if (audience) query.audience = audience;
    if (minScore) query.trendScore = { $gte: parseFloat(minScore) };
    const trends = await AutoposterTrend.find(query).sort({ trendScore: -1 }).limit(100);
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/autoposter/trends/refresh — force an ingestion run outside the
// hourly cron schedule (Spec 13's admin-triggered refresh).
router.post('/trends/refresh', protect, adminOnly, async (req, res) => {
  try {
    const result = await runTrendIngestion();
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/autoposter/trends/sample — runs matching + safety + weighted
// sampling (Spec 10.6-10.8, 10.10 layer 3) and records the full decision
// audit trail (Spec 11.4). Doesn't create real posts yet — caption
// generation and the approval queue are Phase 10.
router.post('/trends/sample', protect, adminOnly, async (req, res) => {
  try {
    const { platforms, region, sampleCount } = req.body || {};
    const result = await runTrendSampling({ platforms, region, sampleCount });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/decisions', protect, adminOnly, async (req, res) => {
  try {
    const query = {};
    if (req.query.runId) query.runId = req.query.runId;
    if (req.query.selected !== undefined) query.selected = req.query.selected === 'true';
    const decisions = await AutoposterDecision.find(query)
      .populate('trend', 'term trendScore')
      .populate('product', 'name slug')
      .sort({ weight: -1 })
      .limit(200);
    res.json({ success: true, data: decisions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Human-in-the-Loop Approval Queue (Spec Sections 10.11, 12.2, 13) ──────
router.get('/approvals', protect, adminOnly, async (req, res) => {
  try {
    const queue = await listApprovalQueue();
    res.json({ success: true, data: queue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/approvals/:id/approve', protect, adminOnly, async (req, res) => {
  try {
    const result = await approveDecision(req.params.id, req.user._id, { editedCaption: req.body?.editedCaption });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.post('/approvals/:id/reject', protect, adminOnly, async (req, res) => {
  try {
    const decision = await rejectDecision(req.params.id, req.user._id, { reason: req.body?.reason, banTrend: !!req.body?.banTrend });
    res.json({ success: true, data: decision });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.post('/approvals/:id/snooze', protect, adminOnly, async (req, res) => {
  try {
    const decision = await snoozeDecision(req.params.id, req.body?.minutes || 60);
    res.json({ success: true, data: decision });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Kill switch (Spec Sections 10.11, 12.5, 13) ───────────────────────────
router.get('/engine/status', protect, adminOnly, async (req, res) => {
  try {
    res.json({ success: true, data: { killSwitchEngaged: await isKillSwitchEngaged() } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/engine/pause', protect, adminOnly, async (req, res) => {
  try {
    await setKillSwitch(true, req.user._id);
    res.json({ success: true, data: { killSwitchEngaged: true } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/engine/resume', protect, adminOnly, async (req, res) => {
  try {
    await setKillSwitch(false, req.user._id);
    res.json({ success: true, data: { killSwitchEngaged: false } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.validateCaptionLengths = validateCaptionLengths; // exported for unit testing only
