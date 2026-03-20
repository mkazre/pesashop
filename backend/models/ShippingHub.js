const mongoose = require('mongoose');

const shippingHubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  code: {
    type: String,
    unique: true,
    uppercase: true
  },
  
  type: {
    type: String,
    enum: ['MAIN', 'LOCAL', 'COLLECTION_POINT'],
    default: 'LOCAL'
  },
  
  address: {
    street: String,
    street2: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  contact: {
    phone: String,
    email: String,
    manager: String
  },
  
  operatingHours: {
    monday: { open: String, close: String },
    tuesday: { open: String, close: String },
    wednesday: { open: String, close: String },
    thursday: { open: String, close: String },
    friday: { open: String, close: String },
    saturday: { open: String, close: String },
    sunday: { open: String, close: String }
  },
  
  coordinates: {
    lat: Number,
    lng: Number
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  capacity: {
    maxDailyPackages: Number,
    currentPackages: Number
  },
  
  servicesOffered: [{
    type: String,
    enum: ['COLLECTION', 'DELIVERY', 'RETURNS', 'LAYBYE_PICKUP']
  }],
  
  metadata: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true
});

// Generate hub code
shippingHubSchema.pre('save', function(next) {
  if ((!this.code || this.code.trim() === '') && this.name) {
    // Generate code from name
    this.code = this.name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .substring(0, 6);
  }
  next();
});

// Indexes
shippingHubSchema.index({ code: 1 });
shippingHubSchema.index({ isActive: 1 });
shippingHubSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('ShippingHub', shippingHubSchema);
