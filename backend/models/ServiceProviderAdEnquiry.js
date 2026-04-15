const mongoose = require('mongoose');

const serviceProviderAdEnquirySchema = new mongoose.Schema({
  // The ad that was enquired about
  ad: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProviderAd',
    required: true
  },
  // The provider who owns the ad (denormalised for easy lookup)
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    required: true
  },

  // Customer details (not required to be logged in)
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  location: { type: String, trim: true },
  additionalInfo: { type: String, trim: true, maxlength: 1000 },
  preferredDate: { type: Date },

  // Workflow status
  status: {
    type: String,
    enum: ['pending', 'pushed_forward', 'rejected'],
    default: 'pending'
  },
  // Admin notes when pushing forward or rejecting
  adminNotes: { type: String },
  pushedForwardAt: { type: Date },
  pushedForwardBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Track if provider has seen it
  providerViewedAt: { type: Date },
}, {
  timestamps: true
});

serviceProviderAdEnquirySchema.index({ ad: 1 });
serviceProviderAdEnquirySchema.index({ provider: 1, status: 1 });
serviceProviderAdEnquirySchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('ServiceProviderAdEnquiry', serviceProviderAdEnquirySchema);
