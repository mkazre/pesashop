const Settings = require('../models/Settings');

const videoCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

async function getSettings() {
  const settings = await Settings.getSettings();
  const se = settings.socialEngine || {};
  return {
    enabled:             !!se.enabled && !!se.rapidApiKey,
    rapidApiKey:         se.rapidApiKey || '',
    rapidApiHost:        se.rapidApiHost || 'tiktok-scraper7.p.rapidapi.com',
    sectionTitle:        se.sectionTitle        || 'Featured in Videos',
    sectionSubtitle:     se.sectionSubtitle     || 'See what creators are sharing',
    videosPerCarousel:   se.videosPerCarousel    || 8,
    showOnHome:          se.showOnHome           !== false,
    showOnShop:          se.showOnShop           !== false,
    showOnProductDetail: se.showOnProductDetail  !== false,
  };
}

function normaliseVideo(item) {
  // Handles response shapes from multiple RapidAPI TikTok providers
  const videoId = item.id || item.aweme_id || item.video_id || '';
  return {
    id:          videoId,
    description: item.desc || item.title || item.text || '',
    coverUrl:    item.video?.cover
                  || item.video?.dynamicCover
                  || item.video?.originCover
                  || item.coverUrl
                  || item.thumbnailUrl
                  || item.cover
                  || '',
    embedUrl:    `https://www.tiktok.com/embed/v2/${videoId}`,
    author: {
      handle:    item.author?.uniqueId
                  || item.author?.unique_id
                  || item.authorMeta?.name
                  || item.author_name
                  || '',
      name:      item.author?.nickname
                  || item.authorMeta?.nickName
                  || item.author_nickname
                  || '',
      avatarUrl: item.author?.avatarThumb
                  || item.author?.avatar_thumb?.url_list?.[0]
                  || item.authorMeta?.avatar
                  || '',
    },
    stats: {
      plays:    item.stats?.playCount    || item.statistics?.play_count    || item.playCount    || item.plays    || 0,
      likes:    item.stats?.diggCount    || item.statistics?.digg_count    || item.diggCount    || item.likes    || 0,
      shares:   item.stats?.shareCount   || item.statistics?.share_count   || item.shareCount   || item.shares   || 0,
      comments: item.stats?.commentCount || item.statistics?.comment_count || item.commentCount || item.comments || 0,
    },
  };
}

/**
 * Build the search request based on the RapidAPI host.
 * Different providers use wildly different endpoint paths and param names.
 */
function buildRequest(keyword, limit, apiKey, apiHost) {
  const headers = {
    'x-rapidapi-key':  apiKey,
    'x-rapidapi-host': apiHost,
  };

  // tiktok-scraper7 (by Axesso) — most stable as of 2025
  if (apiHost.includes('tiktok-scraper7')) {
    return {
      url: `https://${apiHost}/feed/search?keyword=${encodeURIComponent(keyword)}&count=${limit}&offset=0&region=ZA&publish_time=0`,
      headers,
    };
  }
  // Tokapi Mobile Version
  if (apiHost.includes('tokapi-mobile')) {
    return {
      url: `https://${apiHost}/v1/search/general?offset=0&count=${limit}&keyword=${encodeURIComponent(keyword)}`,
      headers: { ...headers, 'X-Params': '' },
    };
  }
  // tiktok-scraper2 (JoTucker) — no keyword search; handled separately via two-step hashtag lookup
  // (buildRequest not used for this host — fetchFromApi branches out before calling this)
  // tiktok-api6 (omarmhaimdat)
  if (apiHost.includes('tiktok-api6')) {
    return {
      url: `https://${apiHost}/search?query=${encodeURIComponent(keyword)}&count=${limit}&cursor=0`,
      headers,
    };
  }
  // Generic fallback — try common patterns
  return {
    url: `https://${apiHost}/api/search/video/?keywords=${encodeURIComponent(keyword)}&count=${limit}&cursor=0`,
    headers,
  };
}

/**
 * Extract the video item array from any known response shape.
 */
function extractItems(data) {
  return (
    data?.data?.itemList        // tiktok-api23 / tiktok-scraper7
    || data?.itemList           // tiktok-scraper2 hashtag/videos
    || data?.data?.videos       // some scraper variants
    || data?.videos
    || data?.data?.items
    || data?.items
    || data?.collector          // tiktok-scraper2 alternate shape
    || data?.data
    || []
  );
}

async function doGet(url, headers) {
  const response = await fetch(url, { method: 'GET', headers });
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`TikTok RapidAPI ${response.status} from ${url}: ${body.slice(0, 300)}`);
  }
  return response.json();
}

async function fetchFromApi(keyword, limit, apiKey, apiHost) {
  const headers = { 'x-rapidapi-key': apiKey, 'x-rapidapi-host': apiHost };

  // tiktok-scraper2 (JoTucker) has no keyword search — use two-step hashtag lookup
  if (apiHost.includes('tiktok-scraper2')) {
    // Step 1: resolve hashtag name → numeric ID
    const hashtagName = keyword.replace(/\s+/g, '').toLowerCase();
    const infoData = await doGet(
      `https://${apiHost}/hashtag/info?hashtag_name=${encodeURIComponent(hashtagName)}`,
      headers
    );
    const hashtagId = infoData?.hashtag_id || infoData?.id || infoData?.data?.id || infoData?.data?.hashtag_id;
    if (!hashtagId) throw new Error(`tiktok-scraper2: could not resolve hashtag ID for "${hashtagName}"`);

    // Step 2: fetch videos for that hashtag
    const videosData = await doGet(
      `https://${apiHost}/hashtag/videos?hashtag_id=${hashtagId}&count=${limit}`,
      headers
    );
    const items = extractItems(videosData);
    return (Array.isArray(items) ? items : []).slice(0, limit).map(normaliseVideo).filter(v => v.id);
  }

  const { url } = buildRequest(keyword, limit, apiKey, apiHost);
  const data = await doGet(url, headers);
  const items = extractItems(data);
  const videos = (Array.isArray(items) ? items : []).slice(0, limit).map(normaliseVideo).filter(v => v.id);
  console.log('[SocialEngine] raw keys:', Object.keys(data || {}), '| data.data keys:', Object.keys(data?.data || {}), '| items count:', Array.isArray(items) ? items.length : typeof items, '| videos after normalise:', videos.length);
  return videos;
}

async function getVideos(keywords, limit = 8) {
  const cfg = await getSettings();
  if (!cfg.enabled) return { videos: [], settings: cfg };

  const keyword = Array.isArray(keywords) ? keywords[0] : (keywords || 'trending');
  const cacheKey = `${keyword}::${limit}`;

  const cached = videoCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return { videos: cached.videos, settings: cfg };
  }

  try {
    const videos = await fetchFromApi(keyword, limit, cfg.rapidApiKey, cfg.rapidApiHost);
    videoCache.set(cacheKey, { videos, expiresAt: Date.now() + CACHE_TTL_MS });
    return { videos, settings: cfg };
  } catch (err) {
    console.error('[SocialEngine] fetch error:', err.message);
    return { videos: [], settings: cfg };
  }
}

async function testConnection() {
  const cfg = await getSettings();
  if (!cfg.rapidApiKey) throw new Error('RapidAPI key is not configured in Settings');
  return fetchFromApi('trending', 3, cfg.rapidApiKey, cfg.rapidApiHost);
}

module.exports = { getVideos, testConnection, getSettings };
