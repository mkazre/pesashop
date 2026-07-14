const crypto = require('crypto');
const axios = require('axios');

// X API v2, OAuth 2.0 with PKCE (Spec Sections 3, 14.3, 25.2). X uses a
// Confidential client, so token exchange is authenticated with HTTP Basic
// (client_id:client_secret) in addition to the PKCE verifier.
const X_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

function requireEnv() {
  const { X_CLIENT_ID, X_CLIENT_SECRET, X_OAUTH_REDIRECT_URI } = process.env;
  if (!X_CLIENT_ID || !X_CLIENT_SECRET || !X_OAUTH_REDIRECT_URI) {
    throw new Error('X_CLIENT_ID, X_CLIENT_SECRET, and X_OAUTH_REDIRECT_URI must all be set');
  }
  return { X_CLIENT_ID, X_CLIENT_SECRET, X_OAUTH_REDIRECT_URI };
}

// PKCE (RFC 7636): a random verifier, and its S256 challenge sent up-front.
// The verifier itself is only sent at token-exchange time.
function generatePkcePair() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  return { codeVerifier, codeChallenge };
}

function buildAuthorizeUrl(state, { codeChallenge }) {
  const { X_CLIENT_ID, X_OAUTH_REDIRECT_URI } = requireEnv();
  if (!codeChallenge) throw new Error('X OAuth requires a PKCE codeChallenge — call generatePkcePair() first');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: X_CLIENT_ID,
    redirect_uri: X_OAUTH_REDIRECT_URI,
    scope: X_SCOPES.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256'
  });
  return `https://twitter.com/i/oauth2/authorize?${params.toString()}`;
}

async function exchangeCodeForToken(code, codeVerifier) {
  const { X_CLIENT_ID, X_CLIENT_SECRET, X_OAUTH_REDIRECT_URI } = requireEnv();
  const basicAuth = Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64');

  const res = await axios.post(
    'https://api.twitter.com/2/oauth2/token',
    new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: X_CLIENT_ID,
      redirect_uri: X_OAUTH_REDIRECT_URI,
      code_verifier: codeVerifier
    }).toString(),
    { headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  // Refresh tokens rotate on every refresh (Spec 14.3) — always persist the new one.
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    expiresInSeconds: res.data.expires_in // ~7200 (2 hours)
  };
}

// Refresh tokens rotate on every use (Spec 14.3) — the caller must persist the
// new refreshToken returned here, not reuse the old one.
async function refreshAccessToken(refreshToken) {
  const { X_CLIENT_ID, X_CLIENT_SECRET } = requireEnv();
  const basicAuth = Buffer.from(`${X_CLIENT_ID}:${X_CLIENT_SECRET}`).toString('base64');
  const res = await axios.post(
    'https://api.twitter.com/2/oauth2/token',
    new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: X_CLIENT_ID }).toString(),
    { headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return {
    accessToken: res.data.access_token,
    refreshToken: res.data.refresh_token,
    expiresInSeconds: res.data.expires_in
  };
}

async function fetchAuthenticatedUser(accessToken) {
  const res = await axios.get('https://api.twitter.com/2/users/me', {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  return { externalId: res.data.data.id, displayName: res.data.data.username };
}

module.exports = {
  platform: 'x',
  requiredEnv: ['X_CLIENT_ID', 'X_CLIENT_SECRET', 'X_OAUTH_REDIRECT_URI'],
  scopes: X_SCOPES,
  generatePkcePair,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  fetchAuthenticatedUser
};
