const mongoose = require('mongoose');
const { AUTOPOSTER_TREND_AUDIENCE, AUTOPOSTER_SENSITIVITY } = require('../config/constants');

// A cached, scored trend from the multi-signal trend stack (Spec Sections 10.2–10.4,
// 11.1). embedding follows the same pattern as Product.embedding (Spec-native pgvector
// column translated to a plain array field, per the Phase 0 vector-search decision —
// reuse the brute-force cosine approach already live in visualSearchService.js).
const autoposterTrendSchema = new mongoose.Schema({
  term: { type: String, required: true },
  slug: { type: String, required: true, index: true }, // normalised for matching

  sources: [String], // ['serpapi', 'x', 'firstparty', ...]
  geo: { type: String, default: 'ZW' },

  volumeNormalised: { type: Number, min: 0, max: 1 },
  velocity: Number, // 7d % change, clamped
  trendScore: { type: Number, index: true }, // composite (Spec Section 10.4)

  audience: {
    type: String,
    enum: Object.values(AUTOPOSTER_TREND_AUDIENCE)
  },

  embedding: { type: [Number], select: false },

  sensitivityFlag: {
    type: String,
    enum: Object.values(AUTOPOSTER_SENSITIVITY),
    default: AUTOPOSTER_SENSITIVITY.SAFE,
    index: true
  },
  blocklistReason: String,

  firstSeen: { type: Date, default: Date.now },
  lastRefreshed: { type: Date, default: Date.now },
  active: { type: Boolean, default: true, index: true },

  // A real snapshot per ingestion run (Spec 12.1's "velocity sparkline"),
  // capped to the last 14 points — this is genuine history, not a
  // decoration; a brand-new trend has 0-1 points until more runs accumulate.
  scoreHistory: {
    type: [{ at: { type: Date, default: Date.now }, trendScore: Number, velocity: Number, _id: false }],
    default: []
  },

  // Admin "Pin" action (Spec 12.1) — forces a high effective weight for 24h
  // regardless of the computed trendScore, e.g. to push a known-good trend
  // during a promotion. Read at sampling time, not baked into trendScore
  // itself, so it naturally expires without a cron needing to unset it.
  pinnedUntil: { type: Date, default: null }
}, { timestamps: true });

autoposterTrendSchema.index({ active: 1, sensitivityFlag: 1, trendScore: -1 });

module.exports = mongoose.model('AutoposterTrend', autoposterTrendSchema);
