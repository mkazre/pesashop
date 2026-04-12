const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Offer title is required'],
    trim: true
  },
  shortDescription: { type: String, maxlength: 200 },
  description: String, // Full rich-text description
  logoUrl: String,
  bannerImageUrl: String,

  // Provider info (internal or third-party)
  providerName: String,
  providerContact: String,

  // Offer type
  offerType: {
    type: String,
    enum: ['purchasable', 'subscription', 'contact_request'],
    required: true
  },

  // Pricing (for purchasable and subscription types)
  pricing: {
    amount: { type: Number, default: 0 },
    currency: { type: String, default: 'ZAR' },
    billingCycle: {
      type: String,
      enum: ['once', 'monthly', 'quarterly', 'annually'],
      default: 'once'
    }
  },

  // Contact request settings
  contactEmail: String, // Admin receives lead here
  contactSubject: String,

  // Third-party resale
  commissionRate: { type: Number, default: 0, min: 0, max: 100 }, // %

  // Terms and conditions
  terms: String,

  // Display configuration
  displayPages: {
    type: [{ type: String, enum: ['home', 'product_detail', 'checkout', 'account'] }],
    default: ['account']
  },

  // Customer group targeting (empty = show to all)
  targetCustomerGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerGroup'
  }],

  // Appearance
  badgeText: String, // e.g. "Popular", "New"
  badgeColor: String,
  ctaButtonText: { type: String, default: 'Get This Offer' },

  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },

  // Stats
  stats: {
    views: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

offerSchema.index({ isActive: 1, displayOrder: 1 });
offerSchema.index({ displayPages: 1, isActive: 1 });
offerSchema.index({ offerType: 1 });

module.exports = mongoose.model('Offer', offerSchema);
