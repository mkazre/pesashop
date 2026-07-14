const mongoose = require('mongoose');

// Snapshots of platform-reported metrics, fetched on a schedule (1h, 24h, 7d
// after publish) — Spec Section 4.4.
const autoposterInsightSchema = new mongoose.Schema({
  postTarget: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterPostTarget', required: true, index: true },
  capturedAt: { type: Date, default: Date.now },
  impressions: Number,
  reach: Number,
  likes: Number,
  comments: Number,
  shares: Number,
  clicks: Number,
  raw: mongoose.Schema.Types.Mixed
}, { timestamps: false });

autoposterInsightSchema.index({ postTarget: 1, capturedAt: -1 });

module.exports = mongoose.model('AutoposterInsight', autoposterInsightSchema);
