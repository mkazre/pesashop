module.exports = {
  // User Roles
  USER_ROLES: {
    CUSTOMER: 'customer',
    SHOP_MANAGER: 'shop_manager',
    ADMIN: 'admin'
  },

  // Order Status
  ORDER_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    ON_HOLD: 'on-hold',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    REFUNDED: 'refunded',
    FAILED: 'failed'
  },

  // Payment Status
  PAYMENT_STATUS: {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded'
  },

  // Stock Status
  STOCK_STATUS: {
    IN_STOCK: 'in_stock',
    OUT_OF_STOCK: 'out_of_stock',
    ON_BACKORDER: 'on_backorder'
  },

  // Product Types
  PRODUCT_TYPES: {
    SIMPLE: 'simple',
    VARIABLE: 'variable',
    GROUPED: 'grouped',
    EXTERNAL: 'external'
  },

  // Laybye Status
  LAYBYE_STATUS: {
    ACTIVE: 'active',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DEFAULTED: 'defaulted'
  },

  // Laybye Frequency
  LAYBYE_FREQUENCY: {
    WEEKLY: 'weekly',
    BIWEEKLY: 'biweekly',
    MONTHLY: 'monthly'
  },

  // Coupon Types
  COUPON_TYPES: {
    PERCENTAGE: 'percentage',
    FIXED: 'fixed',
    FREE_SHIPPING: 'free_shipping',
    BOGO: 'bogo',
    FIXED_PRODUCT: 'fixed_product'
  },

  // Email Template Types
  EMAIL_TYPES: {
    ORDER_CONFIRMATION: 'order_confirmation',
    ORDER_SHIPPED: 'order_shipped',
    ORDER_COMPLETED: 'order_completed',
    ORDER_CANCELLED: 'order_cancelled',
    NEW_CUSTOMER: 'new_customer',
    PASSWORD_RESET: 'password_reset',
    LAYBYE_REMINDER: 'laybye_reminder',
    LOYALTY_REWARD: 'loyalty_reward',
    COUPON_FIRST_PURCHASE: 'coupon_first_purchase',
    COUPON_NEW_USER: 'coupon_new_user',
    COUPON_SPENDING_MILESTONE: 'coupon_spending_milestone',
    COUPON_BIRTHDAY: 'coupon_birthday',
    REVIEW_REMINDER: 'review_reminder',
    CUSTOM: 'custom'
  },

  // PESA Coin Types
  LOYALTY_TYPES: {
    EARNED: 'earned',
    REDEEMED: 'redeemed',
    EXPIRED: 'expired',
    ADJUSTED: 'adjusted',
    // Extra Points
    SIGNUP_BONUS: 'signup_bonus',
    DAILY_LOGIN: 'daily_login',
    PROFILE_COMPLETE: 'profile_complete',
    REFERRAL_REGISTRATION: 'referral_registration',
    REFERRAL_PURCHASE: 'referral_purchase',
    TOP_CUSTOMER: 'top_customer',
    LEVEL_ACHIEVEMENT: 'level_achievement',
    BIRTHDAY_BONUS: 'birthday_bonus',
    REVIEW_BONUS: 'review_bonus',
    ORDER_COUNT_BONUS: 'order_count_bonus',
    CART_TOTAL_BONUS: 'cart_total_bonus',
    TOTAL_SPENT_BONUS: 'total_spent_bonus',
    SHARED_OUT: 'shared_out',
    SHARED_IN: 'shared_in',
    CONVERTED: 'converted'
  },

  // Code Snippet Locations
  SNIPPET_LOCATIONS: {
    HEADER: 'header',
    FOOTER: 'footer',
    BODY_START: 'body_start',
    BODY_END: 'body_end',
    SHOP: 'shop',
    PRODUCT: 'product',
    CATEGORY: 'category',
    CHECKOUT: 'checkout'
  },

  // Page Builder Types
  BUILDER_TYPES: {
    WEB: 'web',
    APP: 'app'
  },

  // Address Types
  ADDRESS_TYPES: {
    BILLING: 'billing',
    SHIPPING: 'shipping'
  },

  // Default Settings
  DEFAULTS: {
    CURRENCY: 'ZAR',
    LANGUAGE: 'en',
    ITEMS_PER_PAGE: 20,
    MAX_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
    IMAGE_QUALITY: 90,
    WATERMARK_SIZE: 0.2,
    LOYALTY_POINTS_PER_RAND: 1,
    LOYALTY_REDEMPTION_RATE: 0.1,
    MIN_REDEMPTION_POINTS: 100
  },

  // Price Rule Types
  PRICE_RULE_TYPES: {
    FIXED: 'fixed',
    PERCENTAGE: 'percentage',
    BOGO: 'bogo',
    TIERED: 'tiered'
  },

  // Customer Groups
  CUSTOMER_GROUPS: {
    RETAIL: 'retail',
    WHOLESALE: 'wholesale',
    VIP: 'vip',
    DISTRIBUTOR: 'distributor'
  },

  // Shipping Status
  SHIPPING_STATUS: {
    CREATED: 'created',
    PACKED: 'packed',
    DISPATCHED_FROM_HUB: 'dispatched_from_hub',
    OUT_FOR_DELIVERY: 'out_for_delivery',
    RECEIVED_AT_HUB: 'received_at_hub',
    WITH_DELIVERY_DRIVER: 'with_delivery_driver',
    DELIVERED: 'delivered',
    COLLECTED: 'collected',
    CANCELLED: 'cancelled'
  },

  // Shipping Types
  SHIPPING_TYPES: {
    DELIVERY: 'delivery',
    HUB_COLLECTION: 'hub_collection'
  },

  // Shipping Event Types
  SHIPPING_EVENT_TYPES: {
    CREATED: 'created',
    STATUS_CHANGE: 'status_change',
    PHOTO_UPLOADED: 'photo_uploaded',
    SCAN_OUT: 'scan_out',
    SCAN_IN: 'scan_in',
    POD_CAPTURED: 'pod_captured',
    NOTE_ADDED: 'note_added',
    CANCELLED: 'cancelled'
  }
};
