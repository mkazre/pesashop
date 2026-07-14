const axios = require('axios');

// TikTok Content Posting API (Spec Sections 3, 14.4, 25.4). Note TikTok's env
// vars are CLIENT_KEY/CLIENT_SECRET, not CLIENT_ID like the others (Spec 21.1).
// Base API access (this OAuth flow) and Direct Post publishing rights are two
// separate approvals — a connected account here may still be Upload-to-Inbox
// only until Direct Post is separately approved (Spec 25.4).
const TIKTOK_SCOPES = ['user.info.basic', 'video.publish'];

function requireEnv() {
  const { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_OAUTH_REDIRECT_URI } = process.env;
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET || !TIKTOK_OAUTH_REDIRECT_URI) {
    throw new Error('TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TIKTOK_OAUTH_REDIRECT_URI must all be set');
  }
  return { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_OAUTH_REDIRECT_URI };
}

function buildAuthorizeUrl(state) {
  const { TIKTOK_CLIENT_KEY, TIKTOK_OAUTH_REDIRECT_URI } = requireEnv();
  const params = new URLSearchParams({
    client_key: TIKTOK_CLIENT_KEY,
    response_type: 'code',
    scope: TIKTOK_SCOPES.join(','),
    redirect_uri: TIKTOK_OAUTH_REDIRECT_URI,
    state
  });
  return `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_OAUTH_REDIRECT_URI } = requireEnv();
  const res = await axios.post(
    'https://open.tiktokapis.com/v2/oauth/token/',
    new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: TIKTOK_OAUTH_REDIRECT_URI
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    expiresInSeconds: res.data.expires_in, // ~86400 (24 hours)
    externalId: res.data.open_id
  };
}

async function refreshAccessToken(refreshToken) {
  const { TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET } = requireEnv();
  const res = await axios.post(
    'https://open.tiktokapis.com/v2/oauth/token/',
    new URLSearchParams({
      client_key: TIKTOK_CLIENT_KEY,
      client_secret: TIKTOK_CLIENT_SECRET,
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    expiresInSeconds: res.data.expires_in
  };
}

module.exports = {
  platform: 'tiktok',
  requiredEnv: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_OAUTH_REDIRECT_URI'],
  scopes: TIKTOK_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  refreshAccessToken
};
