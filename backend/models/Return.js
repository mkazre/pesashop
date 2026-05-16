const mongoose = require('mongoose');

const returnItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  orderItem: mongoose.Schema.Types.ObjectId,
  name: String,
  sku: String,
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },
  total: { type: Number, required: true },
  reason: String,
  condition: { type: String, enum: ['unopened', 'opened', 'damaged', 'defective'], default: 'opened' },
  restock: { type: Boolean, default: true }
}, { _id: true });

const returnSchema = new mongoose.Schema({
  rmaNumber: { type: String, unique: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  items: [returnItemSchema],

  reason: { type: String, required: true },
  reasonCategory: {
    type: String,
    enum: ['defective', 'wrong_item', 'not_as_described', 'damaged_shipping', 'changed_mind', 'size_fit', 'other'],
    default: 'other'
  },
  customerNotes: String,
  photos: [String],

  status: {
    type: String,
    enum: ['requested', 'approved', 'rejected', 'awaiting_shipment', 'received', 'refunded', 'closed', 'disputed'],
    default: 'requested',
    index: true
  },

  refundMethod: { type: String, enum: ['pesa_coins', 'original_payment', 'store_credit'], default: 'pesa_coins' },
  refundAmount: { type: Number, default: 0 },
  refundedAt: Date,
  refundReference: String,

  returnWaybill: { type: mongoose.Schema.Types.ObjectId, ref: 'Waybill' },
  trackingNumber: String,

  adminNotes: String,
  rejectionReason: String,

  disputeReason: String,
  disputeOpenedAt: Date,
  disputeResolvedAt: Date,

  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  receivedAt: Date,
  closedAt: Date
}, {
  timestamps: true
});

returnSchema.index({ customer: 1, status: 1 });
returnSchema.index({ status: 1, createdAt: -1 });

returnSchema.pre('save', async function (next) {
  if (!this.rmaNumber) {
    const count = await mongoose.model('Return').countDocuments();
    this.rmaNumber = `RMA-${Date.now().toString().slice(-6)}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

returnSchema.virtual('totalAmount').get(function () {
  return (this.items || []).reduce((sum, item) => sum + (item.total || 0), 0);
});

returnSchema.set('toJSON', { virtuals: true });
returnSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Return', returnSchema);
