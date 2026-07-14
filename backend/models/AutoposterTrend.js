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
  active: { type: Boolean, default: true, index: true }
}, { timestamps: true });

autoposterTrendSchema.index({ active: 1, sensitivityFlag: 1, trendScore: -1 });

module.exports = mongoose.model('AutoposterTrend', autoposterTrendSchema);
