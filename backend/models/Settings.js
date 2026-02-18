const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  // Store Information
  storeName: {
    type: String,
    default: 'My Store'
  },
  storeEmail: {
    type: String,
    default: ''
  },
  storePhone: {
    type: String,
    default: ''
  },
  storeAddress: {
    type: String,
    default: ''
  },
  
  // Regional Settings
  currency: {
    type: String,
    default: 'ZAR'
  },
  timeZone: {
    type: String,
    default: 'Africa/Johannesburg'
  },
  dateFormat: {
    type: String,
    default: 'dd/MM/yyyy'
  },
  taxRate: {
    type: Number,
    default: 15
  },
  
  // Email Settings
  smtpHost: String,
  smtpPort: Number,
  smtpUser: String,
  smtpPassword: String,
  smtpSecure: {
    type: Boolean,
    default: true
  },
  fromEmail: String,
  fromName: String,
  
  // AI Settings
  openaiApiKey: {
    type: String,
    default: ''
  },
  aiEnabled: {
    type: Boolean,
    default: false
  },
  
  // Advanced Settings
  enableGuestCheckout: {
    type: Boolean,
    default: true
  },
  enableProductReviews: {
    type: Boolean,
    default: true
  },
  showStockQuantities: {
    type: Boolean,
    default: true
  },
  allowBackorders: {
    type: Boolean,
    default: true
  },
  
  // Product Display - Text Clamping
  productDisplay: {
    // Product Detail Page
    detailPage: {
      titleLines: { type: Number, default: 0, min: 0, max: 20 },        // 0 = no clamp
      descriptionLines: { type: Number, default: 0, min: 0, max: 20 },
      shortDescriptionLines: { type: Number, default: 0, min: 0, max: 20 },
      reviewLines: { type: Number, default: 0, min: 0, max: 20 },
    },
    // Other Locations (grids, lists, archives, search results, etc.)
    otherLocations: {
      titleLines: { type: Number, default: 2, min: 0, max: 20 },
      descriptionLines: { type: Number, default: 3, min: 0, max: 20 },
      shortDescriptionLines: { type: Number, default: 2, min: 0, max: 20 },
      reviewLines: { type: Number, default: 3, min: 0, max: 20 },
    }
  },

  // Layby Settings
  layby: {
    enabled: {
      type: Boolean,
      default: true
    },
    globalMinimumProductValue: {
      type: Number,
      min: 0,
      default: 0 // 0 means no global minimum, use plan-specific
    },
    defaultExpiryDays: {
      type: Number,
      min: 0,
      default: 90
    },
    autoCancelOnExpiry: {
      type: Boolean,
      default: true
    },
    sendEmailReminders: {
      type: Boolean,
      default: true
    },
    termsAndConditions: {
      type: String,
      default: ''
    },
    applicationEmail: {
      type: String,
      default: 'hello@pesashop.com'
    },
    widgetEnabled: {
      type: Boolean,
      default: true
    },
    widgetButtonText: {
      type: String,
      default: 'GET IT ON LAYBY'
    }
  },

  // Bank Details (for EFT payments)
  bankDetails: [{
    bankName: { type: String, default: '' },
    accountName: { type: String, default: '' },
    accountNumber: { type: String, default: '' },
    branchCode: { type: String, default: '' },
    accountType: { type: String, default: '' },
    reference: { type: String, default: '' },
  }],

  // Social Login Settings
  socialLogin: {
    google: {
      enabled: { type: Boolean, default: false },
      clientId: { type: String, default: '' },
      clientSecret: { type: String, default: '' },
    },
    facebook: {
      enabled: { type: Boolean, default: false },
      appId: { type: String, default: '' },
      appSecret: { type: String, default: '' },
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
