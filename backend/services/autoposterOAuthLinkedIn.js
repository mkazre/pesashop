const axios = require('axios');
const { decryptToken } = require('./autoposterTokenCrypto');
const { buildCaption } = require('./autoposterCaptionBuilder');

// LinkedIn Marketing API (Spec Sections 3, 14.5, 25.3). w_organization_social
// covers Company Page posting, which is PesaShop's actual use case — included
// alongside w_member_social in case a personal-profile posting mode is wanted later.
const LINKEDIN_SCOPES = ['w_member_social', 'w_organization_social'];
const LI_VERSION = '202404';

// LinkedIn's error responses vary by endpoint but generally include a
// `status` field; classify by HTTP status like X, for the same reason
// (more reliable than chasing every endpoint's exact body shape).
function classifyLinkedInError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.message || error.message;
  if (!status) return { transient: true, code: 'network_error', message };
  const transient = status === 429 || status >= 500;
  return { transient, code: String(status), message };
}

function throwClassified(error) {
  const classified = classifyLinkedInError(error);
  const err = new Error(classified.message);
  err.transient = classified.transient;
  err.platformErrorCode = classified.code;
  throw err;
}

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

// Registers and uploads a single image, returning its asset URN for
// reference in the post body (Spec 14.5's two-step image flow).
async function uploadImage(imageUrl, authorUrn, accessToken) {
  const headers = { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': LI_VERSION, 'X-Restli-Protocol-Version': '2.0.0' };

  const initRes = await axios.post(
    'https://api.linkedin.com/rest/images?action=initializeUpload',
    { initializeUploadRequest: { owner: authorUrn } },
    { headers: { ...headers, 'Content-Type': 'application/json' } }
  );
  const { uploadUrl, image: assetUrn } = initRes.data.value;

  const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  await axios.put(uploadUrl, imageRes.data, { headers: { Authorization: `Bearer ${accessToken}` } });

  return assetUrn;
}

// Publishes a post (Spec 14.5). Personal-profile posting (author = the
// connected member) is fully implemented. Company Page posting
// (target.extra.authorType === 'company') needs an organization URN that
// this OAuth flow doesn't resolve yet — flagged as a real gap rather than
// silently posting as the wrong author.
async function publish(target, account, post) {
  if (target.extra?.authorType === 'company') {
    const err = new Error('LinkedIn Company Page posting needs an organization URN, which the current OAuth connection flow does not resolve yet — connect a personal profile for now, or extend the OAuth flow to fetch organizationAcls');
    err.transient = false;
    throw err;
  }

  const accessToken = decryptToken(account.accessTokenEnc);
  const authorUrn = `urn:li:person:${account.externalId}`;
  const caption = buildCaption(target, post);
  const media = post.mediaRefs || [];
  const image = media.find((m) => m.type === 'image');

  const headers = { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': LI_VERSION, 'X-Restli-Protocol-Version': '2.0.0' };

  try {
    const body = {
      author: authorUrn,
      commentary: caption,
      visibility: target.extra?.visibility === 'connections' ? 'CONNECTIONS' : 'PUBLIC',
      distribution: { feedDistribution: 'MAIN_FEED' },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    };

    if (image) {
      const assetUrn = await uploadImage(image.url, authorUrn, accessToken);
      body.content = { media: { id: assetUrn } };
    } else if (post.linkUrl) {
      body.content = { article: { source: post.linkUrl } };
    }

    const res = await axios.post('https://api.linkedin.com/rest/posts', body, { headers: { ...headers, 'Content-Type': 'application/json' } });
    // LinkedIn returns the created post's URN in the x-restli-id response header, not the body.
    const externalPostId = res.headers['x-restli-id'] || res.headers['x-linkedin-id'];
    return { externalPostId, externalUrl: `https://www.linkedin.com/feed/update/${externalPostId}` };
  } catch (error) {
    throwClassified(error);
  }
}

async function fetchInsights(externalPostId, account) {
  const accessToken = decryptToken(account.accessTokenEnc);
  try {
    const res = await axios.get('https://api.linkedin.com/rest/socialMetadata/' + encodeURIComponent(externalPostId), {
      headers: { Authorization: `Bearer ${accessToken}`, 'LinkedIn-Version': LI_VERSION, 'X-Restli-Protocol-Version': '2.0.0' }
    });
    return {
      impressions: 0, // LinkedIn's real impression figures live on the Analytics/organizationalEntityShareStatistics endpoint, not socialMetadata — a Phase 12 refinement
      reach: 0,
      likes: res.data.likesSummary?.totalLikes || 0,
      comments: res.data.commentsSummary?.totalFirstLevelComments || 0,
      shares: 0,
      clicks: 0,
      raw: res.data
    };
  } catch (error) {
    throwClassified(error);
  }
}

module.exports = {
  platform: 'linkedin',
  requiredEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET', 'LINKEDIN_OAUTH_REDIRECT_URI'],
  scopes: LINKEDIN_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchAuthenticatedMember,
  publish,
  fetchInsights,
  classifyLinkedInError // exported for unit testing only
};
