const mongoose = require('mongoose');
const { LOYALTY_TYPES } = require('../config/constants');

const loyaltyPointSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(LOYALTY_TYPES),
    required: true
  },
  reason: String,
  
  // Reference
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Expiry
  expiryDate: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Balance after transaction
  balanceAfter: Number
  
}, {
  timestamps: true
});

// Loyalty Settings Schema
const loyaltySettingSchema = new mongoose.Schema({
  enabled: {
    type: Boolean,
    default: true
  },
  
  // Points Assignment
  assignmentMode: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic'
  },
  assignToRoles: [String], // Empty = all roles
  assignToMembersOnly: {
    type: Boolean,
    default: false
  },
  bannedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignToGuests: {
    type: Boolean,
    default: false
  },
  assignToNewUsers: {
    type: Boolean,
    default: true
  },
  
  // Global Earning Rules
  pointsPerCurrency: {
    type: Number,
    default: 1
  },
  priceBase: {
    type: String,
    enum: ['backend', 'regular', 'sale'],
    default: 'regular'
  },
  minimumOrderAmount: {
    type: Number,
    default: 0
  },
  
  // Order Status for Points Assignment
  assignOnOrderStatus: [{
    type: String,
    enum: ['pending', 'processing', 'on-hold', 'completed', 'cancelled', 'refunded', 'failed']
  }],
  defaultAssignStatus: {
    type: String,
    enum: ['pending', 'processing', 'on-hold', 'completed'],
    default: 'completed'
  },
  
  // Exclusions
  excludeProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludeCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludeOnSale: {
    type: Boolean,
    default: false
  },
  
  // Points Removal
  removeOnCancel: {
    type: Boolean,
    default: true
  },
  removeOnRefund: {
    type: Boolean,
    default: true
  },
  noPointsOnRedemption: {
    type: Boolean,
    default: true
  },
  
  // Expiry
  pointsExpiryDays: Number,
  expiryEnabled: {
    type: Boolean,
    default: false
  },
  
  // Redemption Rules
  redemptionMode: {
    type: String,
    enum: ['automatic', 'manual'],
    default: 'automatic'
  },
  autoRedeemRoles: [String], // Empty = all roles
  autoRedeemMembersOnly: {
    type: Boolean,
    default: false
  },
  redemptionType: {
    type: String,
    enum: ['fixed', 'percentage'],
    default: 'fixed'
  },
  redemptionRate: {
    type: Number,
    default: 0.1 // For fixed: points per currency unit, for percentage: percentage of order
  },
  minRedemptionPoints: {
    type: Number,
    default: 100
  },
  maxRedemptionPoints: Number,
  maxRedemptionPercentage: {
    type: Number,
    default: 50
  },
  minCartAmountForRedemption: {
    type: Number,
    default: 0
  },
  allowFreeShippingOnRedemption: {
    type: Boolean,
    default: false
  },
  autoRedeemInCart: {
    type: Boolean,
    default: false
  },
  
  // Extra Points
  signupBonus: {
    type: Number,
    default: 0
  },
  dailyLoginBonus: {
    type: Number,
    default: 0
  },
  profileCompleteBonus: {
    type: Number,
    default: 0
  },
  referralRegistrationBonus: {
    type: Number,
    default: 0
  },
  referralPurchaseBonus: {
    type: Number,
    default: 0
  },
  topCustomerBonus: {
    type: Number,
    default: 0
  },
  topCustomerPeriod: {
    type: String,
    enum: ['weekly', 'monthly'],
    default: 'monthly'
  },
  levelAchievementBonus: {
    type: Boolean,
    default: true // Use level's extraPointsOnAchievement
  },
  birthdayBonus: {
    type: Number,
    default: 0
  },
  reviewBonus: {
    type: Number,
    default: 0
  },
  orderCountBonuses: [{
    orderCount: Number,
    bonusPoints: Number
  }],
  cartTotalBonuses: [{
    cartTotal: Number,
    bonusPoints: Number
  }],
  totalSpentBonuses: [{
    totalSpent: Number,
    bonusPoints: Number
  }],
  
  // Customer Group Multipliers
  groupMultipliers: [{
    group: String,
    multiplier: {
      type: Number,
      default: 1
    }
  }],
  
  // Currency Support
  currencyMultipliers: [{
    currency: String,
    multiplier: {
      type: Number,
      default: 1
    }
  }],
  
  // Email Notifications
  emailNotifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    onPointsEarned: {
      type: Boolean,
      default: true
    },
    onPointsRedeemed: {
      type: Boolean,
      default: true
    },
    onPointsExpiring: {
      type: Boolean,
      default: true
    },
    daysBeforeExpiry: {
      type: Number,
      default: 7
    },
    onLevelUp: {
      type: Boolean,
      default: true
    }
  },
  
  // Labels & Customization
  labels: {
    points: {
      type: String,
      default: 'PESA Coins'
    },
    point: {
      type: String,
      default: 'PESA Coin'
    },
    redeem: {
      type: String,
      default: 'Redeem'
    },
    earned: {
      type: String,
      default: 'Earned'
    }
  }
  
}, {
  timestamps: true
});

