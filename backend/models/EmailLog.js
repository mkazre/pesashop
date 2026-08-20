const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema({
  provider: { type: String, enum: ['brevo', 'smtp'], required: true },
  to: { type: String, required: true },
  subject: String,
  success: { type: Boolean, required: true, index: true },
  messageId: String,
  error: String,
  response: mongoose.Schema.Types.Mixed,
}, {
  timestamps: true
});

emailLogSchema.index({ createdAt: -1 });
emailLogSchema.index({ to: 1, createdAt: -1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
