const mongoose = require('mongoose');

const blockSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['heading', 'text', 'image', 'button', 'input', 'coupon', 'countdown', 'divider', 'spacer', 'video', 'icon_text', 'html'],
    required: true
  },
  content: { type: mongoose.Schema.Types.Mixed, default: {} },
  styles: { type: mongoose.Schema.Types.Mixed, default: {} },
  mobileStyles: { type: mongoose.Schema.Types.Mixed, default: {} },
  tabletStyles: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { _id: false });

const layoutSchema = new mongoose.Schema({
  width: { type: String, default: '560px' },
  maxWidth: { type: String, default: '92vw' },
  minHeight: { type: String, default: 'auto' },
  position: {
    type: String,
    enum: [
      'center', 'top_left', 'top_center', 'top_right',
      'bottom_left', 'bottom_center', 'bottom_right',
      'left_center', 'right_center',
      'full_screen', 'top_bar', 'bottom_bar', 'left_drawer', 'right_drawer'
    ],
    default: 'center'
  },
  blocks: [blockSchema]
}, { _id: false });

const popupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  status: { type: String, enum: ['draft', 'active', 'paused'], default: 'draft' },
  tags: [String],
  priority: { type: Number, default: 0 },

  // Per-device responsive layouts
  layouts: {
    desktop: {
      type: layoutSchema,
      default: () => ({ width: '560px', maxWidth: '90vw', position: 'center', blocks: [] })
    },
    tablet: {
      type: layoutSchema,
      default: () => ({ width: '480px', maxWidth: '90vw', position: 'center', blocks: [] })
    },
    mobile: {
      type: layoutSchema,
      default: () => ({ width: '100%', maxWidth: '95vw', position: 'bottom_center', blocks: [] })
    },
    useDesktopForTablet: { type: Boolean, default: true },
    useDesktopForMobile: { type: Boolean, default: false },
  },

  // Global design
  design: {
    backgroundColor: { type: String, default: '#ffffff' },
    backgroundType: { type: String, enum: ['color', 'gradient', 'image'], default: 'color' },
    backgroundGradient: { type: String, default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    backgroundImage: { type: String, default: '' },
    backgroundSize: { type: String, default: 'cover' },
    backgroundPosition: { type: String, default: 'center' },
    borderRadius: { type: String, default: '16px' },
    border: { type: String, default: 'none' },
    boxShadow: { type: String, default: '0 25px 60px rgba(0,0,0,0.35)' },
    padding: { type: String, default: '40px 36px' },
    // Overlay
    overlayEnabled: { type: Boolean, default: true },
    overlayColor: { type: String, default: '#000000' },
    overlayOpacity: { type: Number, default: 0.55, min: 0, max: 1 },
    overlayBlur: { type: Boolean, default: false },
    overlayBlurAmount: { type: Number, default: 4 },
    closeOnOverlayClick: { type: Boolean, default: true },
    // Close button
    showCloseButton: { type: Boolean, default: true },
    closeButtonPosition: { type: String, enum: ['top_right', 'top_left', 'inner_top_right', 'inner_top_left'], default: 'top_right' },
    closeButtonDelay: { type: Number, default: 0 },
    closeButtonColor: { type: String, default: '#888888' },
    closeButtonBg: { type: String, default: 'rgba(0,0,0,0.08)' },
    closeButtonSize: { type: Number, default: 28 },
    // Animation
    entryAnimation: {
      type: String,
      enum: ['fade', 'slide_up', 'slide_down', 'slide_left', 'slide_right', 'zoom_in', 'bounce', 'flip_x', 'rotate_in', 'elastic'],
      default: 'fade'
    },
    exitAnimation: {
      type: String,
      enum: ['fade', 'slide_up', 'slide_down', 'slide_left', 'slide_right', 'zoom_out', 'none'],
      default: 'fade'
    },
    animationDuration: { type: Number, default: 400 },
  },

  // Trigger
  trigger: {
    type: {
      type: String,
      enum: ['immediate', 'delay', 'scroll_percent', 'exit_intent', 'click_element', 'inactivity'],
      default: 'delay'
    },
    delay: { type: Number, default: 3 },
    scrollPercent: { type: Number, default: 50, min: 0, max: 100 },
    clickSelector: { type: String, default: '' },
    inactivitySeconds: { type: Number, default: 30 },
  },

  // Display / audience rules
  display: {
    showOnWeb: { type: Boolean, default: true },
    showOnApp: { type: Boolean, default: false },
    deviceTarget: {
      type: String,
      enum: ['all', 'desktop_only', 'tablet_only', 'mobile_only', 'desktop_and_tablet', 'mobile_and_tablet'],
      default: 'all'
    },
    pageTarget: {
      type: String,
      enum: ['all_pages', 'homepage', 'shop', 'product', 'cart', 'checkout', 'account', 'custom_pages'],
      default: 'all_pages'
    },
    pagePaths: [String],
    excludedPaths: [String],
    frequency: {
      type: String,
      enum: ['always', 'once_per_session', 'once_per_day', 'once_per_week', 'once_per_month', 'once_ever'],
      default: 'once_per_session'
    },
    maxImpressions: { type: Number, default: 0 },
    startDate: { type: Date },
    endDate: { type: Date },
  },

  // Advanced conditions
  conditions: {
    loggedIn: { type: String, enum: ['any', 'logged_in', 'logged_out'], default: 'any' },
    userRoles: [String],
    visitorType: { type: String, enum: ['any', 'new', 'returning'], default: 'any' },
    cartMinValue: { type: Number },
    cartMaxValue: { type: Number },
    urlContains: [String],
    urlNotContains: [String],
    referrerContains: { type: String, default: '' },
    cookieName: { type: String, default: '' },
    cookieValue: { type: String, default: '' },
  },

  // Conversion goal
  goal: {
    type: { type: String, enum: ['none', 'coupon_copy', 'button_click', 'form_submit', 'url_visit'], default: 'none' },
    goalSelector: { type: String, default: '' },
    goalUrl: { type: String, default: '' },
    successMessage: { type: String, default: 'Thank you!' },
    closeAfterGoal: { type: Boolean, default: true },
    redirectAfterGoal: { type: String, default: '' },
  },

  // Analytics
  analytics: {
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    dismissals: { type: Number, default: 0 },
  },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

popupSchema.index({ status: 1, priority: -1 });

popupSchema.statics.getActiveForContext = async function(context = {}) {
  const { pageType, pagePath, isWeb, isApp } = context;
  const now = new Date();

  const base = { status: 'active' };
  const popups = await this.find(base).sort({ priority: -1, createdAt: -1 });

  return popups.filter(p => {
    if (p.display.endDate && p.display.endDate < now) return false;
    if (p.display.startDate && p.display.startDate > now) return false;

    if (isWeb && !p.display.showOnWeb) return false;
    if (isApp && !p.display.showOnApp) return false;

    if (p.display.pageTarget !== 'all_pages') {
      if (p.display.pageTarget === 'custom_pages') {
        const paths = p.display.pagePaths || [];
        if (!paths.some(pp => pagePath?.startsWith(pp))) return false;
      } else {
        const map = { homepage: '/', shop: '/shop', product: '/product', cart: '/cart', checkout: '/checkout', account: '/account' };
        const target = map[p.display.pageTarget];
        if (target) {
          if (target === '/' && pagePath !== '/') return false;
          if (target !== '/' && !pagePath?.startsWith(target)) return false;
        }
      }
    }

    if (p.display.excludedPaths?.length) {
      if (p.display.excludedPaths.some(ep => pagePath?.startsWith(ep))) return false;
    }

    return true;
  });
};

module.exports = mongoose.model('Popup', popupSchema);
