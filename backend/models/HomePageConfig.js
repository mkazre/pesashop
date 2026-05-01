const mongoose = require('mongoose');

// ── Slide schema for hero sliders ──────────────────────────────────
const slideSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  heading: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  buttonText: { type: String, default: 'Shop Now' },
  buttonLink: { type: String, default: '/shop' },
  overlayColor: { type: String, default: '#000000' },
  overlayOpacity: { type: Number, default: 0, min: 0, max: 100 },
  textColor: { type: String, default: '#ffffff' },
  textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'left' },
}, { _id: true });

// ── Banner item schema ─────────────────────────────────────────────
const bannerItemSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  heading: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  label: { type: String, default: '' },
  buttonText: { type: String, default: 'Shop Now' },
  buttonLink: { type: String, default: '/shop' },
  textColor: { type: String, default: '#333333' },
  overlayColor: { type: String, default: '#000000' },
  overlayOpacity: { type: Number, default: 0, min: 0, max: 100 },
}, { _id: true });

// ── Feature item schema ────────────────────────────────────────────
const featureItemSchema = new mongoose.Schema({
  // emoji string OR { type: 'emoji'|'icon'|'image', value }
  icon: { type: mongoose.Schema.Types.Mixed, default: '🚚' },
  iconImage: { type: String, default: '' },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  color: { type: String, default: '#1b5e35' },
}, { _id: true });

// ── Product column schema (for ProductColumnsGrid) ─────────────────
const productColumnSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  source: { type: String, enum: ['best-selling', 'trending', 'newest', 'top-rated', 'featured', 'sale', 'category'], default: 'newest' },
  categoryId: { type: String, default: '' },
  limit: { type: Number, default: 3 },
}, { _id: true });

// ── Tab item schema (for ProductGridTabs / ProductCarouselTabs) ────
const tabItemSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  source: { type: String, enum: ['all', 'featured', 'sale', 'newest', 'best-selling', 'top-rated', 'trending', 'category'], default: 'all' },
  categoryId: { type: String, default: '' },
}, { _id: true });

// ── Gift section schema (for GiftSectionCarousel) ─────────────────
// Each section is a card with a title + a 2x2 grid of products. Multiple
// sections sit side-by-side and the whole row paginates as a carousel.
const giftSectionSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  // emoji string OR { type, value } via SmartIcon (see iconCatalog)
  icon: { type: mongoose.Schema.Types.Mixed, default: '' },
  source: {
    type: String,
    enum: ['manual', 'category', 'featured', 'sale', 'newest', 'best-selling', 'top-rated', 'trending'],
    default: 'newest',
  },
  productIds: [{ type: String }],     // for source: 'manual'
  categoryId: { type: String, default: '' },     // for source: 'category'
  productLimit: { type: Number, default: 4 },
  viewAllLink: { type: String, default: '' },
  viewAllText: { type: String, default: 'View all' },
  // Optional per-section background to mimic the screenshot's tinted card top
  headerBgColor: { type: String, default: '#f3f4f6' },
}, { _id: true });

// ── Coupon item schema ─────────────────────────────────────────────
const couponItemSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
  validText: { type: String, default: '' },
  code: { type: String, default: '' },
  bgColor: { type: String, default: '#0F604B' },
  textColor: { type: String, default: '#ffffff' },
}, { _id: true });

