const mongoose = require('mongoose');
const {
  AUTOPOSTER_PLATFORMS,
  AUTOPOSTER_TARGET_REGIONS,
  AUTOPOSTER_TARGET_STATUS
} = require('../config/constants');

// One row per (post, platform-account, region) tuple (Spec Section 4.3). Holds
// per-platform overrides, regional targeting, and the resulting external post ID.
const autoposterPostTargetSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterPost', required: true, index: true },
  account: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterAccount', required: true },
  platform: {
    type: String,
    enum: Object.values(AUTOPOSTER_PLATFORMS),
    required: true,
    index: true
  },
  // Default 'local_zw' for legacy/manual/product-auto posts that don't specify;
  // trend-engine auto-posts always set this explicitly (Spec Section 10.8.3).
  targetRegion: {
    type: String,
    enum: Object.values(AUTOPOSTER_TARGET_REGIONS),
    default: AUTOPOSTER_TARGET_REGIONS.LOCAL_ZW,
    index: true
  },

  captionOverride: String,
  hashtags: [String],
  firstComment: String, // IG strategy
  extra: mongoose.Schema.Types.Mixed, // platform-specific (e.g. IG type: feed/reel)

  scheduledFor: Date, // per-target, computed from region peak window
  status: {
    type: String,
    enum: Object.values(AUTOPOSTER_TARGET_STATUS),
    default: AUTOPOSTER_TARGET_STATUS.PENDING,
    index: true
  },
  externalPostId: String,
  externalUrl: String,
  errorCode: String,
  errorMessage: String,
  publishedAt: Date,
  attemptCount: { type: Number, default: 0 }
}, { timestamps: true });

// Cool-down lookup pattern (Spec Section 10.8.3): count published posts for a
// (product, platform, region) triple within a rolling window. sourceRef lives on
// the parent AutoposterPost, so this compound index supports the join query's
// platform/region/publishedAt leg efficiently.
autoposterPostTargetSchema.index({ platform: 1, targetRegion: 1, publishedAt: -1 });
autoposterPostTargetSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('AutoposterPostTarget', autoposterPostTargetSchema);
