const mongoose = require('mongoose');
const { LAYBYE_FREQUENCY } = require('../config/constants');

const laybyPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Plan Configuration
  depositPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 20
  },
  depositAmount: {
    type: Number,
    min: 0,
    default: 0 // If set, overrides percentage
  },
  
  // Payment Schedule
  numberOfPayments: {
    type: Number,
    required: true,
    min: 1,
    max: 52,
    default: 4
  },
  frequency: {
    type: String,
    enum: Object.values(LAYBYE_FREQUENCY),
    required: true,
    default: LAYBYE_FREQUENCY.MONTHLY
  },
  
  // Eligibility
  minimumProductValue: {
    type: Number,
    min: 0,
    default: 0 // 0 means no minimum
  },
  maximumProductValue: {
    type: Number,
    min: 0,
    default: 0 // 0 means no maximum
  },
  
  // Product/Category Restrictions
  allowedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  allowedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  excludedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  
  // Customer Restrictions
  allowedCustomerGroups: [String],
  excludedCustomerGroups: [String],
  
  // Expiry and Duration
  expiryDays: {
    type: Number,
    min: 0,
    default: 0 // 0 means no expiry
  },
  holdFunds: {
    type: Boolean,
    default: false // Whether to hold funds until completion
  },
  
  // Cancellation Policy
  allowCancellation: {
    type: Boolean,
    default: true
  },
  keepDepositOnCancellation: {
    type: Boolean,
    default: false
  },
  cancellationFee: {
    type: Number,
    min: 0,
    default: 0
  },
  cancellationFeePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  
  // Late Payment Policy
  allowLatePayments: {
    type: Boolean,
    default: true
  },
  latePaymentFee: {
    type: Number,
    min: 0,
    default: 0
  },
  latePaymentFeePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  maxMissedPayments: {
    type: Number,
    min: 0,
    default: 3 // Auto-cancel after X missed payments
  },
  
  // Email Reminders
  emailReminders: {
    enabled: {
      type: Boolean,
      default: true
    },
    daysBefore: [{
      type: Number,
      min: 0,
      max: 30
    }], // e.g., [7, 3, 1] means reminders 7, 3, and 1 day before
    overdueReminderInterval: {
      type: Number,
      min: 0,
      default: 7 // Days between overdue reminders
    }
  },
  
  // Interest / Fees
  interestRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0 // Annual interest rate percentage (0 = no interest)
  },
  interestType: {
    type: String,
    enum: ['none', 'simple', 'compound'],
    default: 'none'
  },
  
  // Variable Installments
  allowVariableInstallments: {
    type: Boolean,
    default: false // If true, customer can pay any amount >= minimum
  },
  minimumInstallmentAmount: {
    type: Number,
    min: 0,
    default: 0 // 0 = use calculated installment as minimum
  },
  
  // Force Deposit / Plan Options
  forceDeposit: {
    type: Boolean,
    default: false // If true, deposit is mandatory before plan starts
  },
  allowUserDefinedDeposit: {
    type: Boolean,
    default: false // If true, customer can choose deposit amount (above minimum)
  },
  minimumDepositPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0 // Minimum deposit % if user-defined
  },
  
  // Product-level assignment
  assignedToAllProducts: {
    type: Boolean,
    default: true // If false, only assigned products can use this plan
  },
  
  // Payment Gateway Restrictions
  allowedPaymentGateways: [{
    type: String // e.g., 'payfast', 'stripe', 'manual', 'eft'
  }],
  
  // Tax Handling
  taxInclusive: {
    type: Boolean,
    default: true // Whether plan amounts include tax
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // Metadata
  usageCount: {
    type: Number,
    default: 0
  },
  
}, {
  timestamps: true
});

// Indexes
laybyPlanSchema.index({ isActive: 1 });
laybyPlanSchema.index({ displayOrder: 1 });
laybyPlanSchema.index({ minimumProductValue: 1 });

