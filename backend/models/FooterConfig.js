const mongoose = require('mongoose');

// ── Link item schema ──────────────────────────────────────────────
const linkItemSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  url: { type: String, default: '#' },
  openInNewTab: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  badge: { type: String, default: '' },
  badgeColor: { type: String, default: '#ef4444' },
  badgeBgColor: { type: String, default: '#fef2f2' },
}, { _id: true });

// ── Social link schema ────────────────────────────────────────────
const socialLinkSchema = new mongoose.Schema({
  platform: { type: String, default: '' },
  url: { type: String, default: '' },
  icon: { type: String, default: '' },
}, { _id: true });

// ── Payment icon schema ───────────────────────────────────────────
const paymentIconSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  image: { type: String, default: '' },
  color: { type: String, default: '#1e40af' },
  bgColor: { type: String, default: '#ffffff' },
}, { _id: true });

// ── Column content item schema ────────────────────────────────────
const columnContentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['links', 'text', 'logo', 'contact', 'social', 'newsletter', 'html', 'image', 'payment-icons'],
    default: 'links',
  },
  // links
  heading: { type: String, default: '' },
  links: [linkItemSchema],
  // text / html
  content: { type: String, default: '' },
  // logo
  logoImage: { type: String, default: '' },
  logoWidth: { type: String, default: '150px' },
  logoLink: { type: String, default: '/' },
  description: { type: String, default: '' },
  // contact
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  showIcons: { type: Boolean, default: true },
  // social (inline in column)
  socialLinks: [socialLinkSchema],
  socialStyle: { type: String, enum: ['circle', 'square', 'plain'], default: 'circle' },
  socialSize: { type: String, default: '20px' },
  socialColor: { type: String, default: '' },
  socialHoverColor: { type: String, default: '' },
  // newsletter
  newsletterTitle: { type: String, default: 'Subscribe' },
  newsletterText: { type: String, default: '' },
  newsletterButtonText: { type: String, default: 'Submit' },
  newsletterButtonBg: { type: String, default: '' },
  newsletterButtonColor: { type: String, default: '' },
  newsletterInputBg: { type: String, default: '#ffffff' },
  // image
  image: { type: String, default: '' },
  imageWidth: { type: String, default: '100%' },
  imageLink: { type: String, default: '' },
  // payment icons
  paymentIcons: [paymentIconSchema],
}, { _id: true });

// ── Column schema ─────────────────────────────────────────────────
const columnSchema = new mongoose.Schema({
  width: { type: String, default: 'auto' }, // auto, 1/4, 1/3, 1/2, 2/3, 3/4, full, custom
  customWidth: { type: String, default: '' }, // e.g. '300px' or '25%'
  content: [columnContentSchema],
  verticalAlign: { type: String, enum: ['top', 'center', 'bottom'], default: 'top' },
  paddingTop: { type: String, default: '0px' },
  paddingBottom: { type: String, default: '0px' },
  paddingLeft: { type: String, default: '0px' },
  paddingRight: { type: String, default: '0px' },
}, { _id: true });

// ── Row / Block schema ────────────────────────────────────────────
const rowSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  label: { type: String, default: 'Footer Row' },
  columns: [columnSchema],
  columnCount: { type: Number, default: 4, min: 1, max: 6 },
  columnGap: { type: String, default: '32px' },
  backgroundColor: { type: String, default: '' },
  textColor: { type: String, default: '' },
  linkColor: { type: String, default: '' },
  linkHoverColor: { type: String, default: '' },
  headingColor: { type: String, default: '' },
  headingSize: { type: String, default: '18px' },
  fontSize: { type: String, default: '14px' },
  containerWidth: { type: String, enum: ['contained', 'full'], default: 'contained' },
  paddingTop: { type: String, default: '48px' },
  paddingBottom: { type: String, default: '48px' },
  borderTop: { type: String, default: '' },
  borderBottom: { type: String, default: '' },
  order: { type: Number, default: 0 },
  // Responsive overrides: { tablet: { columnCount, columnGap, ... }, mobile: { ... } }
  responsive: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: true });

// ── Main footer config schema ─────────────────────────────────────
const footerConfigSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  rows: [rowSchema],

  // Global footer settings
  globalBackgroundColor: { type: String, default: '#1b5e35' },
  globalTextColor: { type: String, default: '#ffffff' },
  globalLinkColor: { type: String, default: '#d1d5db' },
  globalLinkHoverColor: { type: String, default: '#ffffff' },
  globalHeadingColor: { type: String, default: '#ffffff' },
  globalFontFamily: { type: String, default: '' },

  // Bottom bar
  bottomBarEnabled: { type: Boolean, default: true },
  bottomBarBackgroundColor: { type: String, default: '' },
  bottomBarTextColor: { type: String, default: '' },
  bottomBarBorderTop: { type: String, default: '1px solid rgba(255,255,255,0.1)' },
  copyrightText: { type: String, default: '' },
  copyrightPosition: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
  showPaymentIcons: { type: Boolean, default: false },
  paymentIcons: [paymentIconSchema],
  bottomBarPaddingTop: { type: String, default: '24px' },
  bottomBarPaddingBottom: { type: String, default: '24px' },

  lastPublishedAt: { type: Date },
}, {
  timestamps: true,
  collection: 'footerconfig',
});

// Singleton pattern
footerConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ rows: [], isActive: false });
  }
  return config;
};

module.exports = mongoose.model('FooterConfig', footerConfigSchema);
