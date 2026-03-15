const mongoose = require('mongoose');

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const sidebarWidgetSchema = new mongoose.Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  collapsed: { type: Boolean, default: false },
}, { _id: false });

const deliveryLocationSchema = new mongoose.Schema({
  label: { type: String, required: true },
  estimateDays: { type: String, default: '2-5 days' },
  enabled: { type: Boolean, default: true },
}, { _id: false });

// ── Main Schema ──────────────────────────────────────────────────────────────

const productArchiveSettingsSchema = new mongoose.Schema({

  // ─── LAYOUT ────────────────────────────────────────────────────────────────
  layout: {
    type: { type: String, enum: ['sidebar-left', 'sidebar-right', 'full-width'], default: 'sidebar-left' },
    sidebarWidth: { type: String, default: '280px' },
    contentGap: { type: Number, default: 24 },
    containerMaxWidth: { type: String, default: '1400px' },
    stickyFilters: { type: Boolean, default: true },
  },

  // ─── PAGE HEADER / BANNER ─────────────────────────────────────────────────
  pageHeader: {
    enabled: { type: Boolean, default: true },
    showBreadcrumbs: { type: Boolean, default: true },
    showTitle: { type: Boolean, default: true },
    showProductCount: { type: Boolean, default: true },
    showDescription: { type: Boolean, default: true },
    // Category banner (when viewing a specific category)
    showCategoryBanner: { type: Boolean, default: true },
    bannerHeight: { type: String, default: '220px' },
    bannerOverlayColor: { type: String, default: 'rgba(0,0,0,0.45)' },
    bannerTextColor: { type: String, default: '#ffffff' },
    bannerTitleSize: { type: Number, default: 32 },
    bannerDescriptionSize: { type: Number, default: 14 },
    // Default banner for shop page (when no category selected)
    defaultBannerImage: { type: String, default: '' },
    defaultBannerTitle: { type: String, default: 'Our Products' },
    defaultBannerDescription: { type: String, default: 'Browse our full range of products' },
  },

  // ─── TOOLBAR ───────────────────────────────────────────────────────────────
  toolbar: {
    enabled: { type: Boolean, default: true },
    showResultCount: { type: Boolean, default: true },
    showSortDropdown: { type: Boolean, default: true },
    showViewToggle: { type: Boolean, default: true },
    showPerPageSelector: { type: Boolean, default: true },
    sortOptions: {
      type: [String],
      default: ['featured', 'newest', 'price-low', 'price-high', 'name-az', 'name-za', 'rating', 'best-selling'],
    },
    defaultSort: { type: String, default: 'featured' },
    defaultView: { type: String, enum: ['grid', 'list'], default: 'grid' },
    perPageOptions: {
      type: [Number],
      default: [12, 24, 36, 48],
    },
    defaultPerPage: { type: Number, default: 12 },
  },

  // ─── PRODUCT GRID ─────────────────────────────────────────────────────────
  productGrid: {
    // Grid columns
    columnsDesktop: { type: Number, default: 3, min: 2, max: 6 },
    columnsTablet: { type: Number, default: 2, min: 1, max: 4 },
    columnsMobile: { type: Number, default: 2, min: 1, max: 3 },
    gap: { type: Number, default: 16 },
    // Card aspect ratio
    imageAspectRatio: { type: String, enum: ['square', '4:3', '3:4', '16:9', 'auto'], default: 'square' },
    imageObjectFit: { type: String, enum: ['cover', 'contain'], default: 'cover' },
    // Hover effect
    hoverEffect: { type: String, enum: ['zoom', 'swap-image', 'overlay', 'none'], default: 'zoom' },
    hoverImageIndex: { type: Number, default: 1 },
  },

  // ─── PRODUCT CARD ─────────────────────────────────────────────────────────
  productCard: {
    // Title
    showTitle: { type: Boolean, default: true },
    titleLines: { type: Number, default: 2, min: 1, max: 4 },
    titleFontSize: { type: Number, default: 14 },
    titleFontWeight: { type: String, default: '500' },
    // Price
    showPrice: { type: Boolean, default: true },
    showOriginalPrice: { type: Boolean, default: true },
    showDiscountBadge: { type: Boolean, default: true },
    priceFontSize: { type: Number, default: 16 },
    salePriceColor: { type: String, default: '#dc2626' },
    // Rating
    showRating: { type: Boolean, default: true },
    showReviewCount: { type: Boolean, default: true },
    ratingSize: { type: String, enum: ['xs', 'sm', 'md'], default: 'sm' },
    // Stock
    showStock: { type: Boolean, default: true },
    showStockCount: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 5 },
    // Description (list view only)
    showDescription: { type: Boolean, default: true },
    descriptionLines: { type: Number, default: 2 },
    // Category label
    showCategory: { type: Boolean, default: true },
    // Brand
    showBrand: { type: Boolean, default: false },
    // SKU
    showSKU: { type: Boolean, default: false },
    // Badges (from badge module)
    showBadges: { type: Boolean, default: true },
    badgePosition: { type: String, enum: ['top-left', 'top-right', 'bottom-left', 'bottom-right'], default: 'top-left' },
    showSaleBadge: { type: Boolean, default: true },
    showNewBadge: { type: Boolean, default: true },
    showOutOfStockBadge: { type: Boolean, default: true },
    // Layby indicator
    showLaybyIndicator: { type: Boolean, default: true },
    laybyIndicatorText: { type: String, default: 'Layby Available' },
    laybyIndicatorColor: { type: String, default: '#f59e0b' },
    // Delivery estimate
    showDeliveryEstimate: { type: Boolean, default: true },
    deliveryEstimateText: { type: String, default: 'Delivers in {days}' },
    defaultDeliveryDays: { type: String, default: '2-5 days' },
    deliveryLocations: {
      type: [deliveryLocationSchema],
      default: [
        { label: 'Harare', estimateDays: '1-2 days', enabled: true },
        { label: 'Bulawayo', estimateDays: '2-3 days', enabled: true },
        { label: 'Other cities', estimateDays: '3-5 days', enabled: true },
      ],
    },
    // Quick actions (hover buttons)
    showAddToCart: { type: Boolean, default: true },
    showQuickView: { type: Boolean, default: true },
    showWishlistButton: { type: Boolean, default: true },
    showCompareButton: { type: Boolean, default: true },
    quickActionsPosition: { type: String, enum: ['overlay-right', 'overlay-top', 'below-image', 'on-hover-bottom'], default: 'overlay-right' },
    // Add to cart style
    addToCartStyle: { type: String, enum: ['button', 'icon', 'hover-bar', 'always-visible'], default: 'hover-bar' },
    addToCartText: { type: String, default: 'Add to Cart' },
  },

  // ─── SIDEBAR / FILTERS ────────────────────────────────────────────────────
  sidebar: {
    enabled: { type: Boolean, default: true },
    widgets: {
      type: [sidebarWidgetSchema],
      default: [
        { id: 'categories', label: 'Categories', enabled: true, order: 0, collapsed: false },
        { id: 'priceRange', label: 'Price Range', enabled: true, order: 1, collapsed: false },
        { id: 'brands', label: 'Brands', enabled: true, order: 2, collapsed: false },
        { id: 'rating', label: 'Rating', enabled: true, order: 3, collapsed: true },
        { id: 'colors', label: 'Colors', enabled: false, order: 4, collapsed: true },
        { id: 'sizes', label: 'Sizes', enabled: false, order: 5, collapsed: true },
        { id: 'tags', label: 'Tags', enabled: false, order: 6, collapsed: true },
        { id: 'newProducts', label: 'New Products', enabled: true, order: 7, collapsed: false },
        { id: 'sidebarBanner', label: 'Promo Banner', enabled: false, order: 8, collapsed: false },
      ],
    },
    // Price range slider
    priceRangeType: { type: String, enum: ['slider', 'inputs', 'both'], default: 'both' },
    // Category display
    categoryDisplayType: { type: String, enum: ['checkbox', 'list', 'accordion'], default: 'checkbox' },
    showCategoryCount: { type: Boolean, default: true },
    showCategoryIcon: { type: Boolean, default: true },
    showSubcategories: { type: Boolean, default: true },
    // New products widget
    newProductsCount: { type: Number, default: 3 },
    // Sidebar promo banner
    sidebarBannerImage: { type: String, default: '' },
    sidebarBannerLink: { type: String, default: '' },
    sidebarBannerText: { type: String, default: '' },
  },

  // ─── PAGINATION ────────────────────────────────────────────────────────────
  pagination: {
    type: { type: String, enum: ['numbered', 'load-more', 'infinite-scroll'], default: 'numbered' },
    showPageNumbers: { type: Boolean, default: true },
    showPrevNext: { type: Boolean, default: true },
    maxPageButtons: { type: Number, default: 5 },
    scrollToTop: { type: Boolean, default: true },
    loadMoreText: { type: String, default: 'Load More Products' },
  },

  // ─── COMPARE ───────────────────────────────────────────────────────────────
  compare: {
    enabled: { type: Boolean, default: true },
    maxItems: { type: Number, default: 4 },
    showFloatingBar: { type: Boolean, default: true },
    floatingBarPosition: { type: String, enum: ['bottom', 'bottom-right'], default: 'bottom' },
    // Which fields to show in compare table
    compareFields: {
      type: [String],
      default: ['image', 'name', 'price', 'rating', 'description', 'stock', 'brand', 'category', 'specifications', 'addToCart', 'remove'],
    },
  },

  // ─── CATEGORY SHOWCASE ─────────────────────────────────────────────────────
  categoryShowcase: {
    enabled: { type: Boolean, default: true },
    displayType: { type: String, enum: ['carousel', 'grid', 'list', 'icon-grid'], default: 'carousel' },
    showIcon: { type: Boolean, default: true },
    showName: { type: Boolean, default: true },
    showCount: { type: Boolean, default: true },
    showDescription: { type: Boolean, default: false },
    columnsDesktop: { type: Number, default: 6 },
    columnsTablet: { type: Number, default: 4 },
    columnsMobile: { type: Number, default: 3 },
    iconSize: { type: Number, default: 64 },
    cardStyle: { type: String, enum: ['minimal', 'bordered', 'elevated', 'filled'], default: 'bordered' },
    showOnShopPage: { type: Boolean, default: true },
    position: { type: String, enum: ['above-products', 'below-banner', 'in-sidebar'], default: 'below-banner' },
  },

  // ─── SEARCH RESULTS ────────────────────────────────────────────────────────
  searchResults: {
    showSearchTerm: { type: Boolean, default: true },
    showSuggestions: { type: Boolean, default: true },
    noResultsMessage: { type: String, default: 'No products found for your search. Try different keywords.' },
    showRelatedCategories: { type: Boolean, default: true },
  },

  // ─── EMPTY STATE ───────────────────────────────────────────────────────────
  emptyState: {
    icon: { type: String, default: '🔍' },
    title: { type: String, default: 'No products found' },
    message: { type: String, default: 'Try adjusting your filters or search terms' },
    showClearFiltersButton: { type: Boolean, default: true },
  },

  // ─── MOBILE ────────────────────────────────────────────────────────────────
  mobile: {
    filterDrawerPosition: { type: String, enum: ['left', 'right', 'bottom'], default: 'left' },
    showStickyFilterBar: { type: Boolean, default: true },
    stickyBarItems: {
      type: [String],
      default: ['filter', 'sort', 'view'],
    },
    showBackToTop: { type: Boolean, default: true },
  },

  // ─── THEME ─────────────────────────────────────────────────────────────────
  theme: {
    primaryColor: { type: String, default: '#1b5e35' },
    accentColor: { type: String, default: '#f59e0b' },
    cardBackground: { type: String, default: '#ffffff' },
    cardBorderColor: { type: String, default: '#e5e7eb' },
    cardBorderRadius: { type: Number, default: 8 },
    cardShadow: { type: String, enum: ['none', 'sm', 'md', 'lg'], default: 'sm' },
    hoverShadow: { type: String, enum: ['none', 'sm', 'md', 'lg', 'xl'], default: 'lg' },
    sidebarBackground: { type: String, default: '#ffffff' },
    toolbarBackground: { type: String, default: '#ffffff' },
    fontFamily: { type: String, default: 'inherit' },
  },

}, {
  timestamps: true,
  collection: 'productarchivesettings',
});

// ── Singleton pattern ────────────────────────────────────────────────────────
productArchiveSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('ProductArchiveSettings', productArchiveSettingsSchema);