// Method to check if product is eligible
laybyPlanSchema.methods.isProductEligible = function(product, customerGroup = 'retail') {
  // Check minimum/maximum value
  const productPrice = product.salePrice || product.regularPrice;
  if (this.minimumProductValue > 0 && productPrice < this.minimumProductValue) {
    return { eligible: false, reason: `Product value (R ${productPrice}) is below minimum (R ${this.minimumProductValue})` };
  }
  if (this.maximumProductValue > 0 && productPrice > this.maximumProductValue) {
    return { eligible: false, reason: `Product value (R ${productPrice}) exceeds maximum (R ${this.maximumProductValue})` };
  }
  
  // If plan is NOT assigned to all products, it must have explicit allowedProducts
  if (this.assignedToAllProducts === false) {
    if (this.allowedProducts.length === 0) {
      return { eligible: false, reason: 'Plan is not assigned to any products' };
    }
    if (!this.allowedProducts.some(id => id.toString() === product._id.toString())) {
      return { eligible: false, reason: 'Product is not assigned to this plan' };
    }
  }
  
  // Check product restrictions
  if (this.excludedProducts.length > 0 && this.excludedProducts.some(id => id.toString() === product._id.toString())) {
    return { eligible: false, reason: 'Product is excluded from this plan' };
  }
  if (this.assignedToAllProducts !== false && this.allowedProducts.length > 0 && !this.allowedProducts.some(id => id.toString() === product._id.toString())) {
    return { eligible: false, reason: 'Product is not allowed for this plan' };
  }
  
  // Check category restrictions
  if (product.categories && product.categories.length > 0) {
    const productCategoryIds = product.categories.map(c => c._id ? c._id.toString() : c.toString());
    if (this.excludedCategories.length > 0 && this.excludedCategories.some(id => productCategoryIds.includes(id.toString()))) {
      return { eligible: false, reason: 'Product category is excluded from this plan' };
    }
    if (this.allowedCategories.length > 0 && !this.allowedCategories.some(id => productCategoryIds.includes(id.toString()))) {
      return { eligible: false, reason: 'Product category is not allowed for this plan' };
    }
  }
  
  // Check customer group restrictions
  if (this.excludedCustomerGroups.length > 0 && this.excludedCustomerGroups.includes(customerGroup)) {
    return { eligible: false, reason: 'Customer group is excluded from this plan' };
  }
  if (this.allowedCustomerGroups.length > 0 && !this.allowedCustomerGroups.includes(customerGroup)) {
    return { eligible: false, reason: 'Customer group is not allowed for this plan' };
  }
  
  return { eligible: true };
};

// Method to calculate deposit amount
laybyPlanSchema.methods.calculateDeposit = function(totalAmount) {
  if (this.depositAmount > 0) {
    return Math.min(this.depositAmount, totalAmount);
  }
  return (totalAmount * this.depositPercentage) / 100;
};

// Method to calculate installment amount (with interest support)
laybyPlanSchema.methods.calculateInstallmentAmount = function(totalAmount) {
  const deposit = this.calculateDeposit(totalAmount);
  let remaining = totalAmount - deposit;
  
  // Apply interest if configured
  if (this.interestRate > 0 && this.interestType !== 'none') {
    const annualRate = this.interestRate / 100;
    const periodsPerYear = this.frequency === 'weekly' ? 52 : this.frequency === 'biweekly' ? 26 : 12;
    const periodRate = annualRate / periodsPerYear;
    
    if (this.interestType === 'simple') {
      // Simple interest: total interest = principal * rate * periods / periodsPerYear
      const totalInterest = remaining * annualRate * (this.numberOfPayments / periodsPerYear);
      remaining += totalInterest;
    } else if (this.interestType === 'compound') {
      // Compound interest: A = P * (1 + r)^n
      remaining = remaining * Math.pow(1 + periodRate, this.numberOfPayments);
    }
  }
  
  return remaining / this.numberOfPayments;
};

// Method to calculate total with interest
laybyPlanSchema.methods.calculateTotalWithInterest = function(totalAmount) {
  const deposit = this.calculateDeposit(totalAmount);
  const installment = this.calculateInstallmentAmount(totalAmount);
  return deposit + (installment * this.numberOfPayments);
};

module.exports = mongoose.model('LaybyPlan', laybyPlanSchema);
