const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES, ADDRESS_TYPES } = require('../config/constants');

const addressSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: Object.values(ADDRESS_TYPES),
    required: true
  },
  firstName: String,
  lastName: String,
  company: String,
  street: String,
  street2: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  phone: String,
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  firstName: {
    type: String,
    required: [true, 'First name is required']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required']
  },
  phone: String,
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    default: USER_ROLES.CUSTOMER
  },
  
  // Custom role reference (for granular permissions beyond built-in roles)
  customRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
  },

  // Customer specific fields
  customerGroup: {
    type: String,
    default: 'retail'
  },
  
  addresses: [addressSchema],
  
  // Loyalty program
  loyaltyPoints: {
    type: Number,
    default: 0,
    min: 0
  },
  loyaltyPointsBanned: {
    type: Boolean,
    default: false
  },
  currentLoyaltyLevel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyLevel'
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  orderCount: {
    type: Number,
    default: 0
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Snapshot of this user's referral ancestry, nearest-first, capped at 10
  // entries — set once at signup (see referralService.handleSignup). Lets
  // the MLM reward engine read "who are my up-to-10 ancestors" in O(1)
  // instead of walking `referredBy` recursively on every signup/order.
  uplineChain: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastLoginDate: Date,
  consecutiveLoginDays: {
    type: Number,
    default: 0
  },
  profileCompleted: {
    type: Boolean,
    default: false
  },
  birthday: Date,
  
  // Store Credit (from PESA Coin conversions)
  storeCredit: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Security
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  lastLogin: Date,
  
  // Wishlist
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  
  // Preferences
  preferences: {
    currency: { type: String, default: 'ZAR' },
    language: { type: String, default: 'en' },
    newsletter: { type: Boolean, default: true }
  },

  // ── Demographics ─────────────────────────────────────────────────
  gender: {
    type: String,
    enum: ['male', 'female', 'non-binary', 'prefer_not_to_say']
  },
  dateOfBirth: Date,
  maritalStatus: {
    type: String,
    enum: ['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say']
  },
  householdSize: { type: Number, min: 1 },
  employmentStatus: {
    type: String,
    enum: ['employed', 'self_employed', 'student', 'retired', 'unemployed', 'prefer_not_to_say']
  },
  incomeRange: {
    type: String,
    enum: ['<15k', '15k-30k', '30k-60k', '60k-120k', '>120k', 'prefer_not_to_say']
  },
  educationLevel: {
    type: String,
    enum: ['no_schooling', 'primary', 'secondary', 'matric', 'diploma', 'degree', 'postgraduate', 'prefer_not_to_say']
  },
  province: String,
  suburb: String,

  // ── Interests & Lifestyle ─────────────────────────────────────────
  hobbies: [{ type: String }],
  interests: [{ type: String }],
  lifeStage: {
    type: String,
    enum: ['student', 'young_professional', 'new_parent', 'established_family', 'empty_nester', 'retiree']
  },

  // ── AI-Computed Shopping Behaviour ────────────────────────────────
  preferredCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  avgOrderValue: { type: Number, default: 0 },
  purchaseFrequency: String,
  lastPurchaseDate: Date,
  customerSegment: {
    type: String,
    enum: ['budget', 'value', 'premium', 'luxury']
  },
  churnRisk: {
    type: String,
    enum: ['low', 'medium', 'high']
  },

  // ── Profile Completion ────────────────────────────────────────────
  profileCompletionScore: { type: Number, default: 0, min: 0, max: 100 },
  profileCompletionFields: [{ type: String }],
  profileCompletionRewardClaimed: { type: Boolean, default: false },

  // ── Consent & Marketing ───────────────────────────────────────────
  marketingOptIn: { type: Boolean, default: false },
  demographicsConsentGiven: { type: Boolean, default: false },

  // ── Dynamic Customer Group Memberships ────────────────────────────
  dynamicGroupIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerGroup'
  }]
}, {
  timestamps: true
});

// Index for faster queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ customerGroup: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to get full name
userSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`;
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

module.exports = mongoose.model('User', userSchema);
