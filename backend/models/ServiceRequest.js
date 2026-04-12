const mongoose = require('mongoose');

const serviceRequestSchema = new mongoose.Schema({
  // Can be a logged-in customer or a guest
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  // Contact info (pre-filled from account or entered manually)
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, lowercase: true, trim: true },
  phone:     { type: String, default: '' },

  // Service details
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: true,
  },
  serviceModes: [{   // repair | install | maintain
    type: String,
    enum: ['repair', 'install', 'maintain'],
  }],
  description: { type: String, default: '' },  // customer notes

  // Location
  address:  { type: String, default: '' },
  suburb:   { type: String, default: '' },
  city:     { type: String, default: '' },
  province: { type: String, default: '' },

  // Optional product link (from widget on product page / checkout)
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null,
  },
  productName: { type: String, default: '' },  // denormalised

  // Admin management
  status: {
    type: String,
    enum: ['new', 'in_review', 'assigned', 'scheduled', 'completed', 'cancelled'],
    default: 'new',
  },
  assignedProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceProvider',
    default: null,
  },
  adminNotes: { type: String, default: '' },
  scheduledDate: { type: Date, default: null },
  completedDate: { type: Date, default: null },

}, { timestamps: true });

module.exports = mongoose.model('ServiceRequest', serviceRequestSchema);
