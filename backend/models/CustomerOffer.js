const mongoose = require('mongoose');

const customerOfferSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  offer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer',
    required: true
  },
  // Snapshot of offer details at time of taking
  offerTitle: String,
  offerType: {
    type: String,
    enum: ['purchasable', 'subscription', 'contact_request']
  },

  status: {
    type: String,
    enum: ['active', 'pending_contact', 'contacted', 'cancelled', 'expired'],
    default: 'active'
  },

  // For purchasable / subscription
  purchaseDate: Date,
  expiryDate: Date,
  paymentReference: String,
  amountPaid: { type: Number, default: 0 },

  // For contact_request
  requestedAt: Date,
  contactedAt: Date,
  contactNotes: String, // Admin notes after contacting

  // Subscription renewal tracking
  nextRenewalDate: Date,
  renewalReminderSentAt: Date,

  notes: String
}, {
  timestamps: true
});

customerOfferSchema.index({ customer: 1, status: 1 });
customerOfferSchema.index({ offer: 1 });
customerOfferSchema.index({ status: 1 });

module.exports = mongoose.model('CustomerOffer', customerOfferSchema);
