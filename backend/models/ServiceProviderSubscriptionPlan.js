const mongoose = require('mongoose');

const serviceProviderSubscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  description: String,
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: 0
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'annually'],
    default: 'monthly'
  },
  // Features included in this plan
  featuresIncluded: [{ type: String }],
  // Maximum active ads allowed on this plan
  maxActiveAds: { type: Number, default: 1 },
  // Which ad placement slots are accessible on this plan
  allowedSlots: [{ type: String }],
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },
  // Highlight as recommended plan
  isRecommended: { type: Boolean, default: false }
}, {
  timestamps: true
});

serviceProviderSubscriptionPlanSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('ServiceProviderSubscriptionPlan', serviceProviderSubscriptionPlanSchema);