// Indexes
loyaltyPointSchema.index({ user: 1 });
loyaltyPointSchema.index({ type: 1 });
loyaltyPointSchema.index({ expiryDate: 1 });
loyaltyPointSchema.index({ createdAt: -1 });

// Statics for LoyaltyPoint
loyaltyPointSchema.statics.getUserBalance = async function(userId) {
  const result = await this.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        isExpired: false
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$points' }
      }
    }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

loyaltyPointSchema.statics.addPoints = async function(userId, points, type, reason, orderId = null) {
  const User = mongoose.model('User');
  const settings = await mongoose.model('LoyaltySetting').findOne();
  
  // Calculate expiry date if enabled
  let expiryDate = null;
  if (settings && settings.expiryEnabled && settings.pointsExpiryDays) {
    expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + settings.pointsExpiryDays);
  }
  
  // Get current balance
  const currentBalance = await this.getUserBalance(userId);
  
  // Create transaction
  const transaction = await this.create({
    user: userId,
    points,
    type,
    reason,
    order: orderId,
    expiryDate,
    balanceAfter: currentBalance + points
  });
  
  // Update user's PESA Coins balance
  await User.findByIdAndUpdate(userId, {
    $inc: { loyaltyPoints: points }
  });
  
  return transaction;
};

loyaltyPointSchema.statics.redeemPoints = async function(userId, points, orderId, reason = 'Order redemption') {
  const User = mongoose.model('User');
  const currentBalance = await this.getUserBalance(userId);
  
  if (currentBalance < points) {
    throw new Error('Insufficient PESA Coins');
  }
  
  // Create redemption transaction
  const transaction = await this.create({
    user: userId,
    points: -points,
    type: LOYALTY_TYPES.REDEEMED,
    reason,
    order: orderId,
    balanceAfter: currentBalance - points
  });
  
  // Update user's PESA Coins balance
  await User.findByIdAndUpdate(userId, {
    $inc: { loyaltyPoints: -points }
  });
  
  return transaction;
};

loyaltyPointSchema.statics.calculateEarnedPoints = async function(orderAmount, customerGroup) {
  const settings = await mongoose.model('LoyaltySetting').findOne();
  
  if (!settings || !settings.enabled) return 0;
  
  if (orderAmount < settings.minimumOrderAmount) return 0;
  
  let points = orderAmount * settings.pointsPerCurrency;
  
  // Apply group multiplier
  const groupMultiplier = settings.groupMultipliers.find(gm => gm.group === customerGroup);
  if (groupMultiplier) {
    points *= groupMultiplier.multiplier;
  }
  
  return Math.floor(points);
};

loyaltyPointSchema.statics.getPointValue = async function(points) {
  const settings = await mongoose.model('LoyaltySetting').findOne();
  
  if (!settings || !settings.enabled) return 0;
  
  return points * settings.redemptionRate;
};

loyaltyPointSchema.statics.expirePoints = async function() {
  const User = mongoose.model('User');
  const now = new Date();
  
  const expiredPoints = await this.find({
    expiryDate: { $lt: now },
    isExpired: false,
    type: LOYALTY_TYPES.EARNED
  });
  
  for (const point of expiredPoints) {
    point.isExpired = true;
    await point.save();
    
    // Update user balance
    await User.findByIdAndUpdate(point.user, {
      $inc: { loyaltyPoints: -point.points }
    });
    
    // Create expiry transaction
    await this.create({
      user: point.user,
      points: -point.points,
      type: LOYALTY_TYPES.EXPIRED,
      reason: 'Points expired',
      balanceAfter: await this.getUserBalance(point.user)
    });
  }
  
  return expiredPoints.length;
};

module.exports = {
  LoyaltyPoint: mongoose.model('LoyaltyPoint', loyaltyPointSchema),
  LoyaltySetting: mongoose.model('LoyaltySetting', loyaltySettingSchema)
};
