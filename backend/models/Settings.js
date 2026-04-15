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
  storeLogo: {
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
  
  // Web Push (VAPID) Keys
  vapidPublicKey: { type: String, default: '' },
  vapidPrivateKey: { type: String, default: '' },

  // Email Settings
  emailProvider: { type: String, enum: ['smtp', 'brevo'], default: 'smtp' },
  brevoApiKey: { type: String, default: '' },
  // SMTP (used when emailProvider = 'smtp', or as fallback)
  smtpHost: { type: String, default: '' },
  smtpPort: { type: Number, default: 587 },
  smtpUser: { type: String, default: '' },
  smtpPassword: { type: String, default: '' },
  smtpSecure: { type: Boolean, default: false },
  fromEmail: { type: String, default: '' },
  fromName: { type: String, default: '' },
  replyToEmail: { type: String, default: '' },

  // Email Notification Toggles
  emailNotifications: {
    // Orders
    orderConfirmation: { type: Boolean, default: true },
    orderShipped: { type: Boolean, default: true },
    orderDelivered: { type: Boolean, default: true },
    orderCancelled: { type: Boolean, default: true },
    orderRefunded: { type: Boolean, default: true },
    orderNote: { type: Boolean, default: true },
    // Laybye
    laybyeApplicationReceived: { type: Boolean, default: true },
    laybyeApplicationApproved: { type: Boolean, default: true },
    laybyeApplicationRejected: { type: Boolean, default: true },
    laybyeCreated: { type: Boolean, default: true },
    laybyePaymentReceived: { type: Boolean, default: true },
    laybyeCompleted: { type: Boolean, default: true },
    laybyeReminder: { type: Boolean, default: true },
    laybyeOverdueReminder: { type: Boolean, default: true },
    laybyeExpiryReminder: { type: Boolean, default: true },
    // Accounts
    newAccount: { type: Boolean, default: true },
    passwordReset: { type: Boolean, default: true },
    // Loyalty & Coupons
    loyaltyPointsEarned: { type: Boolean, default: true },
    loyaltyPointsRedeemed: { type: Boolean, default: true },
    giftCardIssued: { type: Boolean, default: true },
    couponFirstPurchase: { type: Boolean, default: true },
    couponNewUser: { type: Boolean, default: true },
    couponSpendingMilestone: { type: Boolean, default: true },
    couponBirthday: { type: Boolean, default: true },
    // Reviews
    reviewReminder: { type: Boolean, default: true },
    // Admin notifications
    adminNewOrder: { type: Boolean, default: true },
    adminLowStock: { type: Boolean, default: true },
    adminNewLaybyeApplication: { type: Boolean, default: true },
  },
  
  // AI Settings
  openaiApiKey: {
    type: String,
    default: ''
  },
  deepseekApiKey: {
    type: String,
    default: ''
  },
  anthropicApiKey: {
    type: String,
    default: ''
  },
  aiEnabled: {
    type: Boolean,
    default: false
  },
  aiFallbackProvider: {
    type: String,
    enum: ['openai', 'deepseek', 'anthropic'],
    default: 'openai'
  },
  aiWebSearchEnabled: {
    type: Boolean,
    default: false
  },
  aiWebSearchApiKey: {
    type: String,
    default: ''
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

  // Service Providers Page Hero
  servicePageHero: {
    imageUrl: { type: String, default: '' },
    title: { type: String, default: 'Professional Services' },
    subtitle: { type: String, default: 'Book trusted professionals for repairs, installations & maintenance' },
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
  },

  // Service Provider Ad display settings
  serviceProviderAdSettings: {
    sectionTitle: { type: String, default: 'Featured Services' },
    showImage: { type: Boolean, default: true },
    showBody: { type: Boolean, default: true },
    showProviderName: { type: Boolean, default: false },
    enquireButtonText: { type: String, default: 'Enquire' },
    maxAdsPerSlot: { type: Number, default: 6 },
    cardMinWidth: { type: Number, default: 180 },
    cardMaxWidth: { type: Number, default: 220 },
  },
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
