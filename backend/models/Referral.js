const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  referee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, // null until they sign up
  refereeEmail: { type: String, lowercase: true, trim: true },
  refereePhone: String,
  referralCode: { type: String, required: true, index: true },

  status: {
    type: String,
    enum: ['sent', 'signed_up', 'qualified', 'rewarded', 'fraud'],
    default: 'sent',
    index: true
  },

  // Reward tracking
  refereeBonusPoints: { type: Number, default: 0 },
  refereeBonusAwardedAt: Date,
  referrerBonusPoints: { type: Number, default: 0 },
  referrerBonusAwardedAt: Date,
  qualifyingOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  // Fraud signals
  signupIp: String,
  signupUserAgent: String,
  signupDeviceFingerprint: String,
  fraudFlags: [String],

  signedUpAt: Date,
  qualifiedAt: Date,

  channel: { type: String, enum: ['link', 'whatsapp', 'email', 'sms', 'qr', 'social', 'other'], default: 'link' }
}, {
  timestamps: true
});

referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ refereeEmail: 1, referrer: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Referral', referralSchema);
