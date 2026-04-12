const mongoose = require('mongoose');

const loyaltyRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Rule Type
  ruleType: {
    type: String,
    enum: ['earning', 'redemption', 'profile_complete'],
    required: true
  },
  
  // Earning Rule Settings
  pointsPerCurrency: Number, // Override global rate
  pointsPerCurrencyPercentage: Number, // Percentage of price
  fixedPoints: Number, // Fixed points amount
  
  // Price Base (for earning rules)
  priceBase: {
    type: String,
    enum: ['backend', 'regular', 'sale'],
    default: 'regular'
  },
  
  // Conditions
  // Products
  applyToProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Categories
  applyToCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludeCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // User Roles
  applyToRoles: [String],
  excludeRoles: [String],
  
  // Customer Groups
  applyToGroups: [String],
  excludeGroups: [String],
  
  // Loyalty Levels
  applyToLevels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyLevel'
  }],
  excludeLevels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyLevel'
  }],
  
  // Price Range
  minPrice: Number,
  maxPrice: Number,
  
  // Exclude on-sale products
  excludeOnSale: {
    type: Boolean,
    default: false
  },
  
  // Redemption Rule Settings
  redemptionType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  redemptionRate: Number, // Points per currency unit (fixed) or percentage (percentage)
  minRedemptionPoints: Number,
  maxRedemptionPoints: Number,
  maxRedemptionPercentage: Number,
  minCartAmount: Number, // Minimum cart amount to redeem
  allowFreeShipping: {
    type: Boolean,
    default: false
  },
  
  // Priority (higher priority rules are checked first)
  priority: {
    type: Number,
    default: 0
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
loyaltyRuleSchema.index({ ruleType: 1, isActive: 1 });
loyaltyRuleSchema.index({ priority: -1 });

// Method to check if rule applies to a product
loyaltyRuleSchema.methods.appliesToProduct = function(product, user, userLevel) {
  // Check product exclusions
  if (this.excludeProducts.length > 0 && this.excludeProducts.some(id => id.toString() === product._id.toString())) {
    return false;
  }
  
  // Check product inclusions
  if (this.applyToProducts.length > 0 && !this.applyToProducts.some(id => id.toString() === product._id.toString())) {
    return false;
  }
  
  // Check category exclusions
  if (product.categories && product.categories.length > 0) {
    const productCategoryIds = product.categories.map(c => c._id ? c._id.toString() : c.toString());
    if (this.excludeCategories.length > 0 && this.excludeCategories.some(id => productCategoryIds.includes(id.toString()))) {
      return false;
    }
    if (this.applyToCategories.length > 0 && !this.applyToCategories.some(id => productCategoryIds.includes(id.toString()))) {
      return false;
    }
  }
  
  // Check on-sale exclusion
  if (this.excludeOnSale && product.salePrice && product.salePrice < product.regularPrice) {
    return false;
  }
  
  // Check price range
  const productPrice = this.priceBase === 'backend' ? (product.backendPrice || product.regularPrice) :
    this.priceBase === 'sale' ? (product.salePrice || product.regularPrice) :
    product.regularPrice;
  
  if (this.minPrice && productPrice < this.minPrice) return false;
  if (this.maxPrice && productPrice > this.maxPrice) return false;
  
  // Check user role
  if (user) {
    if (this.excludeRoles.length > 0 && this.excludeRoles.includes(user.role)) {
      return false;
    }
    if (this.applyToRoles.length > 0 && !this.applyToRoles.includes(user.role)) {
      return false;
    }
    
    // Check customer group
    if (this.excludeGroups.length > 0 && this.excludeGroups.includes(user.customerGroup)) {
      return false;
    }
    if (this.applyToGroups.length > 0 && !this.applyToGroups.includes(user.customerGroup)) {
      return false;
    }
  }
  
  // Check loyalty level
  if (userLevel) {
    if (this.excludeLevels.length > 0 && this.excludeLevels.some(id => id.toString() === userLevel._id.toString())) {
      return false;
    }
    if (this.applyToLevels.length > 0 && !this.applyToLevels.some(id => id.toString() === userLevel._id.toString())) {
      return false;
    }
  }
  
  return true;
};

module.exports = mongoose.model('LoyaltyRule', loyaltyRuleSchema);
