const mongoose = require('mongoose');

const deliveryInstanceSchema = new mongoose.Schema({
  scheduledDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['scheduled', 'processing', 'delivered', 'failed', 'skipped'],
    default: 'scheduled'
  },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'waived'],
    default: 'pending'
  },
  paymentDate: Date,
  paymentReference: String,
  notes: String
}, { _id: true, timestamps: false });

const recurringOrderSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Snapshot of product name/sku at time of creation
  productName: String,
  productSku: String,
  // Variant selected (if applicable)
  variant: { type: mongoose.Schema.Types.Mixed },

  recurringPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecurringPlan'
  },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly'],
    required: true
  },
  intervalDays: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true },

  paymentMode: {
    type: String,
    enum: ['upfront', 'pay_as_you_go'],
    required: true
  },

  // Upfront mode fields
  totalInstances: { type: Number }, // total deliveries pre-paid
  totalAmountPaid: { type: Number, default: 0 }, // full upfront payment

  // Pay-as-you-go fields
  totalPaidToDate: { type: Number, default: 0 },

  // Delivery tracking
  completedInstances: { type: Number, default: 0 },
  remainingInstances: { type: Number }, // only relevant for upfront mode
  deliveries: [deliveryInstanceSchema],

  // Schedule
  startDate: { type: Date, default: Date.now },
  nextDeliveryDate: { type: Date },
  nextPaymentDate: { type: Date }, // PAYG only

  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled', 'completed'],
    default: 'active'
  },
  pausedAt: Date,
  pauseReason: String,
  cancelledAt: Date,
  cancellationReason: String,
  completedAt: Date,

  // Shipping address snapshot
  shippingAddress: { type: mongoose.Schema.Types.Mixed },

  notes: String,

  // Reminders sent tracking
  lastReminderSentAt: Date
}, {
  timestamps: true
});

recurringOrderSchema.index({ customer: 1, status: 1 });
recurringOrderSchema.index({ nextDeliveryDate: 1, status: 1 });
recurringOrderSchema.index({ nextPaymentDate: 1, status: 1 });
recurringOrderSchema.index({ product: 1 });

module.exports = mongoose.model('RecurringOrder', recurringOrderSchema);
