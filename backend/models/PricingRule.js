const mongoose = require('mongoose');

const quantityTierSchema = new mongoose.Schema({
  minQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  maxQuantity: {
    type: Number,
    default: null // null = no max
  },
  price: Number,
  discount: Number, // Percentage discount
  priceAdjustment: Number // Fixed amount adjustment
}, {
  _id: true
});

const pricingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Pricing rule name is required'],
    trim: true
  },
  description: String,
  
  // Rule type
  ruleType: {
    type: String,
    enum: [
      'customer_group',      // Apply to customer groups
      'customer_specific',   // Apply to specific customers
      'product_specific',    // Apply to specific products
      'category_based',     // Apply to categories
      'quantity_based',     // Quantity break pricing
      'volume_based',        // Total order value based
      'date_based',          // Time-based pricing
      'combo'                // Combination of above
    ],
    required: true
  },
  
  // Conditions
  customerGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerGroup'
  }],
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Quantity/Volume conditions
  minQuantity: Number,
  maxQuantity: Number,
  minOrderValue: Number,
  maxOrderValue: Number,
  
  // Quantity tiers
  quantityTiers: [quantityTierSchema],
  
  // Source field: which price field to read from when calculating
  sourceField: {
    type: String,
    enum: ['backendPrice', 'regularPrice', 'salePrice'],
    default: 'backendPrice'
  },
  // Target field: which price field to write the result to
  targetField: {
    type: String,
    enum: ['regularPrice', 'salePrice', 'backendPrice'],
    default: 'regularPrice'
  },

  // Pricing action
  action: {
    type: String,
    enum: ['discount_percentage', 'discount_fixed', 'set_price', 'markup_percentage', 'markup_fixed'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  
  // Date range
  validFrom: Date,
  validUntil: Date,
  
  // Time-based rules
  daysOfWeek: [{
    type: Number,
    min: 0,
    max: 6 // 0 = Sunday, 6 = Saturday
  }],
  timeOfDay: {
    start: String, // HH:mm format
    end: String
  },
  
  // Priority (higher priority rules apply first)
  priority: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Stacking (can this rule stack with others?)
  canStack: {
    type: Boolean,
    default: false
  },
  
  // Maximum discount cap
  maxDiscount: Number,
  maxDiscountAmount: Number,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
pricingRuleSchema.index({ ruleType: 1 });
pricingRuleSchema.index({ customerGroups: 1 });
pricingRuleSchema.index({ customers: 1 });
pricingRuleSchema.index({ products: 1 });
pricingRuleSchema.index({ categories: 1 });
pricingRuleSchema.index({ isActive: 1 });
pricingRuleSchema.index({ priority: -1 });
pricingRuleSchema.index({ validFrom: 1, validUntil: 1 });

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
