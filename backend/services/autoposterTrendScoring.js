const { AUTOPOSTER_TREND_SCORE_WEIGHTS, AUTOPOSTER_TREND_SOURCE_CONFIDENCE } = require('../config/constants');

// Composite trend scoring (Spec Section 10.4):
//   trend_score = 0.30*volume + 0.40*velocity + 0.15*source_confidence
//               + 0.10*cultural_event_boost + 0.05*cross_source_validation
// Every input here is pre-normalised to 0-1; this file only combines them.

// Normalises a raw volume count against the highest volume seen in the same
// ingestion run (Spec 10.4: "current absolute interest, 0-1").
function normaliseVolume(rawVolume, maxVolumeInRun) {
  if (!maxVolumeInRun || maxVolumeInRun <= 0) return 0;
  return Math.min(1, rawVolume / maxVolumeInRun);
}

// 7-day rate of change, capped 0-1 (Spec 10.4). previousVolume of 0 with a
// positive current volume is treated as maximum velocity (brand new trend).
function computeVelocityScore(currentVolume, previousVolume) {
  if (previousVolume <= 0) return currentVolume > 0 ? 1 : 0;
  const change = (currentVolume - previousVolume) / previousVolume;
  return Math.max(0, Math.min(1, change));
}

// Highest confidence among every source that reported this term this run
// (Spec 10.4's fixed per-source values, Section 22.1 constants).
function computeSourceConfidence(sources) {
  if (!sources || sources.length === 0) return 0;
  return Math.max(...sources.map((s) => AUTOPOSTER_TREND_SOURCE_CONFIDENCE[s] ?? 0.5));
}

// Normalises an active cultural event's 1.0-2.0 boost multiplier into 0-1
// (Spec doesn't give an exact normalisation formula — this is a reasonable,
// documented interpretation, not an arbitrary guess: boost=1.0, meaning "no
// real boost", maps to 0; boost=2.0, the maximum, maps to 1).
function computeCulturalEventBoost(activeBoosts) {
  if (!activeBoosts || activeBoosts.length === 0) return 0;
  const maxBoost = Math.max(...activeBoosts);
  return Math.max(0, Math.min(1, maxBoost - 1));
}

// Count of distinct sources reporting the same term this run, normalised
// against the 5 possible sources (Spec 10.4).
function computeCrossSourceValidation(distinctSourceCount, totalPossibleSources = 5) {
  return Math.min(1, distinctSourceCount / totalPossibleSources);
}

// `weights` defaults to the spec's fixed constants but can be overridden by
// the admin-editable AutoposterEngineConfig (Spec 12.5's "sampler weight
// tuning sliders") — kept as a plain parameter, not a DB read in here, so
// this function stays pure and synchronous for existing callers/tests.
function computeTrendScore({ volumeNormalised, velocityScore, sourceConfidence, culturalEventBoost, crossSourceValidation }, weights = AUTOPOSTER_TREND_SCORE_WEIGHTS) {
  const w = weights;
  return (
    w.volume * volumeNormalised +
    w.velocity * velocityScore +
    w.sourceConfidence * sourceConfidence +
    w.culturalEventBoost * culturalEventBoost +
    w.crossSourceValidation * crossSourceValidation
  );
}

module.exports = {
  normaliseVolume,
  computeVelocityScore,
  computeSourceConfidence,
  computeCulturalEventBoost,
  computeCrossSourceValidation,
  computeTrendScore
};
