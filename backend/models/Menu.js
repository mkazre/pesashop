const mongoose = require('mongoose');

// ── Menu Item Schema ─────────────────────────────────────────────────
const menuItemSchema = new mongoose.Schema({
  label: { type: String, required: true },
  description: { type: String, default: '' }, // Subtitle / description text
  link: { type: String, default: '#' },
  linkType: {
    type: String,
    enum: ['manual', 'page', 'category', 'product', 'none'], // 'none' = non-clickable parent
    default: 'manual',
  },
  linkId: { type: String }, // Page ID, category ID, or product ID
  icon: { type: String, default: '' }, // Lucide icon name or image URL
  iconPosition: { type: String, enum: ['left', 'right', 'top'], default: 'left' },
  image: { type: String, default: '' }, // Image URL for visual menu items
  imageWidth: { type: String, default: '' },
  imageHeight: { type: String, default: '' },
  badge: { type: String, default: '' },
  badgeColor: { type: String, default: '#ef4444' }, // Full hex color
  badgeBgColor: { type: String, default: '#fef2f2' },
  badgePosition: { type: String, enum: ['', 'right', 'left', 'above', 'below'], default: 'right' },
  badgeFontSize: { type: String, default: '10px' },
  badgeFontWeight: { type: String, default: '600' },
  badgeFontStyle: { type: String, default: 'normal' },
  badgeTextTransform: { type: String, default: 'none' },
  badgeLetterSpacing: { type: String, default: '' },
  badgePaddingTop: { type: String, default: '2px' },
  badgePaddingRight: { type: String, default: '8px' },
  badgePaddingBottom: { type: String, default: '2px' },
  badgePaddingLeft: { type: String, default: '8px' },
  badgeMarginTop: { type: String, default: '0px' },
  badgeMarginRight: { type: String, default: '0px' },
  badgeMarginBottom: { type: String, default: '0px' },
  badgeMarginLeft: { type: String, default: '0px' },
  badgeBorderRadius: { type: String, default: '9999px' },
  badgeAnimation: { type: String, enum: ['', 'none', 'pulse', 'flash', 'bounce', 'glow', 'shake', 'swing', 'heartbeat', 'rubberBand', 'tada'], default: 'none' },
  openInNewTab: { type: Boolean, default: false },
  noFollow: { type: Boolean, default: false }, // SEO: rel="nofollow"

  // Visibility rules
  visibility: {
    showOnDesktop: { type: Boolean, default: true },
    showOnTablet: { type: Boolean, default: true },
    showOnMobile: { type: Boolean, default: true },
    showLoggedIn: { type: Boolean, default: true },
    showLoggedOut: { type: Boolean, default: true },
  },

  // Per-item styling
  itemStyle: {
    textColor: { type: String, default: '' },
    hoverTextColor: { type: String, default: '' },
    backgroundColor: { type: String, default: '' },
    hoverBackgroundColor: { type: String, default: '' },
    fontSize: { type: String, default: '' },
    fontWeight: { type: String, default: '' },
    fontFamily: { type: String, default: '' },
    letterSpacing: { type: String, default: '' },
    textTransform: { type: String, default: '' },
    padding: { type: String, default: '' },
    borderRadius: { type: String, default: '' },
    customClass: { type: String, default: '' },
  },

  // Mega Menu configuration (per-item)
  megaMenu: {
    enabled: { type: Boolean, default: false },
    width: { type: String, enum: ['full-width', 'container', 'custom'], default: 'container' },
    customWidth: { type: String, default: '800px' },
    position: { type: String, enum: ['below-item', 'below-menu', 'center'], default: 'below-menu' },
    columns: { type: Number, default: 4 },
    columnWidths: { type: String, default: '' }, // e.g. "25%,25%,25%,25%"
    content: { type: mongoose.Schema.Types.Mixed, default: {} }, // Craft.js serialized state
    backgroundColor: { type: String, default: '#ffffff' },
    backgroundImage: { type: String, default: '' },
    backgroundSize: { type: String, default: 'cover' },
    backgroundPosition: { type: String, default: 'center' },
    padding: { type: String, default: '24px' },
    borderRadius: { type: String, default: '8px' },
    boxShadow: { type: String, default: '0 10px 40px rgba(0,0,0,0.12)' },
    animation: { type: String, enum: ['none', 'fade', 'slide-down', 'slide-up', 'grow', 'zoom'], default: 'fade' },
    animationDuration: { type: String, default: '200ms' },
  },

  children: [this], // Recursive schema for nested items
  order: { type: Number, default: 0 },
}, { _id: true });

