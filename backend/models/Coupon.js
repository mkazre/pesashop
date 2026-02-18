const mongoose = require('mongoose');
const { COUPON_TYPES } = require('../config/constants');

// Coupon Schema
const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: String,
  
  // Discount Type
  type: {
    type: String,
    enum: Object.values(COUPON_TYPES),
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Usage Limits
  usageLimit: Number,
  usageLimitPerUser: {
    type: Number,
    default: 1
  },
  usageCount: {
    type: Number,
    default: 0
  },
  usedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    count: {
      type: Number,
      default: 1
    },
    lastUsed: Date
  }],
  
  // Restrictions
  minimumAmount: {
    type: Number,
    default: 0
  },
  maximumAmount: Number,
  
  // Product restrictions
  allowedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Category restrictions
  allowedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Customer restrictions
  allowedCustomerGroups: [String],
  allowedEmails: [String],
  excludedEmails: [String],
  
  // First purchase only
  firstPurchaseOnly: {
    type: Boolean,
    default: false
  },
  
  // Dates
  startDate: Date,
  endDate: Date,
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Stackable with other coupons
  isStackable: {
    type: Boolean,
    default: false
  },
  
  // Auto-apply via URL (?coupon=CODE)
  autoApply: {
    type: Boolean,
    default: false
  },
  
  // BOGO settings
  bogoSettings: {
    buyQuantity: { type: Number, default: 1 },
    getQuantity: { type: Number, default: 1 },
    getDiscount: { type: Number, default: 100 }, // percentage off the "get" items
    getProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // specific products to get free, empty = same as buy
    repeatLimit: { type: Number, default: 1 } // how many times BOGO can repeat per order
  },
  
  // Maximum discount cap (for percentage coupons)
  maxDiscount: {
    type: Number,
    default: 0 // 0 = no cap
  },
  
  // Exclude items already on sale
  excludeSaleItems: {
    type: Boolean,
    default: false
  },
  
  // Free shipping settings
  freeShippingMinimum: {
    type: Number,
    default: 0
  }
  
}, {
  timestamps: true
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValid = function(userId, cartTotal, cartItems = []) {
  // Check if active
  if (!this.isActive) return { valid: false, message: 'Coupon is not active' };
  
  // Check dates
  const now = new Date();
  if (this.startDate && now < this.startDate) {
    return { valid: false, message: 'Coupon not yet active' };
  }
  if (this.endDate && now > this.endDate) {
    return { valid: false, message: 'Coupon has expired' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usageCount >= this.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }
  
  // Check per-user usage limit
  if (userId && this.usageLimitPerUser) {
    const userUsage = this.usedBy.find(u => u.user.toString() === userId.toString());
    if (userUsage && userUsage.count >= this.usageLimitPerUser) {
      return { valid: false, message: 'You have reached the usage limit for this coupon' };
    }
  }
  
  // Check minimum amount
  if (this.minimumAmount && cartTotal < this.minimumAmount) {
    return { valid: false, message: `Minimum order amount of ${this.minimumAmount} required` };
  }
  
  // Check maximum amount
  if (this.maximumAmount && cartTotal > this.maximumAmount) {
    return { valid: false, message: `Maximum order amount exceeded` };
  }
  
  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(cartTotal, cartItems = []) {
  let discount = 0;
  
  switch (this.type) {
    case COUPON_TYPES.PERCENTAGE:
      discount = (cartTotal * this.value) / 100;
      if (this.maxDiscount > 0) {
        discount = Math.min(discount, this.maxDiscount);
      }
      break;
    case COUPON_TYPES.FIXED:
      discount = Math.min(this.value, cartTotal);
      break;
    case COUPON_TYPES.FIXED_PRODUCT: {
      // Apply fixed discount per qualifying product item
      let productDiscount = 0;
      for (const item of cartItems) {
        const productId = item.product?._id?.toString() || item.product?.toString();
        const isAllowed = this.allowedProducts.length === 0 || this.allowedProducts.some(p => p.toString() === productId);
        const isExcluded = this.excludedProducts.some(p => p.toString() === productId);
        if (isAllowed && !isExcluded) {
          const itemPrice = item.price || item.product?.salePrice || item.product?.regularPrice || 0;
          productDiscount += Math.min(this.value, itemPrice) * (item.quantity || 1);
        }
      }
      discount = Math.min(productDiscount, cartTotal);
      break;
    }
    case COUPON_TYPES.BOGO: {
      // Buy X Get Y at Z% off
      const bogo = this.bogoSettings || {};
      const buyQty = bogo.buyQuantity || 1;
      const getQty = bogo.getQuantity || 1;
      const getDiscountPct = bogo.getDiscount || 100;
      const repeatLimit = bogo.repeatLimit || 1;
      
      // Find qualifying items
      let totalQualifyingQty = 0;
      const qualifyingItems = [];
      for (const item of cartItems) {
        const productId = item.product?._id?.toString() || item.product?.toString();
        const isAllowed = this.allowedProducts.length === 0 || this.allowedProducts.some(p => p.toString() === productId);
        const isExcluded = this.excludedProducts.some(p => p.toString() === productId);
        if (isAllowed && !isExcluded) {
          totalQualifyingQty += (item.quantity || 1);
          qualifyingItems.push(item);
        }
      }
      
      const timesApplied = Math.min(Math.floor(totalQualifyingQty / (buyQty + getQty)), repeatLimit);
      if (timesApplied > 0 && qualifyingItems.length > 0) {
        // Sort by price ascending so cheapest items are "free"
        const sorted = [...qualifyingItems].sort((a, b) => {
          const priceA = a.price || a.product?.salePrice || a.product?.regularPrice || 0;
          const priceB = b.price || b.product?.salePrice || b.product?.regularPrice || 0;
          return priceA - priceB;
        });
        let freeItemsRemaining = getQty * timesApplied;
        for (const item of sorted) {
          if (freeItemsRemaining <= 0) break;
          const qty = Math.min(item.quantity || 1, freeItemsRemaining);
          const itemPrice = item.price || item.product?.salePrice || item.product?.regularPrice || 0;
          discount += itemPrice * qty * (getDiscountPct / 100);
          freeItemsRemaining -= qty;
        }
      }
      discount = Math.min(discount, cartTotal);
      break;
    }
    case COUPON_TYPES.FREE_SHIPPING:
      discount = 0; // Handled separately in shipping calculation
      break;
  }
  
  return Math.max(0, discount);
};

// Method to record usage
couponSchema.methods.recordUsage = async function(userId) {
  this.usageCount += 1;
  
  if (userId) {
    const userIndex = this.usedBy.findIndex(u => u.user.toString() === userId.toString());
    
    if (userIndex >= 0) {
      this.usedBy[userIndex].count += 1;
      this.usedBy[userIndex].lastUsed = new Date();
    } else {
      this.usedBy.push({
        user: userId,
        count: 1,
        lastUsed: new Date()
      });
    }
  }
  
  await this.save();
};

// Gift Card Schema
const giftCardSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  
  // Balance
  initialBalance: {
    type: Number,
    required: true,
    min: 0
  },
  currentBalance: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'ZAR'
  },
  
  // Recipient
  recipientEmail: String,
  recipientName: String,
  
  // Sender
  senderName: String,
  senderMessage: String,
  
  // Purchase info
  purchasedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  purchaseOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isRedeemed: {
    type: Boolean,
    default: false
  },
  
  // Dates
  expiryDate: Date,
  activationDate: {
    type: Date,
    default: Date.now
  },
  
  // Usage History
  usageHistory: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: Number,
    balanceAfter: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Notification
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date
  
}, {
  timestamps: true
});

