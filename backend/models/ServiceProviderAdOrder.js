const mongoose = require('mongoose');

const serviceProviderAdOrderSchema = new mongoose.Schema({
  provider: { type: mongoose.Schema.Types.ObjectId, ref: 'ServiceProvider', required: true },
  // Slot being booked
  slotId: { type: String, required: true },
  slotLabel: { type: String },
  slotPage: { type: String },
  // Pricing & package
  durationType: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'], required: true },
  quantity: { type: Number, default: 1, min: 1 }, // how many units (e.g. 3 months)
  unitPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  // How many ad creatives the provider may create under this order
  maxAds: { type: Number, default: 1, min: 1, max: 50 },
  // Payment
  paymentMethod: {
    type: String,
    default: 'eft',
    validate: {
      validator: (v) => ['eft', 'cash', 'card', 'other'].includes(v) || /^bank:.+/.test(v),
      message: (props) => `${props.value} is not a valid paymentMethod (expected eft|cash|card|other or bank:<name>)`,
    },
  },
  paymentReference: { type: String, default: '' },
  // Status flow: pending_payment → active or declined
  status: { type: String, enum: ['pending_payment', 'active', 'declined', 'expired', 'cancelled'], default: 'pending_payment' },
  // Dates
  startDate: { type: Date },
  endDate: { type: Date },
  // Admin action
  activatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  activatedAt: { type: Date },
  declineReason: { type: String, default: '' },
  notes: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('ServiceProviderAdOrder', serviceProviderAdOrderSchema);
