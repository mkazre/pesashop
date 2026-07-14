const axios = require('axios');

// LinkedIn Marketing API (Spec Sections 3, 14.5, 25.3). w_organization_social
// covers Company Page posting, which is PesaShop's actual use case — included
// alongside w_member_social in case a personal-profile posting mode is wanted later.
const LINKEDIN_SCOPES = ['w_member_social', 'w_organization_social'];

function requireEnv() {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_OAUTH_REDIRECT_URI } = process.env;
  if (!LINKEDIN_CLIENT_ID || !LINKEDIN_CLIENT_SECRET || !LINKEDIN_OAUTH_REDIRECT_URI) {
    throw new Error('LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, and LINKEDIN_OAUTH_REDIRECT_URI must all be set');
  }
  return { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_OAUTH_REDIRECT_URI };
}

function buildAuthorizeUrl(state) {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_OAUTH_REDIRECT_URI } = requireEnv();
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: LINKEDIN_CLIENT_ID,
    redirect_uri: LINKEDIN_OAUTH_REDIRECT_URI,
    state,
    scope: LINKEDIN_SCOPES.join(' ')
  });
  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const { LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_OAUTH_REDIRECT_URI } = requireEnv();
  const res = await axios.post(
    'https://www.linkedin.com/oauth/v2/accessToken',
    new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: LINKEDIN_OAUTH_REDIRECT_URI,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET
    }).toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return {
    accessToken: res.data.access_token,
    expiresInSeconds: res.data.expires_in // ~5184000 (60 days)
  };
}

async function fetchAuthenticatedMember(accessToken) {
  const res = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': '202404' }
  });
  return { externalId: res.data.sub, displayName: res.data.name };
}

module.exports = {
  platform: 'linkedin',
  requiredEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_OAUTH_REDIRECT_URI'],
  scopes: LINKEDIN_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchAuthenticatedMember
};
