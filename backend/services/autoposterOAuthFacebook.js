const axios = require('axios');
const { decryptToken } = require('./autoposterTokenCrypto');
const { buildCaption } = require('./autoposterCaptionBuilder');

// Meta Graph API v19+ (Spec Sections 3, 5, 14.1, 25.1). Facebook and Instagram
// share one Meta app (same META_APP_ID/META_APP_SECRET) — this file owns the
// shared OAuth mechanics; autoposterOAuthInstagram.js delegates here and only
// adds Instagram-specific scopes and the IG-business-account resolution step.
// This file is the full PlatformAdapter (Spec 2.2) for Facebook: OAuth,
// publish, and fetchInsights all live together rather than split across
// files, matching the spec's single-interface concept.
const GRAPH_VERSION = 'v19.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

// Well-documented Meta Graph API error codes (developers.facebook.com/docs/graph-api/guides/error-handling).
// 190 = OAuthException (token invalid/expired) -> permanent, needs re-auth.
// 4/17/32/613 = various rate-limit codes -> transient, safe to retry with backoff.
// Anything else defaults to transient (Spec design choice, Phase 4: safer to
// retry an unrecognised error than to silently give up on it).
const RATE_LIMIT_CODES = [4, 17, 32, 613];
const AUTH_ERROR_CODES = [190];

function classifyGraphError(error) {
  const fbError = error.response?.data?.error;
  if (!fbError) return { transient: true, code: 'network_error', message: error.message };
  if (AUTH_ERROR_CODES.includes(fbError.code)) {
    return { transient: false, code: String(fbError.code), message: `Meta OAuthException: ${fbError.message}` };
  }
  const transient = RATE_LIMIT_CODES.includes(fbError.code) || fbError.code >= 500;
  return { transient, code: String(fbError.code), message: fbError.message };
}

function throwClassified(error) {
  const classified = classifyGraphError(error);
  const err = new Error(classified.message);
  err.transient = classified.transient;
  err.platformErrorCode = classified.code;
  throw err;
}

const FACEBOOK_SCOPES = ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'];

function requireEnv() {
  const { META_APP_ID, META_APP_SECRET, META_OAUTH_REDIRECT_URI } = process.env;
  if (!META_APP_ID || !META_APP_SECRET || !META_OAUTH_REDIRECT_URI) {
    throw new Error('META_APP_ID, META_APP_SECRET, and META_OAUTH_REDIRECT_URI must all be set');
  }
  return { META_APP_ID, META_APP_SECRET, META_OAUTH_REDIRECT_URI };
}

function buildAuthorizeUrl(state, { scopes = FACEBOOK_SCOPES } = {}) {
  const { META_APP_ID, META_OAUTH_REDIRECT_URI } = requireEnv();
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: META_OAUTH_REDIRECT_URI,
    state,
    scope: scopes.join(',')
  });
  return `https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
}

// Exchanges the auth code for a short-lived user token, then upgrades it to a
// long-lived (60-day) token per Spec Section 3's "60 days" Facebook/Instagram TTL.
async function exchangeCodeForLongLivedUserToken(code) {
  const { META_APP_ID, META_APP_SECRET, META_OAUTH_REDIRECT_URI } = requireEnv();

  const shortLived = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
    params: { client_id: META_APP_ID, redirect_uri: META_OAUTH_REDIRECT_URI, client_secret: META_APP_SECRET, code }
  });

  const longLived = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      fb_exchange_token: shortLived.data.access_token
    }
  });

  return {
    accessToken: longLived.data.access_token,
    expiresInSeconds: longLived.data.expires_in // ~5184000 (60 days)
  };
}

// Lists the Facebook Pages the user manages, each with its own long-lived Page
// access token — this is what actually gets stored per social_accounts row
// (Spec Section 4.1), not the user token above.
async function fetchManagedPages(userAccessToken) {
  const res = await axios.get(`${GRAPH_BASE}/me/accounts`, {
    params: { access_token: userAccessToken, fields: 'id,name,access_token' }
  });
  return (res.data.data || []).map(page => ({
    externalId: page.id,
    displayName: page.name,
    accessToken: page.access_token // Page tokens don't expire while the user token is valid
  }));
}

// Page tokens inherit the underlying user token's validity. "Refreshing" means
// re-running the long-lived exchange against the still-valid current token to
// push its expiry back out — there is no separate refresh_token grant for Meta.
async function refreshAccessToken(currentAccessToken) {
  const { META_APP_ID, META_APP_SECRET } = requireEnv();
  const res = await axios.get(`${GRAPH_BASE}/oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      fb_exchange_token: currentAccessToken
    }
  });
  return { accessToken: res.data.access_token, expiresInSeconds: res.data.expires_in };
}

// Publishes a target to its Facebook Page (Spec Section 14.1). Picks the
// endpoint based on media present: video -> /videos, image -> /photos,
// otherwise text+link -> /feed. Carousels/multi-image posts are not built
// yet — single image or none only, for this first pass.
async function publish(target, account, post) {
  const accessToken = decryptToken(account.accessTokenEnc);
  const caption = buildCaption(target, post);
  const media = post.mediaRefs || [];
  const video = media.find((m) => m.type === 'video');
  const image = media.find((m) => m.type === 'image');

  let endpoint, params;
  if (video) {
    endpoint = `${GRAPH_BASE}/${account.externalId}/videos`;
    params = { access_token: accessToken, description: caption, file_url: video.url };
  } else if (image) {
    endpoint = `${GRAPH_BASE}/${account.externalId}/photos`;
    params = { access_token: accessToken, caption, url: image.url };
  } else {
    endpoint = `${GRAPH_BASE}/${account.externalId}/feed`;
    params = { access_token: accessToken, message: caption, link: post.linkUrl || undefined };
  }

  try {
    const res = await axios.post(endpoint, null, { params });
    const externalPostId = res.data.post_id || res.data.id;
    return { externalPostId, externalUrl: `https://facebook.com/${externalPostId}` };
  } catch (error) {
    throwClassified(error);
  }
}

// Fetches basic post-level insights (Spec Section 4.4's metric set, as far as
// Meta's post_impressions/post_engaged_users metrics map onto it).
async function fetchInsights(externalPostId, account) {
  const accessToken = decryptToken(account.accessTokenEnc);
  try {
    const res = await axios.get(`${GRAPH_BASE}/${externalPostId}/insights`, {
      params: { access_token: accessToken, metric: 'post_impressions,post_engaged_users' }
    });
    const data = res.data.data || [];
    const metricValue = (name) => data.find((d) => d.name === name)?.values?.[0]?.value || 0;
    return {
      impressions: metricValue('post_impressions'),
      reach: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      clicks: 0,
      raw: res.data
    };
  } catch (error) {
    throwClassified(error);
  }
}

module.exports = {
  platform: 'facebook',
  requiredEnv: ['META_APP_ID', 'META_APP_SECRET', 'META_OAUTH_REDIRECT_URI'],
  scopes: FACEBOOK_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForLongLivedUserToken,
  fetchManagedPages,
  refreshAccessToken,
  publish,
  fetchInsights,
  classifyGraphError // exported for unit testing only
};
