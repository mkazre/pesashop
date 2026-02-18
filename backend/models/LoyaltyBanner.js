const mongoose = require('mongoose');

const loyaltyBannerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['target', 'get_points'],
    required: true
  },
  
  // Target Banner (shows progress)
  targetType: {
    type: String,
    enum: ['points', 'level', 'spending', 'orders'],
    default: 'points'
  },
  targetValue: Number,
  currentValue: Number, // For specific user
  
  // Get Points Banner (action prompts)
  actionType: {
    type: String,
    enum: ['refer_friend', 'leave_review', 'daily_login', 'complete_profile', 'birthday', 'custom'],
    default: 'custom'
  },
  actionPoints: Number, // Points awarded for action
  
  // Design
  title: {
    type: String,
    required: true
  },
  description: String,
  image: String, // Banner image URL
  backgroundColor: {
    type: String,
    default: '#ffffff'
  },
  textColor: {
    type: String,
    default: '#000000'
  },
  buttonText: String,
  buttonColor: {
    type: String,
    default: '#0e604a'
  },
  buttonTextColor: {
    type: String,
    default: '#ffffff'
  },
  
  // Display Settings
  displayOn: [{
    type: String,
    enum: ['my_account', 'cart', 'checkout', 'product', 'home']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Conditions
  userRoles: [String], // Show only to specific roles
  customerGroups: [String], // Show only to specific groups
  minPoints: Number, // Minimum points to show
  maxPoints: Number, // Maximum points to show
  
  // Link/Redirect
  actionUrl: String,
  actionText: String
}, {
  timestamps: true
});

// Indexes
loyaltyBannerSchema.index({ type: 1, isActive: 1 });
loyaltyBannerSchema.index({ displayOrder: 1 });

module.exports = mongoose.model('LoyaltyBanner', loyaltyBannerSchema);
