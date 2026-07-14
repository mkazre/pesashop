const axios = require('axios');
const facebookOAuth = require('./autoposterOAuthFacebook');

// Instagram Business accounts are accessed via their linked Facebook Page (Spec
// Section 1.3.1, 14.2) — same Meta app, same OAuth mechanics as Facebook, just
// with IG scopes added and an extra step to resolve each Page's linked IG
// Business Account ID. Deliberately thin: reuses facebookOAuth for everything
// except the scope list and the IG-account lookup.
const INSTAGRAM_SCOPES = ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'];

function buildAuthorizeUrl(state) {
  return facebookOAuth.buildAuthorizeUrl(state, { scopes: INSTAGRAM_SCOPES });
}

// Given a Facebook Page ID + its Page access token, resolves the linked
// Instagram Business Account (if any). Returns null if the Page has no linked
// IG Business account.
async function resolveInstagramBusinessAccount(pageId, pageAccessToken) {
  const res = await axios.get(`https://graph.facebook.com/v19.0/${pageId}`, {
    params: { fields: 'instagram_business_account', access_token: pageAccessToken }
  });
  const igAccount = res.data.instagram_business_account;
  if (!igAccount) return null;
  return { externalId: igAccount.id, accessToken: pageAccessToken }; // IG publishing uses the Page token
}

module.exports = {
  platform: 'instagram',
  requiredEnv: facebookOAuth.requiredEnv,
  scopes: INSTAGRAM_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForLongLivedUserToken: facebookOAuth.exchangeCodeForLongLivedUserToken,
  fetchManagedPages: facebookOAuth.fetchManagedPages,
  refreshAccessToken: facebookOAuth.refreshAccessToken,
  resolveInstagramBusinessAccount
};
