const mongoose = require('mongoose');

const serviceProviderAdSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },

  // Creative
  title: { type: String, required: true, maxlength: 100 },
  body: { type: String, maxlength: 300 },
  ctaText: { type: String, default: 'Learn More', maxlength: 40 },
  ctaUrl: String,
  imageUrl: String,
  logoUrl: String,

  // Placement booking
  placementSlot: {
    type: String,
    required: true
    // References ServiceProviderAdPlacement.slotId
  },
  rentPeriod: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },

  // Approval workflow
  status: {
    type: String,
    enum: ['pending_approval', 'active', 'paused', 'expired', 'rejected'],
    default: 'pending_approval'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  rejectionReason: String,

  // AI Contextual Targeting
  // Keywords the AI uses to match this ad to relevant pages
  aiKeywords: [{ type: String }],
  // Product categories this ad is relevant to
  targetCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  // Specific product pages this ad should appear on
  targetProductKeywords: [{ type: String }],

  // Performance
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },

  // Pricing paid
  amountPaid: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Computed CTR virtual
serviceProviderAdSchema.virtual('ctr').get(function() {
  if (!this.impressions) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
});

serviceProviderAdSchema.index({ provider: 1 });
serviceProviderAdSchema.index({ placementSlot: 1, status: 1 });
serviceProviderAdSchema.index({ startDate: 1, endDate: 1 });
serviceProviderAdSchema.index({ status: 1 });

module.exports = mongoose.model('ServiceProviderAd', serviceProviderAdSchema);
