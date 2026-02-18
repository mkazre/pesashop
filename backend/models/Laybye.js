const mongoose = require('mongoose');
const { LAYBYE_STATUS, LAYBYE_FREQUENCY } = require('../config/constants');

const paymentSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true
  },
  scheduledDate: Date,
  paymentDate: Date,
  paymentMethod: String,
  transactionId: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending'
  },
  note: String
}, {
  timestamps: true
});

const laybyeSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  laybyPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LaybyPlan',
    required: true
  },
  
  // Plan Details
  totalAmount: {
    type: Number,
    required: true
  },
  depositAmount: {
    type: Number,
    required: true
  },
  remainingAmount: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  
  // Installment Plan
  installmentPlan: {
    frequency: {
      type: String,
      enum: Object.values(LAYBYE_FREQUENCY),
      required: true
    },
    numberOfPayments: {
      type: Number,
      required: true,
      min: 1
    },
    installmentAmount: {
      type: Number,
      required: true
    }
  },
  
  // Expiry
  expiryDate: Date,
  isExpired: {
    type: Boolean,
    default: false
  },
  
  // Hold Funds
  holdFunds: {
    type: Boolean,
    default: false
  },
  fundsHeld: {
    type: Number,
    default: 0
  },
  
  // Payments
  payments: [paymentSchema],
  
  // Dates
  startDate: {
    type: Date,
    default: Date.now
  },
  nextPaymentDate: Date,
  completedDate: Date,
  cancelledDate: Date,
  
  // Status
  status: {
    type: String,
    enum: Object.values(LAYBYE_STATUS),
    default: LAYBYE_STATUS.ACTIVE
  },
  
  // Late payments tracking
  missedPayments: {
    type: Number,
    default: 0
  },
  latePaymentFees: {
    type: Number,
    default: 0
  },
  
  // Cancellation
  cancellationReason: String,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refundAmount: Number,
  keepDeposit: {
    type: Boolean,
    default: false
  },
  cancellationFee: {
    type: Number,
    default: 0
  },
  refundProcessed: {
    type: Boolean,
    default: false
  },
  refundProcessedDate: Date,
  
  // Notifications
  remindersSent: [{
    date: Date,
    type: String, // 'upcoming', 'overdue', 'expiry'
    sent: {
      type: Boolean,
      default: false
    }
  }],
  lastReminderSent: Date,
  
  // Notes
  notes: String,
  adminNotes: String,
  
}, {
  timestamps: true
});

// Indexes
laybyeSchema.index({ order: 1 });
laybyeSchema.index({ customer: 1 });
laybyeSchema.index({ status: 1 });
laybyeSchema.index({ nextPaymentDate: 1 });

// Method to record payment
laybyeSchema.methods.recordPayment = async function(paymentData) {
  const payment = {
    amount: paymentData.amount,
    paymentDate: new Date(),
    paymentMethod: paymentData.method,
    transactionId: paymentData.transactionId,
    status: 'completed'
  };
  
  this.payments.push(payment);
  this.paidAmount += paymentData.amount;
  this.remainingAmount = Math.max(0, this.remainingAmount - paymentData.amount);
  
  // Check if fully paid
  if (this.remainingAmount === 0) {
    this.status = LAYBYE_STATUS.COMPLETED;
    this.completedDate = new Date();
  } else {
    // Calculate next payment date
    this.calculateNextPaymentDate();
  }
  
  await this.save();
  return this;
};

// Method to calculate next payment date
laybyeSchema.methods.calculateNextPaymentDate = function() {
  const lastPayment = this.payments[this.payments.length - 1];
  const baseDate = lastPayment ? new Date(lastPayment.paymentDate) : this.startDate;
  
  const nextDate = new Date(baseDate);
  
  switch (this.installmentPlan.frequency) {
    case LAYBYE_FREQUENCY.WEEKLY:
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case LAYBYE_FREQUENCY.BIWEEKLY:
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case LAYBYE_FREQUENCY.MONTHLY:
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  this.nextPaymentDate = nextDate;
};

// Method to check if payment is overdue
laybyeSchema.methods.isOverdue = function() {
  if (this.status !== LAYBYE_STATUS.ACTIVE) return false;
  
  const now = new Date();
  return this.nextPaymentDate && now > this.nextPaymentDate;
};

// Method to cancel laybye
laybyeSchema.methods.cancel = async function(reason, refundAmount, keepDeposit, cancelledBy) {
  this.status = LAYBYE_STATUS.CANCELLED;
  this.cancelledDate = new Date();
  this.cancellationReason = reason;
  this.keepDeposit = keepDeposit || false;
  this.cancelledBy = cancelledBy;
  
  // Calculate refund amount
  if (keepDeposit) {
    this.refundAmount = (refundAmount || this.paidAmount) - this.depositAmount;
  } else {
    this.refundAmount = refundAmount || this.paidAmount;
  }
  
  await this.save();
  return this;
};

// Method to check if expired
laybyeSchema.methods.checkExpiry = async function() {
  if (this.expiryDate && new Date() > this.expiryDate && this.status === LAYBYE_STATUS.ACTIVE) {
    this.isExpired = true;
    this.status = LAYBYE_STATUS.DEFAULTED;
    await this.save();
    return true;
  }
  return false;
};

// Method to mark payment as missed
laybyeSchema.methods.markMissedPayment = async function() {
  this.missedPayments += 1;
  
  // Check if exceeded max missed payments
  const LaybyPlan = mongoose.model('LaybyPlan');
  const plan = await LaybyPlan.findById(this.laybyPlan);
  if (plan && plan.maxMissedPayments > 0 && this.missedPayments >= plan.maxMissedPayments) {
    this.status = LAYBYE_STATUS.DEFAULTED;
  }
  
  await this.save();
  return this;
};

// Static method to get upcoming payments
laybyeSchema.statics.getUpcomingPayments = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.find({
    status: LAYBYE_STATUS.ACTIVE,
    nextPaymentDate: {
      $gte: new Date(),
      $lte: futureDate
    }
  }).populate('customer order');
};

// Static method to get overdue payments
laybyeSchema.statics.getOverduePayments = function() {
  return this.find({
    status: LAYBYE_STATUS.ACTIVE,
    nextPaymentDate: { $lt: new Date() }
  }).populate('customer order');
};

module.exports = mongoose.model('Laybye', laybyeSchema);
