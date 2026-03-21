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
  icon: { type: String, default: '🚚' },
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
    ],
  },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },

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