// ── Block schema ───────────────────────────────────────────────────
const blockSchema = new mongoose.Schema({
  blockType: {
    type: String,
    required: true,
    enum: [
      'hero-slider-full',
      'hero-slider-with-side-banner',
      'hero-slider-with-sidebar',
      'banner-grid-3col',
      'banner-full-width',
      'banner-grid-2col',
      'banner-sidebar-promo',
      'product-grid-tabs',
      'product-carousel-tabs',
      'deals-of-the-day',
      'product-columns-grid',
      'category-carousel',
      'feature-icons-row',
      'spacer',
      'rich-text',
      'custom-html',
      'custom-template',
      'banner-slider-carousel',
      'coupon-carousel',
      'product-with-deal-sidebar',
      'offer-strip',
      'blog-carousel',
      'newsletter',
      'category-grid',
      'product-vertical-tabs',
      'image-text-cta',
      'gift-section-carousel',
    ],
  },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },

  // ── Visibility & Responsive ──
  visibility: {
    desktop: { type: Boolean, default: true },
    tablet: { type: Boolean, default: true },
    mobile: { type: Boolean, default: true },
  },
  platform: {
    web: { type: Boolean, default: true },
    mobileApp: { type: Boolean, default: true },
  },
  responsive: {
    desktopColumns: { type: Number, default: 0 },   // 0 = use block default
    tabletColumns: { type: Number, default: 0 },
    mobileColumns: { type: Number, default: 0 },
  },

  // ── Custom Template (Page Builder) ──
  templateId: { type: String, default: '' },

  // ── Shared settings ──
  sectionTitle: { type: String, default: '' },
  sectionSubtitle: { type: String, default: '' },
  showSectionTitle: { type: Boolean, default: true },
  viewAllLink: { type: String, default: '/shop' },
  viewAllText: { type: String, default: 'View All' },
  showViewAll: { type: Boolean, default: false },
  containerWidth: { type: String, enum: ['full', 'contained'], default: 'contained' },
  backgroundColor: { type: String, default: '' },
  paddingTop: { type: String, default: '40px' },
  paddingBottom: { type: String, default: '40px' },

  // ── Typography ──
  sectionTitleSize: { type: String, default: '24px' },
  sectionSubtitleSize: { type: String, default: '14px' },
  sectionTitleColor: { type: String, default: '' },
  sectionSubtitleColor: { type: String, default: '' },

  // ── Color Customization ──
  primaryColor: { type: String, default: '#0F604B' },
  textColor: { type: String, default: '' },
  buttonBgColor: { type: String, default: '#0F604B' },
  buttonTextColor: { type: String, default: '#ffffff' },
  buttonHoverBgColor: { type: String, default: '#0a4a39' },
  priceColor: { type: String, default: '#0F604B' },
  tabActiveColor: { type: String, default: '#0F604B' },
  linkColor: { type: String, default: '#0F604B' },

  // ── Hero Slider settings ──
  slides: [slideSchema],
  sliderAutoplay: { type: Boolean, default: true },
  sliderSpeed: { type: Number, default: 5000 },
  sliderEffect: { type: String, enum: ['slide', 'fade'], default: 'slide' },
  sliderHeight: { type: String, default: '450px' },
  sliderBorderRadius: { type: String, default: '12px' },
  showArrows: { type: Boolean, default: true },
  showDots: { type: Boolean, default: true },

  // ── Hero Slider with Side Banner ──
  sideBannerImage: { type: String, default: '' },
  sideBannerHeading: { type: String, default: '' },
  sideBannerButtonText: { type: String, default: 'Shop Now' },
  sideBannerButtonLink: { type: String, default: '/shop' },
  sideBannerTextColor: { type: String, default: '#333333' },
  sideBannerOverlayColor: { type: String, default: '#000000' },
  sideBannerOverlayOpacity: { type: Number, default: 0, min: 0, max: 100 },

  // ── Banner blocks ──
  banners: [bannerItemSchema],

  // ── Product display settings ──
  productSource: { type: String, enum: ['all', 'featured', 'sale', 'newest', 'best-selling', 'top-rated', 'trending', 'category'], default: 'featured' },
  productCategoryId: { type: String, default: '' },
  productLimit: { type: Number, default: 10 },
  productColumns: { type: Number, default: 5 },
  tabs: [tabItemSchema],
  showAddToCart: { type: Boolean, default: true },
  showWishlist: { type: Boolean, default: true },
  showQuickView: { type: Boolean, default: true },
  showRating: { type: Boolean, default: true },

  // ── Product Card Settings ──
  cardTitleClamp: { type: Number, default: 2 },
  cardTitleSize: { type: String, default: '14px' },
  cardPriceSize: { type: String, default: '16px' },
  cardCategorySize: { type: String, default: '12px' },
  cardEqualHeight: { type: Boolean, default: true },
  cardButtonText: { type: String, default: 'View Product' },
  showSaleBadge: { type: Boolean, default: true },
  showPercentOff: { type: Boolean, default: true },

  // ── Badge Assignment ──
  badgeIds: [{ type: String }],
  showBadges: { type: Boolean, default: true },

  // ── Deals settings ──
  dealsEndDate: { type: String, default: '' },
  showCountdown: { type: Boolean, default: true },

  // ── Product Columns Grid ──
  columns: [productColumnSchema],

  // ── Category Carousel ──
  categorySource: { type: String, enum: ['all', 'manual', 'top'], default: 'all' },
  categoryIds: [{ type: String }],
  categoryLimit: { type: Number, default: 10 },
  categoryColumns: { type: Number, default: 10 },
  showCategoryProductCount: { type: Boolean, default: true },

  // ── Feature Icons Row ──
  features: [featureItemSchema],

  // ── Spacer ──
  spacerHeight: { type: String, default: '40px' },

  // ── Rich Text / Custom HTML ──
  content: { type: String, default: '' },

  // ── Banner Slider Carousel ──
  slidesToShow: { type: Number, default: 4 },
  autoplay: { type: Boolean, default: true },
  autoplaySpeed: { type: Number, default: 4000 },
  bannerHeight: { type: String, default: '200px' },
  bannerBorderRadius: { type: String, default: '12px' },

  // ── Coupon / Offer Carousel ──
  coupons: [couponItemSchema],

  // ── Product with Deal Sidebar ──
  dealEnabled: { type: Boolean, default: true },
  dealTitle: { type: String, default: 'Special Offer' },
  dealBadgeText: { type: String, default: 'Hot Deal' },
  dealProductSource: { type: String, enum: ['featured', 'sale', 'best-selling', 'newest', 'trending', 'all'], default: 'featured' },
  dealPosition: { type: String, enum: ['left', 'right'], default: 'right' },

  // ── Offer Strip / Marquee ──
  stripText: { type: String, default: '' },
  highlightText: { type: String, default: '' },
  stripBgColor: { type: String, default: '#0F604B' },
  stripTextColor: { type: String, default: '#ffffff' },
  stripHighlightColor: { type: String, default: '#f7bd20' },
  stripFontSize: { type: String, default: '18px' },
  stripLink: { type: String, default: '' },
  enableMarquee: { type: Boolean, default: false },
  marqueeSpeed: { type: Number, default: 30 },

  // ── Blog / Articles Carousel ──
  blogSource: { type: String, enum: ['latest', 'featured', 'popular'], default: 'latest' },
  blogLimit: { type: Number, default: 6 },
  showDate: { type: Boolean, default: true },
  showExcerpt: { type: Boolean, default: true },
  showReadMore: { type: Boolean, default: true },
  cardBorderRadius: { type: String, default: '12px' },

  // ── Newsletter Subscribe ──
  heading: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  buttonText: { type: String, default: '' },
  bgColor: { type: String, default: '' },
  bgImage: { type: String, default: '' },
  showIcon: { type: Boolean, default: true },

  // ── Category Grid ──
  showProductCount: { type: Boolean, default: true },
  showImage: { type: Boolean, default: true },
  cardStyle: { type: String, enum: ['card', 'circle', 'minimal'], default: 'card' },
  imageHeight: { type: String, default: '180px' },

  // ── Product Vertical Tabs ──
  showPrice: { type: Boolean, default: true },
  layout: { type: String, default: 'horizontal' },

  // ── Image + Text CTA Banner ──
  mainImage: { type: String, default: '' },
  sideImage: { type: String, default: '' },
  description: { type: String, default: '' },
  bulletPoints: [{ type: String }],
  buttonLink: { type: String, default: '' },
  textPosition: { type: String, enum: ['left', 'right', 'center'], default: 'right' },

  // ── Gift Section Carousel ──────────────────────────────────────────
  // The "Mother's Day gifts" style block: a heading + a horizontal carousel
  // of section cards, each with its own title and 2x2 product grid.
  giftSections: [giftSectionSchema],
  // How many sections are visible per slide at each breakpoint
  giftSectionsVisibleDesktop: { type: Number, default: 4, min: 1, max: 8 },
  giftSectionsVisibleTablet: { type: Number, default: 2, min: 1, max: 4 },
  giftSectionsVisibleMobile: { type: Number, default: 1, min: 1, max: 2 },
  // Inside each section card: how many products to show, in how many columns
  giftProductsPerSection: { type: Number, default: 4, min: 2, max: 8 },
  giftProductColumns: { type: Number, default: 2, min: 1, max: 4 },
  giftSectionGap: { type: String, default: '16px' },
  giftSectionPadding: { type: String, default: '12px' },
  giftSectionBorderRadius: { type: String, default: '8px' },
  giftSectionBorderColor: { type: String, default: '#e5e7eb' },
  giftSectionBorderWidth: { type: String, default: '1px' },
  giftSectionBgColor: { type: String, default: '#ffffff' },
  giftSectionTitleSize: { type: String, default: '14px' },
  giftSectionTitleWeight: { type: String, default: '700' },
  giftSectionTitleColor: { type: String, default: '#111827' },
  giftSectionViewAllColor: { type: String, default: '#0F604B' },
  giftAutoplay: { type: Boolean, default: false },
  giftAutoplayInterval: { type: Number, default: 5000 },
  giftShowArrows: { type: Boolean, default: true },
  giftShowDots: { type: Boolean, default: true },
  giftCardStyle: { type: String, enum: ['compact', 'detailed'], default: 'compact' },

}, { _id: true });

// ── Main config schema ─────────────────────────────────────────────
const homePageConfigSchema = new mongoose.Schema({
  blocks: [blockSchema],
  isPublished: { type: Boolean, default: true },
  lastPublishedAt: { type: Date },
}, {
  timestamps: true,
  collection: 'homepageconfig',
});

// Singleton: always get/create the one doc
homePageConfigSchema.statics.getConfig = async function () {
  let config = await this.findOne();
  if (!config) {
    config = await this.create({ blocks: [] });
  }
  return config;
};

module.exports = mongoose.model('HomePageConfig', homePageConfigSchema);
