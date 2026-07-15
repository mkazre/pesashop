const AutoposterTrend = require('../models/AutoposterTrend');
const AutoposterBlocklistTerm = require('../models/AutoposterBlocklistTerm');
const AutoposterCulturalEvent = require('../models/AutoposterCulturalEvent');
const {
  fetchSerpApiTrends,
  fetchGoogleTrendsFallback,
  fetchXTrending,
  fetchTikTokDiscover,
  fetchFirstPartySearch,
  fetchFirstPartyOrderVelocity
} = require('./autoposterTrendSources');
const {
  normaliseVolume,
  computeVelocityScore,
  computeSourceConfidence,
  computeCulturalEventBoost,
  computeCrossSourceValidation,
  computeTrendScore
} = require('./autoposterTrendScoring');
const { AUTOPOSTER_SENSITIVITY } = require('../config/constants');

function slugify(term) {
  return term.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Brand safety, layer 1 of 3 (Spec 10.10): a trend matching the static
// blocklist is excluded from candidacy entirely at ingestion time — the LLM
// safety classifier (layer 2) and per-caption check (layer 3) are Phase
// 9/10 territory, applied later in the pipeline to generated content, not
// here. This only catches what the blocklist already knows about.
async function checkBlocklist(term) {
  const blocklist = await AutoposterBlocklistTerm.find();
  for (const entry of blocklist) {
    if (entry.type === 'exact' && term.toLowerCase().includes(entry.term.toLowerCase())) {
      return { flagged: true, reason: `Matches blocklist term: "${entry.term}" (${entry.reason || 'no reason recorded'})` };
    }
    if (entry.type === 'regex') {
      try {
        if (new RegExp(entry.term, 'i').test(term)) {
          return { flagged: true, reason: `Matches blocklist pattern: ${entry.term}` };
        }
      } catch { /* an admin-entered invalid regex shouldn't crash ingestion */ }
    }
    // 'category' entries are placeholders (Phase 1 seed) with no concrete
    // terms yet to match against — nothing to check until an admin
    // populates them via the Blocklist editor (Spec 12.5).
  }
  return { flagged: false };
}

async function getActiveCulturalEventBoosts(date = new Date()) {
  const events = await AutoposterCulturalEvent.find({ active: true });
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const active = events.filter((event) => {
    const r = event.recurrence || {};
    if (r.type === 'annual') return r.month === month && r.day === day;
    if (r.type === 'monthly') return day >= (r.dayRange?.[0] ?? 1) && day <= (r.dayRange?.[1] ?? 31);
    if (r.type === 'annual_multi') return (r.months || []).includes(month);
    if (r.type === 'annual_range') {
      // Handles year-boundary-spanning ranges (e.g. Dec 15 -> Jan 15).
      const start = { m: r.startMonth, d: r.startDay };
      const end = { m: r.endMonth, d: r.endDay };
      const asNum = (m, d) => m * 100 + d;
      const cur = asNum(month, day);
      return start.m > end.m
        ? cur >= asNum(start.m, start.d) || cur <= asNum(end.m, end.d)
        : cur >= asNum(start.m, start.d) && cur <= asNum(end.m, end.d);
    }
    // 'annual_nth_weekday' / 'annual_last_weekday' aren't date-matched here —
    // they need real calendar-week arithmetic that's more naturally a Phase
    // 9/11 concern (matching against the actual trend-sampling run date);
    // flagged rather than approximated incorrectly.
    return false;
  });
  return active.map((e) => e.boost);
}

// One full ingestion run (Spec Section 10.3): fetch every source, normalise
// into a unified set of raw trend rows, score, flag, and upsert into the
// AutoposterTrend table.
async function runTrendIngestion() {
  const [serpapi, googleFallback, xTrends, tiktok, firstPartySearch, orderVelocity] = await Promise.all([
    fetchSerpApiTrends(),
    fetchGoogleTrendsFallback(),
    fetchXTrending(),
    fetchTikTokDiscover(),
    fetchFirstPartySearch(),
    fetchFirstPartyOrderVelocity()
  ]);

  const allRaw = [...serpapi, ...googleFallback, ...xTrends, ...tiktok, ...firstPartySearch, ...orderVelocity];

  // Group by normalised slug — the same term reported by multiple sources
  // becomes one trend row with multiple sources attached (Spec 10.4's
  // "cross_source_validation").
  const grouped = new Map();
  for (const raw of allRaw) {
    if (!raw.term) continue;
    const slug = slugify(raw.term);
    if (!slug) continue;
    if (!grouped.has(slug)) grouped.set(slug, { term: raw.term, slug, sources: [], volumeRaw: 0 });
    const entry = grouped.get(slug);
    entry.sources.push(raw.source);
    entry.volumeRaw += raw.volumeRaw || 1; // sources without a raw count (e.g. SerpAPI's ranked list) count as presence = 1
  }

  const maxVolumeInRun = Math.max(1, ...[...grouped.values()].map((e) => e.volumeRaw));
  const culturalBoosts = await getActiveCulturalEventBoosts();

  let created = 0, updated = 0, blocked = 0;

  for (const entry of grouped.values()) {
    const existing = await AutoposterTrend.findOne({ slug: entry.slug });
    const volumeNormalised = normaliseVolume(entry.volumeRaw, maxVolumeInRun);
    const velocity = computeVelocityScore(entry.volumeRaw, existing?.volumeNormalised ? existing.volumeNormalised * maxVolumeInRun : 0);
    const sourceConfidence = computeSourceConfidence(entry.sources);
    const culturalEventBoost = computeCulturalEventBoost(culturalBoosts);
    const crossSourceValidation = computeCrossSourceValidation(new Set(entry.sources).size);
    const trendScore = computeTrendScore({ volumeNormalised, velocityScore: velocity, sourceConfidence, culturalEventBoost, crossSourceValidation });

    const blocklistResult = await checkBlocklist(entry.term);

    const doc = {
      term: entry.term,
      slug: entry.slug,
      sources: [...new Set(entry.sources)],
      geo: 'ZW',
      volumeNormalised,
      velocity,
      trendScore,
      sensitivityFlag: blocklistResult.flagged ? AUTOPOSTER_SENSITIVITY.BLOCKED : AUTOPOSTER_SENSITIVITY.SAFE,
      blocklistReason: blocklistResult.reason,
      lastRefreshed: new Date(),
      active: true
    };
    if (blocklistResult.flagged) blocked++;

    if (existing) {
      await AutoposterTrend.updateOne({ _id: existing._id }, doc);
      updated++;
    } else {
      await AutoposterTrend.create({ ...doc, firstSeen: new Date() });
      created++;
    }
  }

  return { termsProcessed: grouped.size, created, updated, blocked, sourcesReporting: { serpapi: serpapi.length, googleFallback: googleFallback.length, xTrends: xTrends.length, tiktok: tiktok.length, firstPartySearch: firstPartySearch.length, orderVelocity: orderVelocity.length } };
}

module.exports = { runTrendIngestion, checkBlocklist, getActiveCulturalEventBoosts, slugify };
