const mongoose = require('mongoose');

// ── Mobile App Page Builder ──────────────────────────────────────────
// Deliberately separate from HomePageConfig (singleton, flat per-type
// schema) and PageTemplate (website's Craft.js-based builder). AppPage is
// a list of independent pages, each with its own draft/published lifecycle,
// natively rendered in the mobile app (no WebView).
//
// blockType is an open string (not an enum) and props is Mixed rather than
// a flat per-type field schema: this builder is explicitly open-ended (many
// element types, growing over time), and a schema migration for every new
// style field on an existing element would be the wrong trade-off. Both the
// admin UI and mobile renderer already treat blocks as loose JS objects
// regardless — default-filling happens in application code (BLOCK_DEFAULTS),
// not at the schema level.
const appPageBlockSchema = new mongoose.Schema({
  blockType: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  props: { type: mongoose.Schema.Types.Mixed, default: {} }, // content + style
  children: [{ type: mongoose.Schema.Types.Mixed, default: [] }], // one level, row-columns only
}, { _id: true });

const appPageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  blocks: [appPageBlockSchema],
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

appPageSchema.index({ status: 1, slug: 1 });

module.exports = mongoose.model('AppPage', appPageSchema);
