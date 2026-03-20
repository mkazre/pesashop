const mongoose = require('mongoose');

const shippingEventSchema = new mongoose.Schema({
  waybill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waybill',
    required: true,
    index: true
  },
  
  eventType: {
    type: String,
    enum: [
      'CREATED',
      'STATUS_CHANGE',
      'PHOTO_UPLOADED',
      'SCAN_OUT',
      'SCAN_IN',
      'POD_CAPTURED',
      'NOTE_ADDED',
      'CANCELLED'
    ],
    required: true
  },
  
  description: {
    type: String,
    required: true
  },
  
  // Status at the time of event
  status: String,
  
  // Location information
  location: {
    type: {
      type: String,
      enum: ['HUB', 'DELIVERY_ADDRESS', 'OTHER']
    },
    name: String,
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // User who performed the action
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Scan data
  scanData: {
    scanType: {
      type: String,
      enum: ['SCAN_OUT', 'SCAN_IN']
    },
    destination: String,
    deviceInfo: {
      userAgent: String,
      platform: String,
      isMobile: Boolean
    }
  },
  
  // Photo data
  photoData: {
    orderItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order.items'
    },
    photoUrls: [String],
    caption: String
  },
  
  // POD data reference
  podReference: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProofOfDelivery'
  },
  
  // Additional metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // IP and device info
  ipAddress: String,
  userAgent: String
  
}, {
  timestamps: true
});

// Indexes
shippingEventSchema.index({ waybill: 1, createdAt: -1 });
shippingEventSchema.index({ eventType: 1, createdAt: -1 });
shippingEventSchema.index({ performedBy: 1, createdAt: -1 });

// Ensure scan-in only happens after scan-out
shippingEventSchema.pre('save', async function(next) {
  if (this.isNew && this.eventType === 'SCAN_IN') {
    const scanOutExists = await this.constructor.findOne({
      waybill: this.waybill,
      eventType: 'SCAN_OUT'
    });
    
    if (!scanOutExists) {
      return next(new Error('Cannot scan-in before scan-out'));
    }
  }
  next();
});

module.exports = mongoose.model('ShippingEvent', shippingEventSchema);
