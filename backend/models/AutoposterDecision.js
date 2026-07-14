const mongoose = require('mongoose');
const { AUTOPOSTER_PLATFORMS, AUTOPOSTER_APPROVAL_STATUS } = require('../config/constants');

// Full audit trail of every decision the trend engine makes, even ones not
// published (Spec Section 11.4). runId groups all decisions from one sampler run.
const autoposterDecisionSchema = new mongoose.Schema({
  runId: { type: String, required: true, index: true },
  trend: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterTrend', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  platform: { type: String, enum: Object.values(AUTOPOSTER_PLATFORMS), required: true },

  selected: { type: Boolean, default: false },
  weight: Number,
  variants: [mongoose.Schema.Types.Mixed], // all generated caption variants
  chosenVariant: Number, // index into variants

  safetyPassed: Boolean,
  safetyReason: String,

  approvalStatus: {
    type: String,
    enum: Object.values(AUTOPOSTER_APPROVAL_STATUS),
    default: AUTOPOSTER_APPROVAL_STATUS.PENDING,
    index: true
  },
  approvalActor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  createdAt: { type: Date, default: Date.now },
  actedAt: Date
}, { timestamps: false, versionKey: false });

autoposterDecisionSchema.index({ approvalStatus: 1, createdAt: -1 });

module.exports = mongoose.model('AutoposterDecision', autoposterDecisionSchema);
