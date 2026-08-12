const mongoose = require('mongoose');

// The MLM-specific audit ledger: one row per (beneficiary, level,
// triggering event). Purpose-built for "who earned what, from whom, at
// what level" traceability — separate from, but linked to, the general
// PESA Coins wallet ledger (LoyaltyPoint) via `loyaltyPointTransaction`,
// so the spendable-coin balance and the MLM attribution trail always
// reconcile.
const referralRewardSchema = new mongoose.Schema({
  beneficiary: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // who earned it
  sourceUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // whose signup/order triggered it
  level: { type: Number, required: true, min: 1, max: 10 },
  eventType: { type: String, enum: ['signup', 'purchase'], required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // null for signup events

  // Snapshot of how the reward was computed, for auditability even if
  // settings change later.
  rewardBase: {
    type: { type: String, enum: ['fixed', 'percentage'] },
    priceBase: String, // e.g. 'backend' | 'regular' | 'sale' | 'subtotal' | 'total' — percentage events only
    baseAmount: Number, // the raw order amount the percentage was computed against
    rate: Number, // the configured value (flat points, or percentage) at award time
  },

  pointsAwarded: { type: Number, required: true },
  loyaltyPointTransaction: { type: mongoose.Schema.Types.ObjectId, ref: 'LoyaltyPoint' },

  status: { type: String, enum: ['pending', 'vested', 'paid', 'reversed'], default: 'paid' },
  vestsAt: Date,
}, {
  timestamps: true
});

// Idempotency guard: a given order can only reward a given beneficiary at a
// given level once, even if the completed-status handler somehow fires
// twice. Sparse because signup events have no order.
referralRewardSchema.index({ order: 1, beneficiary: 1, level: 1 }, { unique: true, sparse: true });
referralRewardSchema.index({ beneficiary: 1, level: 1 });
referralRewardSchema.index({ sourceUser: 1 });
referralRewardSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ReferralReward', referralRewardSchema);
