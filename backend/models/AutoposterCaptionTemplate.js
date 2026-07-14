const mongoose = require('mongoose');
const { AUTOPOSTER_PLATFORMS } = require('../config/constants');

// Reusable Handlebars-style caption template (Spec Section 9.3). platform is
// optional — null/undefined means the template is generic and usable across
// any platform; set means it's tailored to that platform's style.
const autoposterCaptionTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  platform: { type: String, enum: Object.values(AUTOPOSTER_PLATFORMS), default: null },
  // Handlebars source, e.g. "New drop {{product_name}} — now {{product_price}}\n{{hashtags}}"
  content: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('AutoposterCaptionTemplate', autoposterCaptionTemplateSchema);
