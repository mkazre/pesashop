const mongoose = require('mongoose');

// The 17 configurable fields from Spec Section 9.5.1, as a reusable sub-schema so
// the base `config` gets real validation instead of an opaque blob. `perPlatform`
// stays a flexible Mixed map (Spec Section 9.5.4 examples: { linkedin: { price: 'hide' },
// x: { currency: 'USD' }, tiktok: { productUrl: 'link_in_bio' } }) since overrides are
// sparse and only ever flip a subset of these same field names.
const autoposterPostProfileConfigSchema = new mongoose.Schema({
  images: {
    type: String,
    enum: ['featured_only', 'featured_plus_gallery', 'all_gallery', 'none'],
    default: 'featured_only'
  },
  galleryCount: { type: Number, default: 0 }, // used when images = 'featured_plus_gallery'

  video: { type: String, enum: ['include', 'exclude'], default: 'exclude' },

  productName: { type: String, enum: ['include', 'exclude', 'abbreviate'], default: 'include' },
  abbreviateLength: { type: Number, default: 40 },

  price: { type: String, enum: ['show', 'hide', 'overlay_only'], default: 'show' },
  currency: { type: String, enum: ['ZWL', 'USD', 'ZAR', 'multi'], default: 'ZAR' },

  discountInfo: { type: String, enum: ['show', 'hide', 'show_if_above_threshold'], default: 'show' },
  discountThreshold: { type: Number, default: 10 }, // percent

  shortDescription: { type: String, enum: ['include', 'exclude', 'truncate'], default: 'include' },
  truncateLength: { type: Number, default: 160 },

  fullDescription: { type: String, enum: ['include', 'exclude'], default: 'exclude' },

  categoryTags: { type: String, enum: ['text', 'hashtags', 'exclude'], default: 'hashtags' },

  stockStatus: { type: String, enum: ['show', 'hide', 'show_if_low'], default: 'hide' },

  productUrl: { type: String, enum: ['full', 'shortened', 'hide', 'link_in_bio'], default: 'shortened' },
  utmTracking: { type: String, enum: ['auto_tag', 'off'], default: 'auto_tag' },

  ratingReviews: { type: String, enum: ['show', 'hide', 'show_if_above_threshold'], default: 'hide' },
  ratingThreshold: { type: Number, default: 4 },

  skuItemCode: { type: String, enum: ['show', 'hide'], default: 'hide' },

  deliveryInfo: { type: String, enum: ['show', 'hide', 'region_aware'], default: 'region_aware' },

  ctaPhrase: {
    type: String,
    enum: ['shop_now', 'order_today', 'send_to_family', 'link_in_bio', 'custom', 'none'],
    default: 'shop_now'
  },
  customCtaText: String,

  brandWatermark: { type: String, enum: ['on', 'off'], default: 'on' },
  watermarkPosition: {
    type: String,
    enum: ['top_left', 'top_right', 'bottom_left', 'bottom_right'],
    default: 'bottom_right'
  }
}, { _id: false });

// Content Configuration Profile (Spec Section 9.5.2). A product references either
// an explicit profile (Product.postProfileId) or falls back to the store-default
// (isDefault: true) profile.
const autoposterPostProfileSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Premium Apparel", "Diaspora Default"
  isDefault: { type: Boolean, default: false, index: true },
  config: { type: autoposterPostProfileConfigSchema, default: () => ({}) },
  perPlatform: mongoose.Schema.Types.Mixed, // sparse per-platform field overrides
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('AutoposterPostProfile', autoposterPostProfileSchema);
