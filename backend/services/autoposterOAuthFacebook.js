const axios = require('axios');

// Meta Graph API v19+ (Spec Sections 3, 5, 14.1, 25.1). Facebook and Instagram
// share one Meta app (same META_APP_ID/META_APP_SECRET) — this file owns the
// shared OAuth mechanics; autoposterOAuthInstagram.js delegates here and only
// adds Instagram-specific scopes and the IG-business-account resolution step.
const GRAPH_VERSION = 'v19.0';
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

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

module.exports = {
  platform: 'facebook',
  requiredEnv: ['META_APP_ID', 'META_APP_SECRET', 'META_OAUTH_REDIRECT_URI'],
  scopes: FACEBOOK_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForLongLivedUserToken,
  fetchManagedPages,
  refreshAccessToken
};
