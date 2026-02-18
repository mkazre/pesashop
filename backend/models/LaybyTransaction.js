const mongoose = require('mongoose');

const laybyTransactionSchema = new mongoose.Schema({
  // Reference to the laybye
  laybye: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laybye',
    required: true
  },

  // Customer
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Transaction type
  type: {
    type: String,
    enum: [
      'deposit',           // Initial deposit payment
      'installment',       // Regular installment payment
      'late_fee',          // Late payment fee charged
      'cancellation_fee',  // Cancellation fee charged
      'refund',            // Refund issued
      'adjustment',        // Manual adjustment by admin
      'write_off'          // Written off / forgiven
    ],
    required: true
  },

  // Amount (positive = payment received, negative = refund/credit)
  amount: {
    type: Number,
    required: true
  },

  // Payment details
  paymentMethod: {
    type: String,
    default: 'manual'
  },
  transactionId: String,

  // Related order
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },

  // Balances at time of transaction
  balanceBefore: {
    type: Number,
    default: 0
  },
  balanceAfter: {
    type: Number,
    default: 0
  },

  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'failed', 'reversed'],
    default: 'completed'
  },

  // Notes
  note: String,

  // Who recorded this
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Source: admin manual entry, cron auto-charge, customer self-service
  source: {
    type: String,
    enum: ['admin', 'system', 'customer', 'cron'],
    default: 'admin'
  }
}, {
  timestamps: true
});

// Indexes
laybyTransactionSchema.index({ laybye: 1, createdAt: -1 });
laybyTransactionSchema.index({ customer: 1, createdAt: -1 });
laybyTransactionSchema.index({ type: 1 });
laybyTransactionSchema.index({ createdAt: -1 });
laybyTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('LaybyTransaction', laybyTransactionSchema);
