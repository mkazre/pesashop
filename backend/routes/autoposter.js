const express = require('express');
const crypto = require('crypto');
const router = express.Router();

const { protect, adminOnly } = require('../middleware/auth');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterOAuthState = require('../models/AutoposterOAuthState');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const { encryptToken } = require('../services/autoposterTokenCrypto');
const { AUTOPOSTER_PLATFORMS, AUTOPOSTER_ACCOUNT_STATUS } = require('../config/constants');

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

module.exports = router;
