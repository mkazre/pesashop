const mongoose = require('mongoose');

/**
 * ProductPageSettings — Singleton collection that controls every aspect
 * of the customer-facing product detail page.
 * Admin configures these; frontend reads the public endpoint and renders accordingly.
 */

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  collapsed: { type: Boolean, default: false }, // default collapsed state
  order: { type: Number, default: 0 },
}, { _id: false });

const trustBadgeSchema = new mongoose.Schema({
  icon: { type: String, default: '🔒' },
  text: { type: String, default: 'Secure checkout' },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const deliveryOptionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  icon: { type: String, default: '🚚' },
  subtitle: { type: String, default: '' },
  isFree: { type: Boolean, default: false },
  price: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const freeShippingZoneSchema = new mongoose.Schema({
  code: { type: String, required: true },
  label: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
}, { _id: false });

const socialProofMessageSchema = new mongoose.Schema({
  template: { type: String, default: '{name} from {city} just {action}' },
  names: [{ type: String }],
  cities: [{ type: String }],
  actions: [{ type: String }],
  avatars: [{ type: String }],
  enabled: { type: Boolean, default: true },
}, { _id: false });

const pickupAddressSchema = new mongoose.Schema({
  label: { type: String, required: true },
  address: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const checkoutPaymentMethodSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  displayType: { type: String, enum: ['icon', 'text', 'image'], default: 'icon' },
  icon: { type: String, default: '' },      // emoji or icon name (e.g. '🏦')
  image: { type: String, default: '' },      // uploaded image URL/path
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false });

const checkoutFieldSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'email', 'tel', 'select', 'textarea'], default: 'text' },
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  options: [{ type: String }], // for select type
}, { _id: false });

const layoutSchema = new mongoose.Schema({
  type: { type: String, enum: ['2-col', '3-col-walmart'], default: '3-col-walmart' },
  maxWidth: { type: Number, default: 1440 },
  galleryColumnWidth: { type: String, default: '420px' },
  fulfillmentColumnWidth: { type: String, default: '300px' },
  gap: { type: Number, default: 24 },
  stickyGallery: { type: Boolean, default: true },
  stickyFulfillment: { type: Boolean, default: true },
  stickyOffset: { type: Number, default: 120 },
}, { _id: false });

// ── Main Schema ──────────────────────────────────────────────────────────────