// Indexes
giftCardSchema.index({ code: 1 });
giftCardSchema.index({ isActive: 1 });
giftCardSchema.index({ recipientEmail: 1 });

// Method to check if valid
giftCardSchema.methods.isValid = function() {
  if (!this.isActive) return { valid: false, message: 'Gift card is not active' };
  
  if (this.currentBalance <= 0) {
    return { valid: false, message: 'Gift card has no remaining balance' };
  }
  
  if (this.expiryDate && new Date() > this.expiryDate) {
    return { valid: false, message: 'Gift card has expired' };
  }
  
  if (this.activationDate && new Date() < this.activationDate) {
    return { valid: false, message: 'Gift card is not yet active' };
  }
  
  return { valid: true, balance: this.currentBalance };
};

// Method to redeem
giftCardSchema.methods.redeem = async function(amount, orderId) {
  if (amount > this.currentBalance) {
    throw new Error('Insufficient gift card balance');
  }
  
  this.currentBalance -= amount;
  
  this.usageHistory.push({
    order: orderId,
    amount,
    balanceAfter: this.currentBalance,
    date: new Date()
  });
  
  if (this.currentBalance === 0) {
    this.isRedeemed = true;
  }
  
  await this.save();
  return this;
};

// Static method to generate unique code
giftCardSchema.statics.generateCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let exists = true;
  
  while (exists) {
    code = '';
    for (let i = 0; i < 16; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Format: XXXX-XXXX-XXXX-XXXX
    code = code.match(/.{1,4}/g).join('-');
    
    exists = await this.findOne({ code });
  }
  
  return code;
};

module.exports = {
  Coupon: mongoose.model('Coupon', couponSchema),
  GiftCard: mongoose.model('GiftCard', giftCardSchema)
};
