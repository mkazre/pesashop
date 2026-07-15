const axios = require('axios');
const googleTrends = require('google-trends-api');
const SiteEvent = require('../models/SiteEvent');
const Order = require('../models/Order');
const AutoposterAccount = require('../models/AutoposterAccount');
const { decryptToken } = require('./autoposterTokenCrypto');
const { AUTOPOSTER_ACCOUNT_STATUS } = require('../config/constants');

// One function per source (Spec Sections 10.2–10.3). Each returns a plain
// array of { term, source, geo } — no scoring here, that's a separate step
// (autoposterTrendScoring.js). Sources gated on missing credentials/accounts
// degrade gracefully (empty array + a clear log line), same honest pattern
// used for the OAuth adapters in Phases 2/5 — never a fake/fabricated result.

// ─── SerpAPI Google Trends (primary, paid) ─────────────────────────────────
async function fetchSerpApiTrends() {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.log('[autoposter-trends] SerpAPI skipped — SERPAPI_KEY not set');
    return [];
  }
  try {
    const res = await axios.get('https://serpapi.com/search', {
      params: { engine: 'google_trends_trending_now', geo: 'ZW', api_key: apiKey }
    });
    const items = res.data?.trending_searches || res.data?.daily_searches || [];
    return items.slice(0, 25).map((item) => ({ term: item.query || item.title || String(item), source: 'serpapi', geo: 'ZW' }));
  } catch (error) {
    console.error('[autoposter-trends] SerpAPI request failed:', error.message);
    return [];
  }
}

// ─── google-trends-api (free, unofficial fallback) ─────────────────────────
// Spec's own words: "unofficial scraper... breaks periodically when Google
// changes markup." Google's daily-trends endpoint also only supports a
// limited set of countries historically — Zimbabwe may not be one of them.
// Caught and logged plainly rather than allowed to crash the ingestion run.
async function fetchGoogleTrendsFallback() {
  try {
    const raw = await googleTrends.dailyTrends({ geo: 'ZW' });
    const parsed = JSON.parse(raw);
    const days = parsed.default?.trendingSearchesDays || [];
    const terms = days.flatMap((day) => (day.trendingSearches || []).map((t) => t.title?.query)).filter(Boolean);
    return terms.slice(0, 25).map((term) => ({ term, source: 'google_trends_scraper', geo: 'ZW' }));
  } catch (error) {
    console.error('[autoposter-trends] google-trends-api fallback failed (geo=ZW may not be supported by this endpoint, or Google changed their markup):', error.message);
    return [];
  }
}

// ─── X trending (Spec 10.2/10.3) ───────────────────────────────────────────
// Needs an active connected X account with trends-read access — neither
// exists yet (no platform apps submitted, Spec Section 25.2). Real endpoint,
// gated on real prerequisites, not a fabricated response.
async function fetchXTrending() {
  const account = await AutoposterAccount.findOne({ platform: 'x', status: AUTOPOSTER_ACCOUNT_STATUS.ACTIVE });
  if (!account) {
    console.log('[autoposter-trends] X trending skipped — no active connected X account');
    return [];
  }
  const ZIMBABWE_WOEID = 23424980; // falls back to South Africa's WOEID if this proves unsupported, per Spec 10.2
  try {
    const accessToken = decryptToken(account.accessTokenEnc);
    const res = await axios.get(`https://api.twitter.com/2/trends/by/woeid/${ZIMBABWE_WOEID}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const trends = res.data?.data || [];
    return trends.slice(0, 25).map((t) => ({ term: t.trend_name || t.name, source: 'x', geo: 'ZW' }));
  } catch (error) {
    console.error('[autoposter-trends] X trending request failed:', error.message);
    return [];
  }
}

// ─── TikTok Discover (Spec 10.2/10.3) ───────────────────────────────────────
// Flagged honestly: TikTok doesn't expose a straightforward, documented
// public REST endpoint for trending sounds/hashtags in the way Facebook or
// X do — that data lives behind either the separate Research API
// application (Spec 25.4) or scraping their app's internal endpoints (ToS
// risk, fragile, not something to build blind). Returns empty rather than
// fabricating a plausible-looking call to an endpoint I'm not confident is
// real.
async function fetchTikTokDiscover() {
  console.log('[autoposter-trends] TikTok Discover skipped — no documented public trending API; needs a separate Research API application (Spec 25.4)');
  return [];
}

// ─── First-party: PesaShop search log (Spec 10.2 — "highest-quality input") ─
async function fetchFirstPartySearch({ hours = 24 } = {}) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);
  const results = await SiteEvent.aggregate([
    { $match: { type: 'search', searchQuery: { $exists: true, $ne: '' }, createdAt: { $gte: since } } },
    { $addFields: { normalised: { $toLower: '$searchQuery' } } },
    { $group: { _id: '$normalised', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 25 }
  ]);
  return results.map((r) => ({ term: r._id, source: 'firstparty_search', geo: 'ZW', volumeRaw: r.count }));
}

// ─── First-party: order velocity (Spec 10.2, 10.3) ─────────────────────────
// Products with rising sell-through in the last 24h vs a 72h baseline —
// confirms a trend has already converted, not just been searched for.
async function fetchFirstPartyOrderVelocity() {
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const since72h = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const [recent, baseline] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: since24h }, status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' }, name: { $first: '$items.name' } } }
    ]),
    Order.aggregate([
      { $match: { createdAt: { $gte: since72h, $lt: since24h }, status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', qty: { $sum: '$items.quantity' } } }
    ])
  ]);

  const baselineMap = new Map(baseline.map((b) => [String(b._id), b.qty]));
  return recent
    .map((r) => {
      const baselineQty = baselineMap.get(String(r._id)) || 0;
      const baselineDailyRate = baselineQty / 2; // 48-hour window (72h - 24h), normalised to a daily rate
      const isRising = r.qty > baselineDailyRate * 1.2; // >20% above baseline counts as "rising"
      return { term: r.name, source: 'firstparty_order_velocity', geo: 'ZW', volumeRaw: r.qty, isRising, productId: String(r._id) };
    })
    .filter((r) => r.isRising)
    .slice(0, 25);
}

module.exports = {
  fetchSerpApiTrends,
  fetchGoogleTrendsFallback,
  fetchXTrending,
  fetchTikTokDiscover,
  fetchFirstPartySearch,
  fetchFirstPartyOrderVelocity
};
