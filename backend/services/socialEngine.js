const Settings = require('../models/Settings');

const videoCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

async function getSettings() {
  const settings = await Settings.getSettings();
  const se = settings.socialEngine || {};
  return {
    enabled:             !!se.enabled && !!se.rapidApiKey,
    rapidApiKey:         se.rapidApiKey || '',
    rapidApiHost:        se.rapidApiHost || 'tiktok-api23.p.rapidapi.com',
    sectionTitle:        se.sectionTitle        || 'Featured in Videos',
    sectionSubtitle:     se.sectionSubtitle     || 'See what creators are sharing',
    videosPerCarousel:   se.videosPerCarousel    || 8,
    showOnHome:          se.showOnHome           !== false,
    showOnShop:          se.showOnShop           !== false,
    showOnProductDetail: se.showOnProductDetail  !== false,
  };
}

function normaliseVideo(item) {
  return {
    id:          item.id || item.aweme_id || '',
    description: item.desc || item.title || '',
    coverUrl:    item.video?.cover || item.video?.dynamicCover || item.video?.originCover || '',
    embedUrl:    `https://www.tiktok.com/embed/v2/${item.id || item.aweme_id}`,
    author: {
      handle:    item.author?.uniqueId   || item.author?.unique_id   || '',
      name:      item.author?.nickname   || '',
      avatarUrl: item.author?.avatarThumb || item.author?.avatar_thumb?.url_list?.[0] || '',
    },
    stats: {
      plays:    item.stats?.playCount    || item.statistics?.play_count    || 0,
      likes:    item.stats?.diggCount    || item.statistics?.digg_count    || 0,
      shares:   item.stats?.shareCount   || item.statistics?.share_count   || 0,
      comments: item.stats?.commentCount || item.statistics?.comment_count || 0,
    },
  };
}

async function fetchFromApi(keyword, limit, apiKey, apiHost) {
  const url = `https://${apiHost}/api/search/video/?keywords=${encodeURIComponent(keyword)}&count=${limit}&cursor=0`;
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-rapidapi-key':  apiKey,
      'x-rapidapi-host': apiHost,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`TikTok RapidAPI ${response.status}: ${body.slice(0, 200)}`);
  }

  const data = await response.json();
  // tiktok-api23 wraps results in data.data.itemList or data.itemList
  const items = data?.data?.itemList || data?.itemList || data?.data || [];
  return (Array.isArray(items) ? items : []).slice(0, limit).map(normaliseVideo);
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
