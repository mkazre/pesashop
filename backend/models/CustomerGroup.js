const mongoose = require('mongoose');

const customerGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Customer group name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: String,
  
  // Pricing settings
  defaultDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100 // Percentage discount
  },
  
  // Minimum order requirements
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  minimumOrderQuantity: {
    type: Number,
    default: 0
  },
  
  // Payment terms
  paymentTerms: {
    type: String,
    enum: ['immediate', 'net_7', 'net_15', 'net_30', 'net_60', 'custom'],
    default: 'immediate'
  },
  customPaymentTerms: String,
  
  // Credit limit
  creditLimit: {
    type: Number,
    default: 0
  },
  
  // Tax settings
  taxExempt: {
    type: Boolean,
    default: false
  },
  taxId: String,
  
  // Display settings
  showPrices: {
    type: Boolean,
    default: true
  },
  showRetailPrices: {
    type: Boolean,
    default: false // Show retail prices alongside B2B prices
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Priority (for rule matching - higher priority wins)
  priority: {
    type: Number,
    default: 0
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Customer count (auto-calculated)
  customerCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Auto-generate slug from name
customerGroupSchema.pre('save', async function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Indexes
customerGroupSchema.index({ slug: 1 });
customerGroupSchema.index({ isActive: 1 });
customerGroupSchema.index({ priority: -1 });

module.exports = mongoose.model('CustomerGroup', customerGroupSchema);
