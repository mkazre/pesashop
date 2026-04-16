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
  // tiktok-scraper2 (JoTucker) — keyword search endpoint
  if (apiHost.includes('tiktok-scraper2')) {
    return {
      url: `https://${apiHost}/video/by_keyword/?keyword=${encodeURIComponent(keyword)}&count=${limit}&offset=0`,
      headers,
    };
  }
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
    || data?.itemList
    || data?.data?.videos       // some scraper variants
    || data?.videos
    || data?.data?.items
    || data?.items
    || data?.data
    || []
  );
}

async function fetchFromApi(keyword, limit, apiKey, apiHost) {
  const { url, headers } = buildRequest(keyword, limit, apiKey, apiHost);

  const response = await fetch(url, { method: 'GET', headers });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`TikTok RapidAPI ${response.status} from ${url}: ${body.slice(0, 300)}`);
  }

  const data = await response.json();
  const items = extractItems(data);
  return (Array.isArray(items) ? items : []).slice(0, limit).map(normaliseVideo).filter(v => v.id);
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
