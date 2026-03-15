const mongoose = require('mongoose');

const laybyApplicationSchema = new mongoose.Schema({
  // Applicant Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },

  // ID Document
  idDocument: {
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimetype: { type: String, required: true },
    size: { type: Number, required: true },
    path: { type: String, required: true }
  },

  // Product Information
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  productPrice: {
    type: Number,
    required: true
  },

  // Selected layby plan
  laybyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LaybyPlan'
  },
  planName: { type: String, default: '' },
  depositAmount: { type: Number, default: 0 },
  installmentAmount: { type: Number, default: 0 },
  numberOfPayments: { type: Number, default: 0 },
  frequency: { type: String, default: 'monthly' },

  // Optional: linked to existing customer account
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'expired'],
    default: 'pending'
  },

  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: String,
  rejectionReason: String,

  // If approved, link to created laybye
  laybye: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laybye'
  },

  // Notes from applicant
  notes: {
    type: String,
    default: ''
  },

  // Email notification tracking
  notificationSent: {
    type: Boolean,
    default: false
  },
  approvalEmailSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for efficient queries
laybyApplicationSchema.index({ status: 1, createdAt: -1 });
laybyApplicationSchema.index({ email: 1 });
laybyApplicationSchema.index({ customer: 1 });
laybyApplicationSchema.index({ product: 1 });

module.exports = mongoose.model('LaybyApplication', laybyApplicationSchema);
