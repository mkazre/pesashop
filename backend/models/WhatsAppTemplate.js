const mongoose = require('mongoose');

const whatsappTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  metaTemplateName: { type: String, required: true, unique: true, trim: true },
  language: { type: String, default: 'en' },
  category: { type: String, enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'], default: 'UTILITY' },
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },

  triggerEvent: {
    type: String,
    enum: ['order_confirmed', 'order_shipped', 'order_delivered', 'layby_reminder', 'recurring_renewal', 'abandoned_cart', 'otp', 'broadcast', 'manual', 'welcome'],
    default: 'manual',
    index: true
  },

  bodyTemplate: { type: String, required: true },
  variableNames: [String],
  exampleVariables: [String],

  isActive: { type: Boolean, default: true },

  stats: {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  }
}, { timestamps: true });

whatsappTemplateSchema.index({ triggerEvent: 1, isActive: 1, status: 1 });

module.exports = mongoose.model('WhatsAppTemplate', whatsappTemplateSchema);
