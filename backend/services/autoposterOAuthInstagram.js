const axios = require('axios');
const facebookOAuth = require('./autoposterOAuthFacebook');
const { decryptToken } = require('./autoposterTokenCrypto');
const { buildCaption } = require('./autoposterCaptionBuilder');

// Instagram Business accounts are accessed via their linked Facebook Page (Spec
// Section 1.3.1, 14.2) — same Meta app, same OAuth mechanics as Facebook, just
// with IG scopes added and an extra step to resolve each Page's linked IG
// Business Account ID. Deliberately thin: reuses facebookOAuth for everything
// except the scope list, the IG-account lookup, and the two-step publish flow
// below (Instagram, unlike Facebook, always needs a container created first).
const INSTAGRAM_SCOPES = ['instagram_basic', 'instagram_content_publish', 'pages_show_list', 'pages_read_engagement'];
const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

function throwClassified(error) {
  const classified = facebookOAuth.classifyGraphError(error);
  const err = new Error(classified.message);
  err.transient = classified.transient;
  err.platformErrorCode = classified.code;
  throw err;
}

// Video/Reel containers process asynchronously — poll until Meta reports
// FINISHED before attempting to publish (Spec 14.2).
async function pollContainerStatus(containerId, accessToken, { maxAttempts = 10, delayMs = 3000 } = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await axios.get(`${GRAPH_BASE}/${containerId}`, { params: { fields: 'status_code', access_token: accessToken } });
    if (res.data.status_code === 'FINISHED') return;
    if (res.data.status_code === 'ERROR') {
      const err = new Error('Instagram media container processing failed');
      err.transient = false;
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  const err = new Error('Instagram media container timed out waiting to finish processing');
  err.transient = true; // worth retrying — might just need more time
  throw err;
}

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

// Two-step publish (Spec 14.2): create a media container, poll it if it's
// video/reel, then publish the container. Carousels are not built yet — a
// single image or video only, for this first pass. Optionally posts hashtags
// as a first comment (Spec 6.3's IG toggle), best-effort — a first-comment
// failure doesn't fail the whole publish.
async function publish(target, account, post) {
  const accessToken = decryptToken(account.accessTokenEnc);
  const caption = buildCaption(target, post);
  const media = post.mediaRefs || [];
  const image = media.find((m) => m.type === 'image');
  const video = media.find((m) => m.type === 'video');
  const postType = target.extra?.postType || 'feed';

  if (!image && !video) {
    const err = new Error('Instagram requires at least one image or video — text-only posts are not supported');
    err.transient = false;
    throw err;
  }

  try {
    const containerParams = { access_token: accessToken, caption };
    if (video) {
      containerParams.media_type = postType === 'reel' ? 'REELS' : 'VIDEO';
      containerParams.video_url = video.url;
    } else {
      containerParams.image_url = image.url;
    }

    const containerRes = await axios.post(`${GRAPH_BASE}/${account.externalId}/media`, null, { params: containerParams });
    const containerId = containerRes.data.id;

    if (video) await pollContainerStatus(containerId, accessToken);

    const publishRes = await axios.post(`${GRAPH_BASE}/${account.externalId}/media_publish`, null, {
      params: { access_token: accessToken, creation_id: containerId }
    });
    const externalPostId = publishRes.data.id;

    if (target.extra?.firstCommentHashtags && target.hashtags?.length > 0) {
      const hashtagText = target.hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ');
      await axios
        .post(`${GRAPH_BASE}/${externalPostId}/comments`, null, { params: { access_token: accessToken, message: hashtagText } })
        .catch(() => {}); // best-effort — don't fail the publish over the first comment
    }

    return { externalPostId, externalUrl: `https://instagram.com/p/${externalPostId}` };
  } catch (error) {
    throwClassified(error);
  }
}

async function fetchInsights(externalPostId, account) {
  const accessToken = decryptToken(account.accessTokenEnc);
  try {
    const res = await axios.get(`${GRAPH_BASE}/${externalPostId}/insights`, {
      params: { access_token: accessToken, metric: 'impressions,reach,likes,comments,shares' }
    });
    const data = res.data.data || [];
    const metricValue = (name) => data.find((d) => d.name === name)?.values?.[0]?.value || 0;
    return {
      impressions: metricValue('impressions'),
      reach: metricValue('reach'),
      likes: metricValue('likes'),
      comments: metricValue('comments'),
      shares: metricValue('shares'),
      clicks: 0,
      raw: res.data
    };
  } catch (error) {
    throwClassified(error);
  }
}

module.exports = {
  platform: 'instagram',
  requiredEnv: facebookOAuth.requiredEnv,
  scopes: INSTAGRAM_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForLongLivedUserToken: facebookOAuth.exchangeCodeForLongLivedUserToken,
  fetchManagedPages: facebookOAuth.fetchManagedPages,
  refreshAccessToken: facebookOAuth.refreshAccessToken,
  resolveInstagramBusinessAccount,
  publish,
  fetchInsights
};
