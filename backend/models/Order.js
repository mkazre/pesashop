const mongoose = require('mongoose');
const { ORDER_STATUS, PAYMENT_STATUS, ADDRESS_TYPES } = require('../config/constants');

const addressSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  company: String,
  street: String,
  street2: String,
  city: String,
  state: String,
  country: String,
  postalCode: String,
  phone: String,
  email: String
});

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true },
  sku: String,
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true
  },
  salePrice: Number,
  total: {
    type: Number,
    required: true
  },
  image: String,
  variation: mongoose.Schema.Types.Mixed,
  metadata: mongoose.Schema.Types.Mixed,
  // Per-item laybye tracking
  isLaybye: {
    type: Boolean,
    default: false
  },
  laybyePlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LaybyPlan'
  },
  laybyeDeposit: Number,
  laybyeInstallment: Number
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true
  },
  
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Anonymous browsing session that led to this order (pesa_sid from sessionStorage).
  // Lets analytics join pre-login SiteEvents (search, add_to_cart) to this order even
  // though those earlier events may have no userId attached.
  sessionId: {
    type: String,
    index: true
  },

  // UTM attribution (Social Auto-Poster Phase 12, Spec 12.4) — captured
  // client-side from the URL on landing and carried through checkout, same
  // sessionStorage pass-through pattern as sessionId above. Entirely
  // optional; absent for the vast majority of orders that don't originate
  // from a tagged auto-post link.
  attribution: {
    utmSource: String,
    utmMedium: String,
    utmCampaign: String
  },

  // Order Items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  shipping: {
    type: Number,
    default: 0
  },
  shippingMethod: String,
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  
  // Currency
  currency: {
    type: String,
    default: 'ZAR'
  },
  exchangeRate: {
    type: Number,
    default: 1
  },
  
  // Addresses
  billingAddress: addressSchema,
  shippingAddress: addressSchema,
  
  // Payment
  paymentMethod: {
    type: String,
    required: true
  },
  paymentMethodTitle: String,
  paymentStatus: {
    type: String,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  transactionId: String,
  paymentDetails: mongoose.Schema.Types.Mixed,
  
  // Fulfillment
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },
  statusHistory: [{
    status: String,
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Shipping
  trackingNumber: String,
  trackingUrl: String,
  shippedAt: Date,
  deliveredAt: Date,
  
  // Waybill reference
  waybill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waybill'
  },
  
  // Laybye (supports multiple laybyes per order)
  hasLaybye: {
    type: Boolean,
    default: false
  },
  laybyes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laybye'
  }],
  // Legacy single laybye reference (backward compat)
  isLaybye: {
    type: Boolean,
    default: false
  },
  laybye: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Laybye'
  },
  
  // Split Payments
  payments: [{
    method: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    paidAt: Date
  }],
  dueNow: Number,
  
  // Delivery
  deliveryMethod: {
    type: String,
    enum: ['delivery', 'pickup'],
    default: 'delivery'
  },
  pickupAddress: {
    label: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  
  // Loyalty
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsUsed: {
    type: Number,
    default: 0
  },
  // Rand value of the PESA Coins redemption above — kept separate from
  // loyaltyPointsUsed (a raw coin count) so displays/emails don't have to
  // reverse-engineer it out of the combined `discount` field.
  loyaltyDiscount: {
    type: Number,
    default: 0
  },
  
  // Coupons
  couponsApplied: [{
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    code: String,
    discount: Number,
    type: String
  }],
  
  // Gift Cards
  giftCardsApplied: [{
    giftCard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GiftCard'
    },
    code: String,
    amount: Number
  }],
  
  // Notes
  customerNote: String,
  adminNote: String,
  notes: [{
    content: String,
    isCustomerNotified: Boolean,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // IP and User Agent
  customerIp: String,
  userAgent: String,

  // Review reminder tracking — prevents the daily cron from re-sending
  // a reminder for a product it already nudged the customer about.
  reviewReminderSentProducts: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    sentAt: { type: Date, default: Date.now }
  }],

  // Metadata
  metadata: mongoose.Schema.Types.Mixed

}, {
  timestamps: true
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ customer: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'items.product': 1 });

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(5, '0')}`;
  }
  next();
});

// Method to add status history
orderSchema.methods.addStatusHistory = function(status, note, userId) {
  this.statusHistory.push({
    status,
    note,
    updatedBy: userId,
    timestamp: new Date()
  });
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function() {
  this.subtotal = this.items.reduce((sum, item) => sum + item.total, 0);
  this.total = this.subtotal + this.tax + this.shipping - this.discount;
};

// Virtual for formatted order number
orderSchema.virtual('formattedOrderNumber').get(function() {
  return `#${this.orderNumber}`;
});

module.exports = mongoose.model('Order', orderSchema);
