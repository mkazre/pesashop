const mongoose = require('mongoose');

// Saved Visual Post Designer canvases (Spec Section 7.5). Full layer tree is
// persisted so a design can always be re-opened and edited; rendered output is
// a Cloudinary URL (Spec Section 7.8, reusing the existing uploadToCloudinary
// helper from config/cloudinary.js — no new upload path needed).
const autoposterDesignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,

  canvasPreset: String, // e.g. 'instagram_feed_square'
  canvasWidth: Number,
  canvasHeight: Number,
  layers: mongoose.Schema.Types.Mixed, // full layer tree

  thumbnailUrl: String, // generated on save
  linkedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  tags: [String],
  templateFlag: { type: Boolean, default: false, index: true },

  // Bulk variant generation (Spec Section 7.7) links each generated variant
  // back to the base design it was rendered from.
  parentDesignId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterDesign', default: null },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('AutoposterDesign', autoposterDesignSchema);
