const mongoose = require('mongoose');

// Admin-defined recurring plan templates (mirrors LaybyPlan pattern)
const recurringPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  description: String,
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'fortnightly', 'monthly', 'bimonthly', 'quarterly'],
    required: true
  },
  // Number of days between deliveries (auto-computed from frequency, can be overridden)
  intervalDays: { type: Number },
  minQuantity: { type: Number, default: 1, min: 1 },
  maxQuantity: { type: Number, default: 100 },
  // Payment modes available on this plan
  allowedPaymentModes: {
    type: [{ type: String, enum: ['upfront', 'pay_as_you_go'] }],
    default: ['upfront', 'pay_as_you_go']
  },
  // Eligible product value range
  minProductValue: { type: Number, default: 0 },
  maxProductValue: { type: Number },
  // Upfront mode: min and max delivery instances
  minInstances: { type: Number, default: 2 },
  maxInstances: { type: Number, default: 24 },
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

// Auto-compute intervalDays from frequency
recurringPlanSchema.pre('save', function(next) {
  const map = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30, bimonthly: 60, quarterly: 90 };
  if (!this.intervalDays && this.frequency) {
    this.intervalDays = map[this.frequency] || 30;
  }
  next();
});

recurringPlanSchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('RecurringPlan', recurringPlanSchema);
