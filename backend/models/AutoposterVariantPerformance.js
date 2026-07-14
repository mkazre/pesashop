const mongoose = require('mongoose');
const { AUTOPOSTER_PLATFORMS } = require('../config/constants');

// Tracks which caption variant styles win in which (platform, category) cells,
// feeding the A/B exploit/explore shift after 50+ posts (Spec Sections 10.9.2, 11.6).
const autoposterVariantPerformanceSchema = new mongoose.Schema({
  platform: { type: String, enum: Object.values(AUTOPOSTER_PLATFORMS), required: true },
  category: { type: String, required: true },
  variantStyle: { type: String, required: true }, // 'question_hook', 'price_lead', 'story_lead', ...
  postsCount: { type: Number, default: 0 },
  totalEngagement: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: false });

autoposterVariantPerformanceSchema.index({ platform: 1, category: 1, variantStyle: 1 }, { unique: true });

module.exports = mongoose.model('AutoposterVariantPerformance', autoposterVariantPerformanceSchema);
