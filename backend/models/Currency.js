const mongoose = require('mongoose');

const currencySchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  name: {
    type: String,
    required: true
  },
  symbol: {
    type: String,
    required: true
  },
  
  // Exchange rate TO ZAR (1 unit of this currency = X ZAR)
  exchangeRate: {
    type: Number,
    required: true,
    default: 1
  },
  
  // Format settings
  decimalDigits: {
    type: Number,
    default: 2
  },
  symbolPosition: {
    type: String,
    enum: ['before', 'after'],
    default: 'before'
  },
  decimalSeparator: {
    type: String,
    default: '.'
  },
  thousandSeparator: {
    type: String,
    default: ','
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBaseCurrency: {
    type: Boolean,
    default: false
  },
  showInFrontend: {
    type: Boolean,
    default: true
  },
  
  // Update tracking
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  lastUpdateError: String
  
}, {
  timestamps: true
});

// Indexes
currencySchema.index({ code: 1 });
currencySchema.index({ isActive: 1 });

// Method to format amount
currencySchema.methods.formatAmount = function(amount) {
  const formattedNumber = amount.toFixed(this.decimalDigits)
    .replace('.', this.decimalSeparator)
    .replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandSeparator);
  
  if (this.symbolPosition === 'before') {
    return `${this.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber}${this.symbol}`;
  }
};

// Method to convert amount from ZAR
currencySchema.methods.convertFromZAR = function(amountInZAR) {
  return amountInZAR / this.exchangeRate;
};

// Method to convert amount to ZAR
currencySchema.methods.convertToZAR = function(amount) {
  return amount * this.exchangeRate;
};

// Static method to get active currencies
currencySchema.statics.getActive = function() {
  return this.find({ isActive: true }).sort({ code: 1 });
};

// Static method to get currencies visible in frontend
currencySchema.statics.getFrontendCurrencies = function() {
  return this.find({ isActive: true, showInFrontend: true }).sort({ code: 1 });
};

// Static method to get base currency
currencySchema.statics.getBase = async function() {
  const base = await this.findOne({ isBaseCurrency: true });
  if (!base) {
    // Fallback to ZAR if no base currency is set
    return this.findOne({ code: 'ZAR' });
  }
  return base;
};

// Static method to convert between currencies
currencySchema.statics.convert = async function(amount, fromCode, toCode) {
  if (fromCode === toCode) return amount;
  
  const fromCurrency = await this.findOne({ code: fromCode, isActive: true });
  const toCurrency = await this.findOne({ code: toCode, isActive: true });
  
  if (!fromCurrency || !toCurrency) {
    throw new Error('Currency not found or inactive');
  }
  
  // Convert to ZAR first, then to target currency
  const amountInZAR = fromCurrency.convertToZAR(amount);
  return toCurrency.convertFromZAR(amountInZAR);
};

module.exports = mongoose.model('Currency', currencySchema);
