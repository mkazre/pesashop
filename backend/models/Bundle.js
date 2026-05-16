const mongoose = require('mongoose');

const bundleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: String,

  // Trigger: when this bundle should appear
  triggerProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  triggerCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],

  // The bundle contents
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, default: 1 }
  }],

  // Pricing
  discountType: { type: String, enum: ['percent', 'fixed', 'price'], default: 'percent' },
  discountValue: { type: Number, default: 10 },

  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 },

  // Placement
  displayPages: {
    type: [{ type: String, enum: ['product_detail', 'cart', 'home'] }],
    default: ['product_detail']
  },

  stats: {
    impressions: { type: Number, default: 0 },
    addToCarts: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 }
  }
}, { timestamps: true });

bundleSchema.index({ isActive: 1, triggerProducts: 1 });
bundleSchema.index({ isActive: 1, triggerCategories: 1 });

module.exports = mongoose.model('Bundle', bundleSchema);