// ── Menu Schema ──────────────────────────────────────────────────────
const menuSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: {
    type: String,
    enum: ['header', 'footer', 'sidebar', 'mobile', 'custom'],
    required: true,
  },
  items: [menuItemSchema],

  // Auto-populate options
  autoPopulatePages: { type: Boolean, default: false },
  autoPopulateCategories: { type: Boolean, default: false },

  // ── Menu-Level Settings ────────────────────────────────────────────
  settings: {
    // Layout
    layout: { type: String, enum: ['horizontal', 'vertical'], default: 'horizontal' },
    alignment: { type: String, enum: ['left', 'center', 'right', 'space-between', 'space-around'], default: 'left' },
    fullWidth: { type: Boolean, default: false },

    // Sticky / Fixed
    sticky: { type: Boolean, default: false },
    stickyOffset: { type: String, default: '0px' },
    stickyBackgroundColor: { type: String, default: '' },
    stickyTextColor: { type: String, default: '' },
    stickyBoxShadow: { type: String, default: '0 2px 10px rgba(0,0,0,0.1)' },

    // Transparent header (overlay on hero)
    transparent: { type: Boolean, default: false },
    transparentTextColor: { type: String, default: '#ffffff' },

    // Colors & Typography
    backgroundColor: { type: String, default: '#ffffff' },
    textColor: { type: String, default: '#374151' },
    hoverTextColor: { type: String, default: '#3b82f6' },
    activeTextColor: { type: String, default: '#3b82f6' },
    fontSize: { type: String, default: '14px' },
    fontWeight: { type: String, default: '500' },
    fontFamily: { type: String, default: '' },
    textTransform: { type: String, default: 'none' },
    letterSpacing: { type: String, default: '0px' },
    itemGap: { type: String, default: '0px' },
    itemPadding: { type: String, default: '12px 18px' },

    // Dropdown settings (for non-mega submenus)
    dropdown: {
      trigger: { type: String, enum: ['hover', 'click'], default: 'hover' },
      animation: { type: String, enum: ['none', 'fade', 'slide-down', 'slide-up', 'grow'], default: 'fade' },
      animationDuration: { type: String, default: '200ms' },
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#374151' },
      hoverTextColor: { type: String, default: '#3b82f6' },
      hoverBackgroundColor: { type: String, default: '#f3f4f6' },
      borderColor: { type: String, default: '#e5e7eb' },
      borderRadius: { type: String, default: '8px' },
      boxShadow: { type: String, default: '0 10px 30px rgba(0,0,0,0.1)' },
      minWidth: { type: String, default: '200px' },
      padding: { type: String, default: '8px 0' },
      itemPadding: { type: String, default: '8px 16px' },
      fontSize: { type: String, default: '13px' },
      indicator: { type: String, enum: ['arrow', 'chevron', 'plus', 'none'], default: 'chevron' },
    },

    // Mobile / Responsive
    mobile: {
      breakpoint: { type: String, default: '768px' }, // When to switch to mobile menu
      menuStyle: { type: String, enum: ['slide-left', 'slide-right', 'fullscreen', 'dropdown', 'off-canvas'], default: 'slide-left' },
      hamburgerStyle: { type: String, enum: ['default', 'squeeze', 'spin', 'elastic', 'collapse'], default: 'default' },
      hamburgerColor: { type: String, default: '#374151' },
      hamburgerSize: { type: String, default: '24px' },
      backgroundColor: { type: String, default: '#ffffff' },
      textColor: { type: String, default: '#374151' },
      fontSize: { type: String, default: '16px' },
      itemPadding: { type: String, default: '12px 16px' },
      showSearch: { type: Boolean, default: false },
      showSocial: { type: Boolean, default: false },
      submenuAnimation: { type: String, enum: ['accordion', 'slide', 'fade'], default: 'accordion' },
      closeOnLinkClick: { type: Boolean, default: true },
      overlayColor: { type: String, default: 'rgba(0,0,0,0.5)' },
    },

    // Tablet-specific overrides
    tablet: {
      breakpoint: { type: String, default: '1024px' },
      layout: { type: String, enum: ['same', 'horizontal', 'vertical', 'mobile'], default: 'same' },
      fontSize: { type: String, default: '' },
      itemPadding: { type: String, default: '' },
      itemGap: { type: String, default: '' },
      hiddenItems: [{ type: String }], // Item IDs to hide on tablet
    },

    // Active state indicator
    activeIndicator: {
      type: { type: String, enum: ['none', 'underline', 'overline', 'background', 'border-bottom', 'dot'], default: 'underline' },
      color: { type: String, default: '#3b82f6' },
      thickness: { type: String, default: '2px' },
    },

    // Dividers between items
    divider: {
      enabled: { type: Boolean, default: false },
      color: { type: String, default: '#e5e7eb' },
      width: { type: String, default: '1px' },
      height: { type: String, default: '20px' },
    },

    // Logo in menu
    logo: {
      enabled: { type: Boolean, default: false },
      src: { type: String, default: '' },
      width: { type: String, default: '120px' },
      height: { type: String, default: 'auto' },
      position: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
      link: { type: String, default: '/' },
      stickyLogo: { type: String, default: '' }, // Different logo for sticky state
    },

    // CTA Button in menu
    ctaButton: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: 'Get Started' },
      link: { type: String, default: '#' },
      backgroundColor: { type: String, default: '#3b82f6' },
      textColor: { type: String, default: '#ffffff' },
      hoverBackgroundColor: { type: String, default: '#2563eb' },
      borderRadius: { type: String, default: '6px' },
      padding: { type: String, default: '10px 20px' },
      fontSize: { type: String, default: '14px' },
      fontWeight: { type: String, default: '600' },
      position: { type: String, enum: ['left', 'right'], default: 'right' },
    },

    // Search in menu
    search: {
      enabled: { type: Boolean, default: false },
      style: { type: String, enum: ['icon', 'inline', 'expandable'], default: 'icon' },
      placeholder: { type: String, default: 'Search...' },
      position: { type: String, enum: ['left', 'right'], default: 'right' },
    },

    // Footer-specific settings
    footer: {
      columns: { type: Number, default: 4 },
      columnWidths: { type: String, default: '' },
      backgroundColor: { type: String, default: '#1a1a2e' },
      textColor: { type: String, default: '#a0aec0' },
      headingColor: { type: String, default: '#ffffff' },
      headingFontSize: { type: String, default: '18px' },
      linkHoverColor: { type: String, default: '#ffffff' },
      padding: { type: String, default: '48px 0' },
      showNewsletter: { type: Boolean, default: false },
      newsletterTitle: { type: String, default: 'Subscribe to our newsletter' },
      newsletterDescription: { type: String, default: '' },
      showSocialIcons: { type: Boolean, default: false },
      socialLinks: {
        facebook: { type: String, default: '' },
        twitter: { type: String, default: '' },
        instagram: { type: String, default: '' },
        linkedin: { type: String, default: '' },
        youtube: { type: String, default: '' },
        pinterest: { type: String, default: '' },
        tiktok: { type: String, default: '' },
      },
      copyrightText: { type: String, default: '' },
      showPaymentIcons: { type: Boolean, default: false },
      paymentMethods: [{ type: String }], // ['visa', 'mastercard', 'amex', 'paypal', 'apple-pay']
      bottomBarBg: { type: String, default: '' },
      bottomBarTextColor: { type: String, default: '' },
    },

    // Custom CSS
    customCSS: { type: String, default: '' },
    customClass: { type: String, default: '' },
  },

  // Global assignment — if true, applies to all pages unless overridden
  isGlobal: { type: Boolean, default: false },

  isActive: { type: Boolean, default: true },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Index for quick lookup
menuSchema.index({ location: 1, isActive: 1 });
menuSchema.index({ isGlobal: 1, location: 1, isActive: 1 });

module.exports = mongoose.model('Menu', menuSchema);
