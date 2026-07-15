const mongoose = require('mongoose');
const { AUTOPOSTER_PLATFORMS, AUTOPOSTER_TREND_SCORE_WEIGHTS } = require('../config/constants');

// Admin-editable engine configuration (Spec Section 12.5). A singleton
// document, same pattern as Settings.getSettings() — everything here has a
// hardcoded equivalent already running in production (autoposterTrendScoring,
// autoposterCooldownGuard, autoposterTrendProductMatcher, the publisher cron)
// so every read site falls back to those exact existing values when a field
// here is unset. That's what makes this additive rather than a behaviour
// change: an admin who never opens the Configuration tab sees no difference.
const platformConfigSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  autoPublish: { type: Boolean, default: false }, // false = every candidate still goes through the human approval queue (Phase 10's default)
  hourlyCap: { type: Number, default: null } // null = no additional cap beyond the existing AUTOPOSTER_RATE_LIMITS window
}, { _id: false });

const categoryConfigSchema = new mongoose.Schema({
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  graduated: { type: Boolean, default: true }, // false = excluded from trend-product matching entirely, a manual quality gate
  maxSharePercent: { type: Number, default: null } // null = fall back to the existing hardcoded 40% cap in checkCategoryShareCap
}, { _id: false });

const autoposterEngineConfigSchema = new mongoose.Schema({
  platforms: {
    type: Map,
    of: platformConfigSchema,
    default: () => new Map(Object.values(AUTOPOSTER_PLATFORMS).map((p) => [p, {}]))
  },
  categories: { type: [categoryConfigSchema], default: [] },
  samplerWeights: {
    volume: { type: Number, default: AUTOPOSTER_TREND_SCORE_WEIGHTS.volume },
    velocity: { type: Number, default: AUTOPOSTER_TREND_SCORE_WEIGHTS.velocity },
    sourceConfidence: { type: Number, default: AUTOPOSTER_TREND_SCORE_WEIGHTS.sourceConfidence },
    culturalEventBoost: { type: Number, default: AUTOPOSTER_TREND_SCORE_WEIGHTS.culturalEventBoost },
    crossSourceValidation: { type: Number, default: AUTOPOSTER_TREND_SCORE_WEIGHTS.crossSourceValidation }
  },
  cooldown: {
    maxPostsPerProductRegionPer7d: { type: Number, default: 2 },
    maxPostsPerProductGlobalPer7d: { type: Number, default: 6 },
    minSpacingSameRegionMinutes: { type: Number, default: 90 },
    minSpacingSamePlatformMinutes: { type: Number, default: 30 },
    maxCategorySharePercent: { type: Number, default: 40 }
  }
}, { timestamps: true });

autoposterEngineConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) config = await this.create({});
  return config;
};

module.exports = mongoose.model('AutoposterEngineConfig', autoposterEngineConfigSchema);
