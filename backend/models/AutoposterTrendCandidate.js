const mongoose = require('mongoose');

// Ranked (trend, product, similarity) tuples produced by the semantic matcher
// (Spec Section 10.6, 11.2).
const autoposterTrendCandidateSchema = new mongoose.Schema({
  trend: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterTrend', required: true, index: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
  similarity: { type: Number, min: 0, max: 1 }, // cosine
  weight: Number, // final sampler weight (Spec Section 10.7)
  lastEvaluated: { type: Date, default: Date.now }
}, { timestamps: false });

autoposterTrendCandidateSchema.index({ trend: 1, weight: -1 });

module.exports = mongoose.model('AutoposterTrendCandidate', autoposterTrendCandidateSchema);
