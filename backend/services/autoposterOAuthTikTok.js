const axios = require('axios');
const { decryptToken } = require('./autoposterTokenCrypto');
const { buildCaption } = require('./autoposterCaptionBuilder');

// TikTok Content Posting API (Spec Sections 3, 14.4, 25.4). Note TikTok's env
// vars are CLIENT_KEY/CLIENT_SECRET, not CLIENT_ID like the others (Spec 21.1).
// Base API access (this OAuth flow) and Direct Post publishing rights are two
// separate approvals — a connected account here may still be Upload-to-Inbox
// only until Direct Post is separately approved (Spec 25.4).
const TIKTOK_SCOPES = ['user.info.basic', 'video.publish'];
const TIKTOK_API_BASE = 'https://open.tiktokapis.com/v2';

function classifyTikTokError(error) {
  const status = error.response?.status;
  const message = error.response?.data?.error?.message || error.message;
  if (!status) return { transient: true, code: 'network_error', message };
  const transient = status === 429 || status >= 500;
  return { transient, code: String(status), message };
}

function throwClassified(error) {
  const classified = classifyTikTokError(error);
  const err = new Error(classified.message);
  err.transient = classified.transient;
  err.platformErrorCode = classified.code;
  throw err;
}

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

const PRIVACY_MAP = { public: 'PUBLIC_TO_EVERYONE', friends: 'MUTUAL_FOLLOW_FRIENDS', private: 'SELF_ONLY' };

// Publishes a video (Spec 14.4). Uses PULL_FROM_URL rather than FILE_UPLOAD —
// our media is already hosted publicly on Cloudinary as the post content
// itself, so there's no exposure concern to avoid by chunk-uploading instead,
// and PULL_FROM_URL is dramatically simpler. Requires the media domain
// (Cloudinary) to be verified in the TikTok developer portal — a one-time
// setup step, not a per-post one. TikTok-native image posts (not video) and
// FILE_UPLOAD chunked upload aren't built in this pass.
async function publish(target, account, post) {
  const accessToken = decryptToken(account.accessTokenEnc);
  const media = post.mediaRefs || [];
  const video = media.find((m) => m.type === 'video');

  if (!video) {
    const err = new Error('TikTok publishing requires a video — image-only posts are not supported by this adapter yet');
    err.transient = false;
    throw err;
  }

  const caption = buildCaption(target, post);
  const postMode = target.extra?.postMode || 'upload_to_inbox';
  const endpoint = postMode === 'direct'
    ? `${TIKTOK_API_BASE}/post/publish/video/init/`
    : `${TIKTOK_API_BASE}/post/publish/inbox/video/init/`;

  const body = {
    source_info: { source: 'PULL_FROM_URL', video_url: video.url }
  };
  if (postMode === 'direct') {
    body.post_info = {
      title: caption,
      privacy_level: PRIVACY_MAP[target.extra?.privacy] || 'SELF_ONLY',
      disable_duet: !target.extra?.allowDuet,
      disable_comment: !target.extra?.allowComments,
      disable_stitch: !target.extra?.allowStitch,
      brand_content_toggle: !!target.extra?.discloseCommercial
    };
  }

  try {
    const res = await axios.post(endpoint, body, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
    });
    const publishId = res.data.data.publish_id;
    // Direct Post publishes asynchronously; Upload-to-Inbox just queues it in
    // the creator's TikTok app drafts. Either way there's no public post ID
    // to link to yet — only publish_id, which the insights fetch below polls.
    return { externalPostId: publishId, externalUrl: null };
  } catch (error) {
    throwClassified(error);
  }
}

// TikTok's publish is async — this checks status via publish_id rather than
// fetching real engagement metrics yet (that needs the resulting video ID,
// which only exists once PUBLISH_COMPLETE — a Phase 12 refinement).
async function fetchInsights(externalPostId, account) {
  const accessToken = decryptToken(account.accessTokenEnc);
  try {
    const res = await axios.post(
      `${TIKTOK_API_BASE}/post/publish/status/fetch/`,
      { publish_id: externalPostId },
      { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' } }
    );
    return {
      impressions: 0,
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
  platform: 'tiktok',
  requiredEnv: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET', 'TIKTOK_OAUTH_REDIRECT_URI'],
  scopes: TIKTOK_SCOPES,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  publish,
  fetchInsights,
  classifyTikTokError // exported for unit testing only
};
