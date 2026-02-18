const mongoose = require('mongoose');

const reviewSettingsSchema = new mongoose.Schema({
  // Auto-approval
  autoApproveThreshold: {
    type: Number,
    default: 4,
    min: 1,
    max: 5
  },
  autoApproveEnabled: {
    type: Boolean,
    default: true
  },
  
  // Login requirement
  requireLogin: {
    type: Boolean,
    default: true
  },
  
  // PESA Coins
  loyaltyPointsEnabled: {
    type: Boolean,
    default: true
  },
  loyaltyPointsAmount: {
    type: Number,
    default: 10,
    min: 0
  },
  
  // Email reminders
  emailReminderEnabled: {
    type: Boolean,
    default: true
  },
  emailReminderDays: {
    type: Number,
    default: 7,
    min: 1,
    max: 365
  },
  emailTemplate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  
  // Display settings
  showFirstName: {
    type: Boolean,
    default: true
  },
  showGuestName: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
reviewSettingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('ReviewSettings', reviewSettingsSchema);
