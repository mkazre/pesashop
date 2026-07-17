const mongoose = require('mongoose');

// ── Mobile App Form Builder ──────────────────────────────────────────
// Net-new — the website's Page Builder has no form equivalent. Fields use
// an open fieldType string + Mixed options/style, mirroring AppPage's
// approach: the field catalog and per-field style controls live in
// application code (shared engine), not as a Mongoose schema per type.
const formFieldSchema = new mongoose.Schema({
  fieldType: { type: String, required: true }, // text, email, phone, textarea, select, checkbox, radio, date, file, hidden, section-break
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  options: [{ type: String }], // for select/radio/checkbox
  order: { type: Number, default: 0 },
  style: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: true });

const formSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  fields: [formFieldSchema],
  style: { type: mongoose.Schema.Types.Mixed, default: {} }, // form-level styling
  submitButtonText: { type: String, default: 'Submit' },
  successMessage: { type: String, default: 'Thank you! Your submission has been received.' },
  notificationEmail: { type: String, default: '' }, // falls back to Settings.storeEmail if empty
  sendConfirmationToSubmitter: { type: Boolean, default: false },
  confirmationEmailField: { type: String, default: '' }, // field _id of the email field to send the confirmation to
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Form', formSchema);
