const mongoose = require('mongoose');

// Predefined ad placement slots across the platform
const serviceProviderAdPlacementSchema = new mongoose.Schema({
  slotId: {
    type: String,
    required: true,
    unique: true,
    trim: true
    // e.g. 'home_banner', 'product_detail_below_buy'
  },
  slotLabel: { type: String, required: true },
  slotPage: {
    type: String,
    enum: ['home', 'archive', 'category', 'product_detail', 'checkout', 'account'],
    required: true
  },
  description: String,
  // Max ads shown simultaneously in this slot
  maxAds: { type: Number, default: 1 },
  // Pricing per rental period
  dailyRate: { type: Number, default: 0 },
  weeklyRate: { type: Number, default: 0 },
  monthlyRate: { type: Number, default: 0 },
  yearlyRate: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

serviceProviderAdPlacementSchema.index({ slotPage: 1, isActive: 1 });

module.exports = mongoose.model('ServiceProviderAdPlacement', serviceProviderAdPlacementSchema);
