const mongoose = require('mongoose');

const proofOfDeliverySchema = new mongoose.Schema({
  waybill: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Waybill',
    required: true,
    unique: true,
    index: true
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Delivery type
  deliveryType: {
    type: String,
    enum: ['DELIVERY', 'HUB_COLLECTION'],
    required: true
  },
  
  // Recipient information
  recipient: {
    name: {
      type: String,
      required: true
    },
    idNumber: String,
    relationship: {
      type: String,
      enum: ['SELF', 'FAMILY', 'FRIEND', 'COLLEAGUE', 'OTHER']
    },
    phone: String
  },
  
  // Signature data
  signature: {
    imageData: {
      type: String,
      required: true
    },
    signedAt: {
      type: Date,
      required: true
    }
  },
  
  // Staff who processed the handover
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Location of delivery/collection
  location: {
    type: {
      type: String,
      enum: ['CUSTOMER_ADDRESS', 'HUB', 'OTHER']
    },
    address: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Pre-shipment photos reference
  preShipmentPhotos: [{
    orderItemId: mongoose.Schema.Types.ObjectId,
    photoUrls: [String],
    uploadedAt: Date,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  
  // POD document URL (generated PDF)
  podDocumentUrl: String,
  
  // Notes
  notes: String,
  
  // Device info
  deviceInfo: {
    userAgent: String,
    platform: String,
    isMobile: Boolean
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true
});

// Generate POD number
proofOfDeliverySchema.methods.generatePODNumber = function() {
  const date = new Date();
  const timestamp = date.getTime();
  return `POD-${this.waybill}-${timestamp}`;
};

// Indexes
proofOfDeliverySchema.index({ order: 1 });
proofOfDeliverySchema.index({ processedBy: 1, createdAt: -1 });
proofOfDeliverySchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProofOfDelivery', proofOfDeliverySchema);
