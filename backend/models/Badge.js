const mongoose = require('mongoose');

// ── Condition rule sub-schema ────────────────────────────────────────────────
const conditionSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      // Product-based conditions
      'on_sale',              // Product has a sale price set
      'top_selling',          // Sales count >= threshold
      'new_arrival',          // Created within X days
      'low_stock',            // Stock <= threshold
      'out_of_stock',         // Stock === 0
      'back_in_stock',        // Was out of stock, now has stock
      'price_range',          // Price between min and max
      'high_rated',           // Rating >= threshold
      'most_reviewed',        // Review count >= threshold
      'featured',             // isFeatured === true
      'free_shipping',        // Shipping cost is 0 / qualifies
      'clearance',            // Marked as clearance
      'limited_edition',      // Limited quantity (stock <= threshold & special flag)
      'percentage_off',       // Discount percentage >= threshold
      'bundle_deal',          // Part of a bundle
      'member_only',          // Requires login / customer group
      'pre_order',            // Not yet available
      'seasonal',             // Active during date range

      // Selection-based conditions
      'specific_products',    // Manually selected product IDs
      'specific_categories',  // All products in selected categories
      'specific_tags',        // Products with specific tags
      'specific_brands',      // Products with specific brands

      // Category-level conditions
      'category_sale',        // Entire category is on sale
      'category_featured',    // Featured category

      // Universal
      'static',               // Always show (manual assignment)
      'scheduled',            // Show only during date/time range
      'custom_field',         // Match a custom product field
    ]
  },

  // ── Condition parameters (varies by type) ──
  threshold: Number,            // For top_selling, low_stock, high_rated, most_reviewed, percentage_off
  minValue: Number,             // For price_range
  maxValue: Number,             // For price_range
  days: Number,                 // For new_arrival, back_in_stock (within X days)
  startDate: Date,              // For scheduled, seasonal
  endDate: Date,                // For scheduled, seasonal
  productIds: [{                // For specific_products
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  categoryIds: [{               // For specific_categories, category_sale, category_featured
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  tags: [String],               // For specific_tags
  brands: [String],             // For specific_brands
  customerGroupIds: [{          // For member_only
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerGroup'
  }],
  customFieldKey: String,       // For custom_field
  customFieldValue: String,     // For custom_field
  customFieldOperator: {        // For custom_field
    type: String,
    enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
    default: 'equals'
  },
}, { _id: true });

// ── Badge style sub-schema ───────────────────────────────────────────────────
const badgeStyleSchema = new mongoose.Schema({
  // Badge type
  badgeType: {
    type: String,
    enum: ['text', 'image', 'html'],
    default: 'text'
  },

  // Text badge properties
  text: { type: String, default: 'Sale' },
  textColor: { type: String, default: '#ffffff' },
  backgroundColor: { type: String, default: '#ef4444' },
  fontSize: { type: String, default: '12px' },
  fontWeight: { type: String, default: '700' },
  fontFamily: { type: String, default: '' },
  fontStyle: { type: String, default: 'normal' },
  textTransform: { type: String, default: 'uppercase' },
  letterSpacing: { type: String, default: '0.5px' },
  lineHeight: { type: String, default: '1' },

  // Image badge properties
  imageUrl: { type: String, default: '' },
  imageWidth: { type: String, default: '60px' },
  imageHeight: { type: String, default: 'auto' },
  imageObjectFit: { type: String, default: 'contain' },

  // HTML badge (advanced users)
  htmlContent: { type: String, default: '' },

  // Positioning
  position: {
    type: String,
    enum: [
      'top-left', 'top-center', 'top-right',
      'middle-left', 'middle-center', 'middle-right',
      'bottom-left', 'bottom-center', 'bottom-right',
      'custom'
    ],
    default: 'top-right'
  },
  customTop: { type: String, default: '' },
  customRight: { type: String, default: '' },
  customBottom: { type: String, default: '' },
  customLeft: { type: String, default: '' },
  zIndex: { type: Number, default: 10 },

  // Sizing
  width: { type: String, default: 'auto' },
  height: { type: String, default: 'auto' },
  minWidth: { type: String, default: '' },
  maxWidth: { type: String, default: '' },

  // Spacing
  paddingTop: { type: String, default: '4px' },
  paddingRight: { type: String, default: '10px' },
  paddingBottom: { type: String, default: '4px' },
  paddingLeft: { type: String, default: '10px' },
  marginTop: { type: String, default: '8px' },
  marginRight: { type: String, default: '8px' },
  marginBottom: { type: String, default: '0px' },
  marginLeft: { type: String, default: '0px' },

  // Borders
  borderRadius: { type: String, default: '4px' },
  borderTopLeftRadius: { type: String, default: '' },
  borderTopRightRadius: { type: String, default: '' },
  borderBottomRightRadius: { type: String, default: '' },
  borderBottomLeftRadius: { type: String, default: '' },
  borderWidth: { type: String, default: '0px' },
  borderStyle: { type: String, default: 'solid' },
  borderColor: { type: String, default: 'transparent' },

  // Shadow
  boxShadow: { type: String, default: '' },

  // Transform
  rotate: { type: String, default: '0deg' },
  scale: { type: String, default: '1' },
  translateX: { type: String, default: '0px' },
  translateY: { type: String, default: '0px' },
  skewX: { type: String, default: '0deg' },
  skewY: { type: String, default: '0deg' },

  // Effects
  opacity: { type: String, default: '1' },
  backdropFilter: { type: String, default: '' },
  filter: { type: String, default: '' },
  mixBlendMode: { type: String, default: 'normal' },

  // Animation
  animation: {
    type: String,
    enum: ['none', 'pulse', 'bounce', 'shake', 'fade-in', 'slide-in', 'glow', 'wiggle', 'flip'],
    default: 'none'
  },
  animationDuration: { type: String, default: '1s' },

  // Shape (for text badges)
  shape: {
    type: String,
    enum: ['rectangle', 'rounded', 'pill', 'circle', 'ribbon-left', 'ribbon-right', 'banner', 'triangle', 'diamond', 'star-burst'],
    default: 'rounded'
  },

  // Gradient background
  useGradient: { type: Boolean, default: false },
  gradientFrom: { type: String, default: '#ef4444' },
  gradientTo: { type: String, default: '#f97316' },
  gradientDirection: { type: String, default: '135deg' },

  // Custom CSS override
  customCSS: { type: String, default: '' },

}, { _id: false });

// ── Main Badge schema ────────────────────────────────────────────────────────
const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Badge name is required'],
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    default: '',
    maxlength: 500,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // Whether this badge is currently active
  isActive: {
    type: Boolean,
    default: true,
  },

  // Priority for display ordering (higher = shown first / on top)
  priority: {
    type: Number,
    default: 10,
  },

  // Conditions — ALL must match (AND logic). Use multiple badges for OR.
  conditions: [conditionSchema],

  // Condition logic
  conditionLogic: {
    type: String,
    enum: ['all', 'any'],   // all = AND, any = OR
    default: 'all',
  },

  // Visual style
  style: badgeStyleSchema,

  // Where this badge can appear
  displayOn: {
    productCards: { type: Boolean, default: true },
    productPages: { type: Boolean, default: true },
    categoryPages: { type: Boolean, default: false },
    cartItems: { type: Boolean, default: false },
    searchResults: { type: Boolean, default: true },
    pageBuilder: { type: Boolean, default: true },
  },

  // Manual assignments (in addition to conditions)
  assignedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  assignedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],

  // Scheduling
  startDate: Date,
  endDate: Date,

  // Usage stats
  impressions: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// ── Indexes ──────────────────────────────────────────────────────────────────
badgeSchema.index({ isActive: 1, priority: -1 });
badgeSchema.index({ slug: 1 });
badgeSchema.index({ 'conditions.type': 1 });
badgeSchema.index({ assignedProducts: 1 });
badgeSchema.index({ assignedCategories: 1 });
badgeSchema.index({ startDate: 1, endDate: 1 });

// ── Generate slug ────────────────────────────────────────────────────────────
badgeSchema.pre('save', async function (next) {
  if (this.isModified('name') && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = baseSlug;
    let counter = 1;
    while (await mongoose.model('Badge').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    this.slug = slug;
  }
  next();
});

// ── Virtual: isScheduledActive ──────────────────────────────────────────────
badgeSchema.virtual('isScheduledActive').get(function () {
  if (!this.startDate && !this.endDate) return true;
  const now = new Date();
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
});

module.exports = mongoose.model('Badge', badgeSchema);
