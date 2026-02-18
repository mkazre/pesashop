const mongoose = require('mongoose');

const couponEmailSettingsSchema = new mongoose.Schema({
  // General Settings
  enabled: {
    type: Boolean,
    default: true
  },
  
  // Email Templates (4 different templates)
  templates: {
    firstPurchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate'
    },
    newUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate'
    },
    spendingMilestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate'
    },
    birthday: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmailTemplate'
    }
  },
  
  // Automation Rules
  automations: {
    // Send after first purchase
    firstPurchase: {
      enabled: {
        type: Boolean,
        default: false
      },
      couponTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
      },
      delayHours: {
        type: Number,
        default: 0 // Send immediately
      }
    },
    
    // Send to new registered users
    newUser: {
      enabled: {
        type: Boolean,
        default: false
      },
      couponTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
      },
      delayHours: {
        type: Number,
        default: 0
      }
    },
    
    // Send based on spending amount
    spendingMilestone: {
      enabled: {
        type: Boolean,
        default: false
      },
      milestones: [{
        amount: {
          type: Number,
          required: true
        },
        couponTemplate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Coupon'
        },
        sendOnce: {
          type: Boolean,
          default: true
        }
      }]
    },
    
    // Send based on order count
    orderCount: {
      enabled: {
        type: Boolean,
        default: false
      },
      milestones: [{
        orderCount: {
          type: Number,
          required: true
        },
        couponTemplate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Coupon'
        },
        sendOnce: {
          type: Boolean,
          default: true
        }
      }]
    },
    
    // Send based on specific products purchased
    productPurchase: {
      enabled: {
        type: Boolean,
        default: false
      },
      rules: [{
        products: [{
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product'
        }],
        couponTemplate: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Coupon'
        },
        sendOnce: {
          type: Boolean,
          default: true
        }
      }]
    },
    
    // Send on birthday
    birthday: {
      enabled: {
        type: Boolean,
        default: false
      },
      couponTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
      },
      sendDaysBefore: {
        type: Number,
        default: 0 // Send on birthday
      }
    },
    
    // Send after X days since last purchase
    daysSinceLastPurchase: {
      enabled: {
        type: Boolean,
        default: false
      },
      days: {
        type: Number,
        default: 30
      },
      couponTemplate: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
      },
      sendOnce: {
        type: Boolean,
        default: false // Can send multiple times
      }
    }
  },
  
  // Checkout Options
  checkout: {
    allowAcceptReject: {
      type: Boolean,
      default: false
    },
    showCouponInCheckout: {
      type: Boolean,
      default: true
    }
  },
  
  // Tracking
  sentCoupons: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    automationType: String,
    sentAt: {
      type: Date,
      default: Date.now
    },
    emailSent: {
      type: Boolean,
      default: false
    }
  }]
  
}, {
  timestamps: true
});

// Indexes
couponEmailSettingsSchema.index({ 'sentCoupons.user': 1, 'sentCoupons.automationType': 1 });

// Static method to get or create settings
couponEmailSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Method to check if coupon was already sent for automation
couponEmailSettingsSchema.methods.wasCouponSent = function(userId, automationType) {
  return this.sentCoupons.some(
    sc => sc.user.toString() === userId.toString() && 
          sc.automationType === automationType
  );
};

// Method to record sent coupon
couponEmailSettingsSchema.methods.recordSentCoupon = async function(userId, couponId, automationType, emailSent = false) {
  this.sentCoupons.push({
    user: userId,
    coupon: couponId,
    automationType,
    emailSent,
    sentAt: new Date()
  });
  await this.save();
};

module.exports = mongoose.model('CouponEmailSettings', couponEmailSettingsSchema);
