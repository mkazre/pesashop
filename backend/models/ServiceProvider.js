const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const documentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['id_document', 'trade_certificate', 'proof_of_address', 'other'],
    required: true
  },
  label: String,
  url: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const serviceProviderSchema = new mongoose.Schema({
  // Auth
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
    minlength: 6,
    select: false
  },

  // Business Profile
  businessName: {
    type: String,
    required: [true, 'Business name is required'],
    trim: true
  },
  contactName: { type: String, required: true },
  phone: String,
  website: String,
  bio: { type: String, maxlength: 1000 },
  logoUrl: String,
  bannerUrl: String,

  // Service Category
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProviderCategory',
    required: true
  },

  // Location
  province: String,
  city: String,
  serviceAreas: [{ type: String }], // List of areas they serve

  // Application
  applicationStatus: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  applicationDate: { type: Date, default: Date.now },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
  reviewNotes: String,
  rejectionReason: String,

  // Documents submitted with application
  documents: [documentSchema],

  // Subscription
  subscriptionPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProviderSubscriptionPlan'
  },
  subscriptionStatus: {
    type: String,
    enum: ['none', 'active', 'expired', 'cancelled', 'pending_payment'],
    default: 'none'
  },
  subscriptionStartDate: Date,
  subscriptionExpiry: Date,
  subscriptionRenewalRemindedAt: Date,

  // Verification
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  // Ratings (aggregated from customer reviews of service provider)
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },

  // Password reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,

  // Stats
  totalImpressions: { type: Number, default: 0 },
  totalClicks: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Hash password before saving
serviceProviderSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

serviceProviderSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

serviceProviderSchema.index({ applicationStatus: 1 });
serviceProviderSchema.index({ category: 1 });
serviceProviderSchema.index({ subscriptionStatus: 1 });
serviceProviderSchema.index({ isActive: 1 });

module.exports = mongoose.model('ServiceProvider', serviceProviderSchema);