const productPageSettingsSchema = new mongoose.Schema({

  // ─── LAYOUT ───────────────────────────────────────────────────────────
  layout: {
    type: layoutSchema,
    default: () => ({}),
  },

  // ─── BREADCRUMBS ──────────────────────────────────────────────────────
  breadcrumbs: {
    enabled: { type: Boolean, default: true },
    showHome: { type: Boolean, default: true },
    showCategory: { type: Boolean, default: true },
    showSubCategory: { type: Boolean, default: true },
  },

  // ─── GALLERY ──────────────────────────────────────────────────────────
  gallery: {
    enabled: { type: Boolean, default: true },
    showThumbnails: { type: Boolean, default: true },
    showZoom: { type: Boolean, default: true },
    showBadgeOverlay: { type: Boolean, default: true },
    badgeOverlayType: { type: String, enum: ['save-amount', 'percentage', 'custom-text', 'badge-module'], default: 'save-amount' },
    showWishlistButton: { type: Boolean, default: true },
    showShareButton: { type: Boolean, default: true },
    showImageCounter: { type: Boolean, default: true },
    enableLightbox: { type: Boolean, default: true },
    enableSwipeOnMobile: { type: Boolean, default: true },
    showVideoThumbnail: { type: Boolean, default: true },
    showNavigationArrows: { type: Boolean, default: true },
    arrows: {
      icon: { type: String, enum: ['chevron', 'arrow-thin', 'triangle'], default: 'chevron' },
      iconColor: { type: String, default: '#ffffff' },
      bgColor: { type: String, default: 'rgba(27,94,53,0.85)' },
      size: { type: Number, default: 36 },
      padding: { type: Number, default: 8 },
      borderRadius: { type: Number, default: 4 },
      border: { type: String, default: 'none' },
      margin: { type: Number, default: 8 },
    },
  },

  // ─── PRODUCT INFO (MIDDLE COLUMN) ────────────────────────────────────
  productInfo: {
    showBrand: { type: Boolean, default: true },
    showName: { type: Boolean, default: true },
    showRating: { type: Boolean, default: true },
    showReviewCount: { type: Boolean, default: true },
    showQtySold: { type: Boolean, default: true },
    showSKU: { type: Boolean, default: true },
    showPrice: { type: Boolean, default: true },
    showOriginalPrice: { type: Boolean, default: true },
    showSaveBadge: { type: Boolean, default: true },
    saveBadgeType: { type: String, enum: ['amount', 'percentage', 'both'], default: 'amount' },
    showPesaCoins: { type: Boolean, default: true },
    pesaCoinsLabel: { type: String, default: 'PESA Coins' },
    showEstimatedDelivery: { type: Boolean, default: true },
    estimatedDeliveryDays: { type: Number, default: 3 },
    showFreeShippingZones: { type: Boolean, default: true },
    freeShippingZones: [freeShippingZoneSchema],
    showStockStatus: { type: Boolean, default: true },
    showStockPulse: { type: Boolean, default: true }, // animated pulse dot
    lowStockThreshold: { type: Number, default: 5 },
    showShortDescription: { type: Boolean, default: true },
    showCategories: { type: Boolean, default: true },
    showTags: { type: Boolean, default: true },
    showVariants: { type: Boolean, default: true },
    showQuickSpecs: { type: Boolean, default: true },
    quickSpecsCount: { type: Number, default: 4 },
  },

  // ─── SPECIFICATIONS ───────────────────────────────────────────────────
  specifications: {
    enabled: { type: Boolean, default: true },
    displayStyle: { type: String, enum: ['grid', 'table', 'list'], default: 'table' },
    aiAutoGenerate: { type: Boolean, default: false },
    aiPromptTemplate: { type: String, default: 'Generate detailed product specifications for: {productName}. Include technical details, dimensions, materials, and key features. Return as JSON array of {key, value} pairs.' },
    showQuickSpecsInInfo: { type: Boolean, default: true },
  },

  // ─── SECTIONS BELOW PRODUCT INFO ──────────────────────────────────────
  sections: {
    type: [sectionSchema],
    default: [
      { id: 'about', label: 'About this item', enabled: true, collapsed: false, order: 0 },
      { id: 'specifications', label: 'Specifications', enabled: true, collapsed: true, order: 1 },
      { id: 'reviews', label: 'Customer Reviews', enabled: true, collapsed: true, order: 2 },
      { id: 'related', label: 'Customers also viewed', enabled: true, collapsed: true, order: 3 },
      { id: 'upsells', label: 'Frequently bought together', enabled: true, collapsed: true, order: 4 },
      { id: 'also_bought', label: 'Customers Also Bought', enabled: true, collapsed: false, order: 5 },
      { id: 'recommended', label: 'Recommended With Your Purchase', enabled: true, collapsed: false, order: 6 },
      { id: 'qa', label: 'Questions & Answers', enabled: false, collapsed: true, order: 7 },
    ],
  },

  // ─── FULFILLMENT BOX (RIGHT COLUMN) ──────────────────────────────────
  fulfillmentBox: {
    enabled: { type: Boolean, default: true },
    showPrice: { type: Boolean, default: true },
    showPesaCoins: { type: Boolean, default: true },
    showLaybye: { type: Boolean, default: true },
    showDeliveryOptions: { type: Boolean, default: true },
    deliveryOptions: {
      type: [deliveryOptionSchema],
      default: [
        { id: 'delivery', label: 'Delivery', icon: '🚚', subtitle: '', isFree: true, price: 0, enabled: true, order: 0 },
        { id: 'pickup', label: 'Pickup in-store', icon: '🏪', subtitle: 'Available · Main Store', isFree: true, price: 0, enabled: true, order: 1 },
      ],
    },
    showQtyControl: { type: Boolean, default: true },
    showBuyNow: { type: Boolean, default: true },
    showAddToCart: { type: Boolean, default: true },
    showTrustBadges: { type: Boolean, default: true },
    trustBadges: {
      type: [trustBadgeSchema],
      default: [
        { icon: '🔒', text: 'Secure checkout', enabled: true, order: 0 },
        { icon: '↩️', text: '30-day returns', enabled: true, order: 1 },
        { icon: '🚚', text: 'Delivered across Zimbabwe', enabled: true, order: 2 },
        { icon: '📱', text: 'EcoCash · OneMoney · Visa', enabled: true, order: 3 },
      ],
    },
    showPaymentMethodLogos: { type: Boolean, default: true },
    paymentMethods: {
      type: [String],
      default: ['VISA', 'MASTERCARD', 'ECOCASH', 'ONEMONEY', 'PAYPAL'],
    },
  },

  // ─── LAYBYE DISPLAY ──────────────────────────────────────────────────
  laybyeDisplay: {
    displayMode: { type: String, enum: ['inline-plans', 'widget-modal', 'both'], default: 'inline-plans' },
    showInFulfillmentBox: { type: Boolean, default: true },
    showInProductInfo: { type: Boolean, default: false },
    toggleLabel: { type: String, default: 'Pay with Laybye' },
    toggleSubLabel: { type: String, default: 'Split into monthly payments — no credit check' },
    toggleIcon: { type: String, default: '💳' },
    showDepositCalculation: { type: Boolean, default: true },
    showMonthlyBreakdown: { type: Boolean, default: true },
    showTotalPayable: { type: Boolean, default: true },
    showInfoBullets: { type: Boolean, default: true },
    infoBullets: {
      type: [String],
      default: [
        '✓ No credit check',
        '✓ Cancel anytime',
        '✓ EcoCash / OneMoney / Card',
        'Item reserved on deposit. Remaining balance due in monthly instalments.',
      ],
    },
  },

  // ─── BUTTONS STYLING ─────────────────────────────────────────────────
  buttons: {
    style: { type: String, enum: ['neon-glow', 'standard', 'gradient', 'outline'], default: 'neon-glow' },
    buyNowLabel: { type: String, default: 'Buy Now →' },
    addToCartLabel: { type: String, default: '🛒 Add to Cart' },
    addedToCartLabel: { type: String, default: '✓ Added to Cart!' },
    buyNowAction: { type: String, enum: ['checkout-drawer', 'checkout-page', 'cart-page'], default: 'checkout-drawer' },
    showShimmerEffect: { type: Boolean, default: true },
    showPulseEffect: { type: Boolean, default: false },
    // Neon glow colours
    primaryBg: { type: String, default: '#1b5e35' },
    primaryTextColor: { type: String, default: '#a8ffca' },
    primaryGlowColor: { type: String, default: 'rgba(168,255,202,0.8)' },
    secondaryBg: { type: String, default: '#f5b800' },
    secondaryTextColor: { type: String, default: '#1a1a1a' },
    // Laybye-mode button overrides
    laybyeBuyLabel: { type: String, default: '💳 Start Laybye — {deposit} deposit' },
    laybyeCartLabel: { type: String, default: 'Add to Cart (Laybye)' },
  },

  // ─── CHECKOUT DRAWER ─────────────────────────────────────────────────
  checkoutDrawer: {
    enabled: { type: Boolean, default: true },
    position: { type: String, enum: ['right', 'left'], default: 'right' },
    width: { type: String, default: '480px' },
    showOverlay: { type: Boolean, default: true },
    // Form Fields
    fields: {
      type: [checkoutFieldSchema],
      default: [
        { id: 'firstName', label: 'First Name', type: 'text', placeholder: 'John', required: true, enabled: true, order: 0 },
        { id: 'lastName', label: 'Last Name', type: 'text', placeholder: 'Doe', required: true, enabled: true, order: 1 },
        { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+263 78 989 1646', required: true, enabled: true, order: 2 },
        { id: 'email', label: 'Email Address', type: 'email', placeholder: 'john@example.com', required: true, enabled: true, order: 3 },
        { id: 'address', label: 'Delivery Address', type: 'text', placeholder: '24 Kaguvi Street', required: true, enabled: true, order: 4 },
        { id: 'city', label: 'City', type: 'text', placeholder: 'Harare', required: true, enabled: true, order: 5 },
        { id: 'country', label: 'Country', type: 'select', placeholder: 'Select country', required: true, enabled: true, order: 6, options: ['Zimbabwe', 'South Africa', 'Mozambique', 'Zambia', 'Botswana', 'Namibia', 'Malawi', 'Tanzania', 'Kenya', 'United Kingdom', 'United States'] },
        { id: 'postalCode', label: 'Postal / ZIP Code', type: 'text', placeholder: '00263', required: false, enabled: true, order: 7 },
        { id: 'notes', label: 'Order Notes', type: 'textarea', placeholder: 'Special delivery instructions...', required: false, enabled: true, order: 8 },
      ],
    },
    // Fulfilment choice in drawer
    showDeliveryPickupChoice: { type: Boolean, default: true },
    deliveryLabel: { type: String, default: '🚚 Deliver to my address' },
    pickupLabel: { type: String, default: '🏪 Collect from our office' },
    pickupAddress: { type: String, default: '24 Kaguvi St, Harare' }, // legacy single address (backward compat)
    pickupAddresses: {
      type: [pickupAddressSchema],
      default: [
        { label: 'Main Branch — Harare', address: '24 Kaguvi St, Harare', enabled: true, order: 0 },
      ],
    },
    requireAddressAlways: { type: Boolean, default: true }, // customer must enter address regardless
    // Payment section
    showPaymentMethods: { type: Boolean, default: true },
    paymentMethods: {
      type: [checkoutPaymentMethodSchema],
      default: [
        { id: 'eft', label: 'EFT / Bank Transfer', displayType: 'icon', icon: '🏦', image: '', enabled: true, order: 0 },
        { id: 'ecocash', label: 'EcoCash', displayType: 'icon', icon: '📱', image: '', enabled: true, order: 1 },
        { id: 'cash', label: 'Cash', displayType: 'icon', icon: '💵', image: '', enabled: true, order: 2 },
        { id: 'card', label: 'Card', displayType: 'icon', icon: '💳', image: '', enabled: true, order: 3 },
      ],
    },
    showOrderSummary: { type: Boolean, default: true },
    showCouponField: { type: Boolean, default: true },
    showLaybyeOption: { type: Boolean, default: true },
  },

  // ─── BADGES ───────────────────────────────────────────────────────────
  badges: {
    enabled: { type: Boolean, default: true },
    source: { type: String, enum: ['auto', 'manual', 'badge-module', 'all'], default: 'badge-module' },
    showOnGallery: { type: Boolean, default: true },
    showOnProductInfo: { type: Boolean, default: true },
    showSaleBadge: { type: Boolean, default: true },
    showNewBadge: { type: Boolean, default: true },
    showOutOfStockBadge: { type: Boolean, default: true },
    showFeaturedBadge: { type: Boolean, default: false },
    showCustomBadges: { type: Boolean, default: true },
  },

  // ─── CONVERSION ENHANCERS ────────────────────────────────────────────
  conversionEnhancers: {
    // Social proof toasts
    socialProofToasts: {
      enabled: { type: Boolean, default: true },
      intervalMs: { type: Number, default: 7500 },
      initialDelayMs: { type: Number, default: 3000 },
      displayDurationMs: { type: Number, default: 3800 },
      messages: {
        type: [socialProofMessageSchema],
        default: [{
          template: '{name} from {city} {action}',
          names: ['Tatenda M.', 'Chipo K.', 'Blessing T.', 'Simba D.', 'Rudo C.', 'Farai N.'],
          cities: ['Harare', 'Bulawayo', 'Mutare', 'Gweru', 'Masvingo', 'Chitungwiza'],
          actions: ['just added this to cart', 'is viewing this item', 'just purchased', 'added to cart'],
          avatars: ['👦🏾', '👩🏾', '👦🏿', '🧑🏿', '👩🏿', '🧑🏾'],
          enabled: true,
        }],
      },
    },

    // Urgency indicators
    urgency: {
      enabled: { type: Boolean, default: true },
      showLowStockWarning: { type: Boolean, default: true },
      lowStockMessage: { type: String, default: 'Only {count} units left — order soon!' },
      showViewerCount: { type: Boolean, default: true },
      viewerCountMessage: { type: String, default: '{count} people viewing this right now' },
      viewerCountMin: { type: Number, default: 3 },
      viewerCountMax: { type: Number, default: 18 },
      showRecentPurchaseCount: { type: Boolean, default: true },
      recentPurchaseMessage: { type: String, default: '{count} sold in last 24 hours' },
      recentPurchaseMin: { type: Number, default: 5 },
      recentPurchaseMax: { type: Number, default: 42 },
    },

    // Countdown timer (for sale products)
    countdownTimer: {
      enabled: { type: Boolean, default: false },
      label: { type: String, default: '⏱ Sale ends in:' },
      endDate: { type: Date, default: null },
      showOnSaleOnly: { type: Boolean, default: true },
    },

    // Exit intent popup
    exitIntent: {
      enabled: { type: Boolean, default: true },
      title: { type: String, default: "Wait! Don't go yet" },
      subtitle: { type: String, default: "Grab this exclusive discount before you leave!" },
      couponCode: { type: String, default: 'ZIM15' },
      discountText: { type: String, default: 'Claim 15% Off Now' },
      expirySeconds: { type: Number, default: 480 },
    },

    // Progress bar (spend X more for free shipping)
    freeShippingBar: {
      enabled: { type: Boolean, default: true },
      threshold: { type: Number, default: 100 },
      message: { type: String, default: 'Spend {remaining} more for FREE shipping!' },
      completedMessage: { type: String, default: '🎉 You qualify for FREE shipping!' },
    },

    // Recently viewed
    recentlyViewed: {
      enabled: { type: Boolean, default: true },
      maxItems: { type: Number, default: 6 },
      showAsSection: { type: Boolean, default: true },
    },

    // Sticky mobile add-to-cart bar
    stickyMobileBar: {
      enabled: { type: Boolean, default: true },
      showPrice: { type: Boolean, default: true },
      showImage: { type: Boolean, default: true },
      showRating: { type: Boolean, default: false },
    },

    // Price match guarantee badge
    priceMatchGuarantee: {
      enabled: { type: Boolean, default: false },
      text: { type: String, default: 'Price Match Guarantee — found it cheaper? We\'ll match it!' },
      icon: { type: String, default: '🏷️' },
    },

    // Bulk discount teaser
    bulkDiscountTeaser: {
      enabled: { type: Boolean, default: false },
      tiers: [{
        qty: { type: Number },
        discountPercent: { type: Number },
        label: { type: String },
      }],
    },

    // Estimated savings per year
    annualSavingsCalculator: {
      enabled: { type: Boolean, default: false },
    },
  },

  // ─── FAKE / SEED DATA ──────────────────────────────────────────────
  fakeData: {
    enabled: { type: Boolean, default: false },
    reviewCountMin: { type: Number, default: 5 },
    reviewCountMax: { type: Number, default: 50 },
    ratingMin: { type: Number, default: 3 },
    ratingMax: { type: Number, default: 5 },
    viewCountMin: { type: Number, default: 100 },
    viewCountMax: { type: Number, default: 5000 },
    soldCountMin: { type: Number, default: 10 },
    soldCountMax: { type: Number, default: 500 },
    soldTextTemplate: { type: String, default: '{count}+ bought since yesterday' },
    viewTextTemplate: { type: String, default: '{count} people viewed this' },
  },

  // ─── REVIEWS SECTION CONFIG ──────────────────────────────────────────
  reviewsConfig: {
    showBarChart: { type: Boolean, default: true },
    showWriteReview: { type: Boolean, default: true },
    showVerifiedBadge: { type: Boolean, default: true },
    showPhotoReviews: { type: Boolean, default: true },
    showHelpfulVotes: { type: Boolean, default: true },
    sortDefault: { type: String, enum: ['newest', 'highest', 'lowest', 'helpful'], default: 'newest' },
    perPage: { type: Number, default: 5 },
  },

  // ─── SEO & STRUCTURED DATA ──────────────────────────────────────────
  seo: {
    enableJsonLd: { type: Boolean, default: true },
    enableOpenGraph: { type: Boolean, default: true },
    enableBreadcrumbSchema: { type: Boolean, default: true },
    enableProductSchema: { type: Boolean, default: true },
    enableFaqSchema: { type: Boolean, default: false },
  },

  // ─── MOBILE-SPECIFIC OVERRIDES ───────────────────────────────────────
  mobile: {
    galleryHeight: { type: String, default: '300px' },
    showAccordionSections: { type: Boolean, default: true },
    fullWidthButtons: { type: Boolean, default: true },
    showStickyBottomBar: { type: Boolean, default: true },
    compactProductInfo: { type: Boolean, default: false },
  },

  // ─── THEME / BRAND COLORS ───────────────────────────────────────────
  theme: {
    primaryColor: { type: String, default: '#1b5e35' },
    secondaryColor: { type: String, default: '#f5b800' },
    accentColor: { type: String, default: '#a8ffca' },
    dangerColor: { type: String, default: '#d93025' },
    textColor: { type: String, default: '#1a1a1a' },
    mutedColor: { type: String, default: '#76889a' },
    bgColor: { type: String, default: '#f6f7f8' },
    cardBg: { type: String, default: '#ffffff' },
    borderColor: { type: String, default: '#e5eae6' },
    headingFont: { type: String, default: "'Syne', sans-serif" },
    bodyFont: { type: String, default: "'DM Sans', sans-serif" },
    borderRadius: { type: Number, default: 0 }, // 0 = sharp corners (Walmart style)
  },

}, {
  timestamps: true,
});

// Ensure only one document exists (singleton pattern)
productPageSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('ProductPageSettings', productPageSettingsSchema);
