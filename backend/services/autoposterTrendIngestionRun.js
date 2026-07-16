const AutoposterTrend = require('../models/AutoposterTrend');
const AutoposterBlocklistTerm = require('../models/AutoposterBlocklistTerm');
const AutoposterCulturalEvent = require('../models/AutoposterCulturalEvent');
const {
  fetchSerpApiTrends,
  fetchGoogleTrendsFallback,
  fetchXTrending,
  fetchTikTokDiscover,
  fetchFirstPartySearch,
  fetchFirstPartyOrderVelocity,
  wasSerpApiLastAttemptFailed
} = require('./autoposterTrendSources');
const {
  normaliseVolume,
  computeVelocityScore,
  computeSourceConfidence,
  computeCulturalEventBoost,
  computeCrossSourceValidation,
  computeTrendScore
} = require('./autoposterTrendScoring');
const AutoposterEngineConfig = require('../models/AutoposterEngineConfig');
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

const CULTURAL_EVENT_DAY_MS = 24 * 60 * 60 * 1000;

// Days from `from` (inclusive-forward, never negative) until the next
// occurrence of an annual month/day, wrapping to next year if it already
// passed this year.
function daysUntilAnnual(month, day, from) {
  const fromMidnight = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  let target = Date.UTC(from.getUTCFullYear(), month - 1, day);
  if (target < fromMidnight) target = Date.UTC(from.getUTCFullYear() + 1, month - 1, day);
  return Math.round((target - fromMidnight) / CULTURAL_EVENT_DAY_MS);
}

async function getActiveCulturalEventBoosts(date = new Date()) {
  const events = await AutoposterCulturalEvent.find({ active: true });
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const boosts = [];

  for (const event of events) {
    const r = event.recurrence || {};

    if (r.type === 'monthly') {
      if (day >= (r.dayRange?.[0] ?? 1) && day <= (r.dayRange?.[1] ?? 31)) boosts.push(event.boost);
      continue;
    }
    if (r.type === 'annual_multi') {
      if ((r.months || []).includes(month)) boosts.push(event.boost);
      continue;
    }
    if (r.type === 'annual_range') {
      // Handles year-boundary-spanning ranges (e.g. Dec 15 -> Jan 15).
      const start = { m: r.startMonth, d: r.startDay };
      const end = { m: r.endMonth, d: r.endDay };
      const asNum = (m, d) => m * 100 + d;
      const cur = asNum(month, day);
      const inRange = start.m > end.m
        ? cur >= asNum(start.m, start.d) || cur <= asNum(end.m, end.d)
        : cur >= asNum(start.m, start.d) && cur <= asNum(end.m, end.d);
      if (inRange) boosts.push(event.boost);
      continue;
    }

    // 'once' (Spec 12.3's "add one-off event", e.g. a national football
    // match) and 'annual' both support the lead-time ramp: ramps up
    // linearly from `date` up to `leadTimeDays` before the event, reaching
    // full boost exactly on the day. leadTimeDays=0 (the default) means
    // "only on the exact day", identical to this function's pre-Phase-11
    // behaviour.
    let daysUntil = null;
    if (r.type === 'once' && r.date) {
      const d = new Date(r.date);
      const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const fromMidnight = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      daysUntil = Math.round((target - fromMidnight) / CULTURAL_EVENT_DAY_MS);
    } else if (r.type === 'annual') {
      daysUntil = daysUntilAnnual(r.month, r.day, date);
    } else {
      // 'annual_nth_weekday' / 'annual_last_weekday' aren't date-matched here
      // — they need real calendar-week arithmetic, flagged rather than
      // approximated incorrectly.
      continue;
    }

    if (daysUntil === 0) {
      boosts.push(event.boost);
    } else if (daysUntil > 0 && daysUntil <= (event.leadTimeDays || 0)) {
      boosts.push(1 + (event.boost - 1) * (1 - daysUntil / event.leadTimeDays));
    }
  }

  return boosts;
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
  // Admin-tunable sampler weights (Spec 12.5) — falls back to the spec's own
  // fixed weights when the config document has no override, so this run
  // behaves identically to before Phase 11 for anyone who never opens the
  // Configuration tab.
  const config = await AutoposterEngineConfig.getConfig();
  const samplerWeights = config.samplerWeights;

  let created = 0, updated = 0, blocked = 0;

  for (const entry of grouped.values()) {
    const existing = await AutoposterTrend.findOne({ slug: entry.slug });
    const volumeNormalised = normaliseVolume(entry.volumeRaw, maxVolumeInRun);
    const velocity = computeVelocityScore(entry.volumeRaw, existing?.volumeNormalised ? existing.volumeNormalised * maxVolumeInRun : 0);
    const sourceConfidence = computeSourceConfidence(entry.sources);
    const culturalEventBoost = computeCulturalEventBoost(culturalBoosts);
    const crossSourceValidation = computeCrossSourceValidation(new Set(entry.sources).size);
    const trendScore = computeTrendScore({ volumeNormalised, velocityScore: velocity, sourceConfidence, culturalEventBoost, crossSourceValidation }, samplerWeights);

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

    // Real per-run snapshot for the Live Trends Panel's velocity sparkline
    // (Spec 12.1) — capped to the last 14 points, oldest dropped first.
    const historyPoint = { at: new Date(), trendScore, velocity };
    const priorHistory = existing?.scoreHistory || [];
    const scoreHistory = [...priorHistory, historyPoint].slice(-14);

    if (existing) {
      await AutoposterTrend.updateOne({ _id: existing._id }, { ...doc, scoreHistory });
      updated++;
    } else {
      await AutoposterTrend.create({ ...doc, firstSeen: new Date(), scoreHistory });
      created++;
    }
  }

  return {
    termsProcessed: grouped.size,
    created,
    updated,
    blocked,
    sourcesReporting: { serpapi: serpapi.length, googleFallback: googleFallback.length, xTrends: xTrends.length, tiktok: tiktok.length, firstPartySearch: firstPartySearch.length, orderVelocity: orderVelocity.length },
    primarySourceFailed: wasSerpApiLastAttemptFailed() // Spec 17 alert: "trend ingestion failures from primary source"
  };
}

module.exports = { runTrendIngestion, checkBlocklist, getActiveCulturalEventBoosts, slugify };
