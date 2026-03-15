const mongoose = require('mongoose');

/**
 * SiteEvent — Tracks all user interactions across the site.
 * Powers: trending products, popular items, hotspots, also-bought,
 *         search analytics, conversion funnels, and AI recommendations.
 */
const siteEventSchema = new mongoose.Schema({
  // Event type
  type: {
    type: String,
    required: true,
    enum: [
      'page_view',        // Any page loaded
      'product_view',     // Product detail page viewed
      'product_click',    // Product clicked from listing/search
      'category_view',    // Category page viewed
      'search',           // Search performed
      'search_click',     // Clicked a search result
      'add_to_cart',      // Added product to cart
      'remove_from_cart', // Removed from cart
      'add_to_wishlist',  // Added to wishlist
      'purchase',         // Order completed (one event per item)
      'button_click',     // Any tracked button click
      'mega_menu_click',  // Clicked in mega menu
      'quick_view',       // Opened quick view modal
      'compare_add',      // Added to compare
      'share',            // Shared a product
      'review_submit',    // Submitted a review
      'coupon_apply',     // Applied a coupon
      'exit_intent',      // Exit intent triggered
    ],
    index: true,
  },

  // What was interacted with
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  // User context
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  sessionId: { type: String, index: true }, // Anonymous session tracking
  userAgent: String,
  ip: String,

  // Page / navigation context
  page: String,          // URL path e.g. '/product/sony-tv'
  referrer: String,      // Where they came from
  pageTitle: String,     // Page title or product name

  // Search context
  searchQuery: String,   // What they searched for
  searchResultCount: Number,
  searchResultPosition: Number, // Position of clicked result

  // Button / element tracking
  elementId: String,     // DOM id or data attribute
  elementText: String,   // Button text or label
  elementSection: String, // Section of the page (header, footer, hero, etc.)

  // Revenue attribution
  revenue: Number,       // Purchase amount
  quantity: Number,      // For purchase/cart events

  // Extra metadata (flexible)
  metadata: mongoose.Schema.Types.Mixed,

  // Timestamp with TTL for automatic cleanup of old events
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: false, // We manage createdAt ourselves
  versionKey: false,
});

// Compound indexes for common aggregation queries
siteEventSchema.index({ type: 1, createdAt: -1 });
siteEventSchema.index({ type: 1, productId: 1, createdAt: -1 });
siteEventSchema.index({ type: 1, categoryId: 1, createdAt: -1 });
siteEventSchema.index({ type: 1, searchQuery: 1, createdAt: -1 });
siteEventSchema.index({ type: 1, page: 1, createdAt: -1 });
siteEventSchema.index({ sessionId: 1, type: 1, createdAt: -1 });

// TTL index: auto-delete events older than 90 days to keep collection lean
siteEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = mongoose.model('SiteEvent', siteEventSchema);
