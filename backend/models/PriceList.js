const mongoose = require('mongoose');

const priceListItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  variation: {
    type: mongoose.Schema.Types.ObjectId, // For variable products
    default: null
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  salePrice: Number,
  
  // Quantity breaks
  minQuantity: {
    type: Number,
    default: 1,
    min: 1
  },
  maxQuantity: {
    type: Number,
    default: null // null = no max
  },
  
  // Validity
  validFrom: Date,
  validUntil: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  _id: true
});

const priceListSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Price list name is required'],
    trim: true
  },
  description: String,
  
  // Assignment
  customerGroups: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerGroup'
  }],
  customers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // Scope
  appliesToAllProducts: {
    type: Boolean,
    default: false
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Pricing method
  pricingMethod: {
    type: String,
    enum: ['fixed', 'percentage_discount', 'percentage_markup', 'override'],
    default: 'fixed'
  },
  defaultDiscount: Number, // For percentage_discount
  defaultMarkup: Number,   // For percentage_markup
  
  // Items
  items: [priceListItemSchema],
  
  // Validity
  validFrom: Date,
  validUntil: Date,
  
  // Priority (higher priority price lists override lower ones)
  priority: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true
});

// Indexes
priceListSchema.index({ customerGroups: 1 });
priceListSchema.index({ customers: 1 });
priceListSchema.index({ isActive: 1 });
priceListSchema.index({ priority: -1 });
priceListSchema.index({ validFrom: 1, validUntil: 1 });
priceListSchema.index({ 'items.product': 1 });

module.exports = mongoose.model('PriceList', priceListSchema);
