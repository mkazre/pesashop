const crypto = require('crypto');
const axios = require('axios');
const { decryptToken } = require('./autoposterTokenCrypto');
const { buildCaption } = require('./autoposterCaptionBuilder');
const { AUTOPOSTER_CAPTION_LIMITS } = require('../config/constants');

// X API v2, OAuth 2.0 with PKCE (Spec Sections 3, 14.3, 25.2). X uses a
// Confidential client, so token exchange is authenticated with HTTP Basic
// (client_id:client_secret) in addition to the PKCE verifier.
const X_SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

// X's v2 error responses aren't as uniformly shaped as Meta's — classify by
// HTTP status instead, which is reliable across both the old {errors:[...]}
// shape and the newer RFC7807-style {title,detail,status} shape.
// 429 (rate limit) and 5xx -> transient. 401/403 (auth) and 400 (validation)
// -> permanent.
function classifyXError(error) {
  const status = error.response?.status;
  const body = error.response?.data;
  const message = body?.detail || body?.errors?.[0]?.message || body?.title || error.message;
  if (!status) return { transient: true, code: 'network_error', message };
  const transient = status === 429 || status >= 500;
  return { transient, code: String(status), message };
}

function throwClassified(error) {
  const classified = classifyXError(error);
  const err = new Error(classified.message);
  err.transient = classified.transient;
  err.platformErrorCode = classified.code;
  throw err;
}

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

// Media upload still uses v1.1 (Spec 14.3). Simple (non-chunked) upload for
// images; chunked INIT/APPEND/FINALIZE + STATUS polling for video.
async function uploadImage(imageUrl, accessToken) {
  const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  const base64 = Buffer.from(imageRes.data).toString('base64');
  const res = await axios.post(
    'https://upload.twitter.com/1.1/media/upload.json',
    new URLSearchParams({ media_data: base64 }).toString(),
    { headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  return res.data.media_id_string;
}

async function uploadVideo(videoUrl, accessToken) {
  const videoRes = await axios.get(videoUrl, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(videoRes.data);
  const auth = { Authorization: `Bearer ${accessToken}` };

  const init = await axios.post(
    'https://upload.twitter.com/1.1/media/upload.json',
    new URLSearchParams({ command: 'INIT', total_bytes: String(buffer.length), media_type: 'video/mp4' }).toString(),
    { headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  const mediaId = init.data.media_id_string;

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  for (let i = 0, segment = 0; i < buffer.length; i += CHUNK_SIZE, segment++) {
    const chunk = buffer.subarray(i, i + CHUNK_SIZE);
    const form = new URLSearchParams({ command: 'APPEND', media_id: mediaId, segment_index: String(segment), media_data: chunk.toString('base64') });
    await axios.post('https://upload.twitter.com/1.1/media/upload.json', form.toString(), {
      headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' }
    });
  }

  await axios.post(
    'https://upload.twitter.com/1.1/media/upload.json',
    new URLSearchParams({ command: 'FINALIZE', media_id: mediaId }).toString(),
    { headers: { ...auth, 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  // Poll processing status until succeeded (video needs transcoding server-side).
  for (let attempt = 0; attempt < 10; attempt++) {
    const status = await axios.get('https://upload.twitter.com/1.1/media/upload.json', {
      params: { command: 'STATUS', media_id: mediaId },
      headers: auth
    });
    const state = status.data.processing_info?.state;
    if (!state || state === 'succeeded') return mediaId;
    if (state === 'failed') {
      const err = new Error('X video processing failed');
      err.transient = false;
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, (status.data.processing_info?.check_after_secs || 3) * 1000));
  }
  const err = new Error('X video processing timed out');
  err.transient = true;
  throw err;
}

// Splits a caption into <=280-char chunks on word boundaries for thread mode
// (Spec 6.3's "Thread mode (split caption into 280-char tweets)").
function splitIntoTweets(caption, limit = AUTOPOSTER_CAPTION_LIMITS.x) {
  const words = caption.split(/\s+/);
  const tweets = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > limit) {
      if (current) tweets.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) tweets.push(current);
  return tweets;
}

// Publishes a tweet (Spec 14.3). Thread mode splits the caption across
// multiple tweets, each replying to the previous. Non-thread mode posts a
// single tweet, with media attached if present (image or video, not both —
// multi-image tweets aren't built yet).
async function publish(target, account, post) {
  const accessToken = decryptToken(account.accessTokenEnc);
  const caption = buildCaption(target, post);
  const media = post.mediaRefs || [];
  const image = media.find((m) => m.type === 'image');
  const video = media.find((m) => m.type === 'video');

  try {
    let mediaId;
    if (video) mediaId = await uploadVideo(video.url, accessToken);
    else if (image) mediaId = await uploadImage(image.url, accessToken);

    const isThread = !!target.extra?.threadMode;
    const tweetTexts = isThread ? splitIntoTweets(caption) : [caption.slice(0, AUTOPOSTER_CAPTION_LIMITS.x)];

    let previousTweetId;
    let firstTweetId;
    for (let i = 0; i < tweetTexts.length; i++) {
      const body = { text: tweetTexts[i] };
      if (i === 0 && mediaId) body.media = { media_ids: [mediaId] };
      if (previousTweetId) body.reply = { in_reply_to_tweet_id: previousTweetId };

      const res = await axios.post('https://api.twitter.com/2/tweets', body, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }
      });
      previousTweetId = res.data.data.id;
      if (!firstTweetId) firstTweetId = previousTweetId;
    }

    return { externalPostId: firstTweetId, externalUrl: `https://x.com/i/status/${firstTweetId}` };
  } catch (error) {
    throwClassified(error);
  }
}

async function fetchInsights(externalPostId, account) {
  const accessToken = decryptToken(account.accessTokenEnc);
  try {
    const res = await axios.get(`https://api.twitter.com/2/tweets/${externalPostId}`, {
      params: { 'tweet.fields': 'public_metrics' },
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const metrics = res.data.data?.public_metrics || {};
    return {
      impressions: metrics.impression_count || 0,
      reach: 0,
      likes: metrics.like_count || 0,
      comments: metrics.reply_count || 0,
      shares: metrics.retweet_count || 0,
      clicks: 0,
      raw: res.data
    };
  } catch (error) {
    throwClassified(error);
  }
}

module.exports = {
  platform: 'x',
  requiredEnv: ['X_CLIENT_ID', 'X_CLIENT_SECRET', 'X_OAUTH_REDIRECT_URI'],
  scopes: X_SCOPES,
  generatePkcePair,
  buildAuthorizeUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  fetchAuthenticatedUser,
  publish,
  fetchInsights,
  splitIntoTweets, // exported for unit testing only
  classifyXError // exported for unit testing only
};
