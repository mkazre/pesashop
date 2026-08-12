const mongoose = require('mongoose');

const MAX_LEVELS_CEILING = 10;

const referralLevelSchema = new mongoose.Schema({
  level: { type: Number, required: true, min: 1, max: MAX_LEVELS_CEILING },
  active: { type: Boolean, default: true },
  // Flat PESA Coins awarded to this level's beneficiary when a downline
  // signup happens at this depth.
  signupPoints: { type: Number, default: 0, min: 0 },
  // Purchase reward: either a flat coin amount per qualifying order, or a
  // percentage of the order (computed against `purchaseRewardBase` below).
  purchaseRewardType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  purchaseRewardValue: { type: Number, default: 0, min: 0 },
  // Optional per-level safeguards (see referralService.js)
  monthlyCap: { type: Number, default: null, min: 0 }, // null = no cap
  vestingDays: { type: Number, default: 0, min: 0 }, // 0 = pays out immediately
}, { _id: false });

const referralSettingsSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: false },
  maxLevels: { type: Number, default: MAX_LEVELS_CEILING, min: 1, max: MAX_LEVELS_CEILING },
  levels: { type: [referralLevelSchema], default: [] },

  // Which price is used as the 100% base for percentage-type purchase
  // rewards. Mirrors LoyaltySetting.priceBase ('backend'/'regular'/'sale')
  // plus two extra options for the raw order amount.
  purchaseRewardBase: {
    type: String,
    enum: ['subtotal', 'total', 'backend', 'regular', 'sale'],
    default: 'backend',
  },

  // Skip fraud-flagged referrals when walking the upline chain for rewards.
  excludeFraudFlagged: { type: Boolean, default: true },

  // If an upline ancestor is banned/inactive/fraud-flagged, skip past them
  // to the next valid ancestor rather than losing that level's reward.
  compressInactiveUplines: { type: Boolean, default: true },
}, {
  timestamps: true
});

referralSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const ReferralSettings = mongoose.model('ReferralSettings', referralSettingsSchema);
ReferralSettings.MAX_LEVELS_CEILING = MAX_LEVELS_CEILING;
module.exports = ReferralSettings;
