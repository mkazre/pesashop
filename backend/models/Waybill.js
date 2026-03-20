const mongoose = require('mongoose');

const waybillSchema = new mongoose.Schema({
  waybillNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    index: true
  },
  
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Shipping type
  shippingType: {
    type: String,
    enum: ['DELIVERY', 'HUB_COLLECTION'],
    required: true
  },
  
  // Hub details for collection
  hubLocation: {
    name: String,
    address: String,
    city: String,
    state: String,
    postalCode: String,
    phone: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Current status
  status: {
    type: String,
    enum: [
      'CREATED',
      'PACKED',
      'DISPATCHED_FROM_HUB',
      'OUT_FOR_DELIVERY',
      'RECEIVED_AT_HUB',
      'WITH_DELIVERY_DRIVER',
      'DELIVERED',
      'COLLECTED',
      'CANCELLED'
    ],
    default: 'CREATED',
    index: true
  },
  
  // Barcode data
  barcodeData: {
    type: String,
    required: true
  },
  
  // Staff who created the waybill
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Timestamps for key events
  packedAt: Date,
  dispatchedAt: Date,
  receivedAt: Date,
  deliveredAt: Date,
  collectedAt: Date,
  
  // Notes
  notes: String,
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed
  
}, {
  timestamps: true
});

// Generate unique waybill number
waybillSchema.statics.generateWaybillNumber = async function() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  // Find the count of waybills created today
  const startOfDay = new Date(date.setHours(0, 0, 0, 0));
  const endOfDay = new Date(date.setHours(23, 59, 59, 999));
  
  const count = await this.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  const sequence = String(count + 1).padStart(4, '0');
  return `WB-${year}${month}${day}-${sequence}`;
};

// Generate barcode data
waybillSchema.methods.generateBarcodeData = function() {
  // Using CODE128 format data
  return this.waybillNumber;
};

// Update status with validation
waybillSchema.methods.updateStatus = async function(newStatus, userId) {
  const validTransitions = {
    'CREATED': ['PACKED', 'CANCELLED'],
    'PACKED': ['DISPATCHED_FROM_HUB', 'OUT_FOR_DELIVERY', 'CANCELLED'],
    'DISPATCHED_FROM_HUB': ['OUT_FOR_DELIVERY', 'RECEIVED_AT_HUB'],
    'OUT_FOR_DELIVERY': ['DELIVERED', 'CANCELLED'],
    'RECEIVED_AT_HUB': ['WITH_DELIVERY_DRIVER', 'COLLECTED'],
    'WITH_DELIVERY_DRIVER': ['DELIVERED', 'CANCELLED'],
    'DELIVERED': [],
    'COLLECTED': [],
    'CANCELLED': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Invalid status transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  // Update timestamps
  switch (newStatus) {
    case 'PACKED':
      this.packedAt = new Date();
      break;
    case 'DISPATCHED_FROM_HUB':
    case 'OUT_FOR_DELIVERY':
      this.dispatchedAt = new Date();
      break;
    case 'RECEIVED_AT_HUB':
      this.receivedAt = new Date();
      break;
    case 'DELIVERED':
      this.deliveredAt = new Date();
      break;
    case 'COLLECTED':
      this.collectedAt = new Date();
      break;
  }
  
  // Create shipping event
  const ShippingEvent = mongoose.model('ShippingEvent');
  await ShippingEvent.create({
    waybill: this._id,
    eventType: 'STATUS_CHANGE',
    description: `Status changed to ${newStatus}`,
    status: newStatus,
    performedBy: userId,
    metadata: { previousStatus: this.status }
  });
  
  return this.save();
};

// Indexes
waybillSchema.index({ createdAt: -1 });
waybillSchema.index({ order: 1, status: 1 });
waybillSchema.index({ customer: 1, createdAt: -1 });

module.exports = mongoose.model('Waybill', waybillSchema);
