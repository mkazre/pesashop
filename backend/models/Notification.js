const mongoose = require('mongoose');

// ─── User Notification (per-user tracking for in-app bell) ───
const UserNotificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  notification: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Notification',
    required: true
  },
  read: { type: Boolean, default: false },
  readAt: Date,
  delivered: { type: Boolean, default: false },
  deliveredAt: Date,
  clicked: { type: Boolean, default: false },
  clickedAt: Date,
  dismissed: { type: Boolean, default: false },
  dismissedAt: Date,
  channels: {
    inApp: { sent: { type: Boolean, default: false }, sentAt: Date },
    webPush: { sent: { type: Boolean, default: false }, sentAt: Date, error: String },
    mobilePush: { sent: { type: Boolean, default: false }, sentAt: Date, error: String },
  }
}, { timestamps: true });

UserNotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
UserNotificationSchema.index({ user: 1, notification: 1 }, { unique: true });
UserNotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90-day TTL

const UserNotification = mongoose.model('UserNotification', UserNotificationSchema);

// ─── Main Notification ───
const NotificationSchema = new mongoose.Schema({
  // Content
  title: { type: String, required: true, maxlength: 200 },
  body: { type: String, required: true, maxlength: 1000 },
  image: String, // Hero/banner image URL
  icon: String,  // Small icon URL (defaults to store logo)

  // Type & categorization
  type: {
    type: String,
    enum: ['promotion', 'product', 'order_update', 'announcement', 'coupon', 'reminder', 'custom'],
    default: 'custom'
  },

  // Action (deep link)
  actionUrl: String,    // e.g. "/product/nike-air-max" or "/shop?category=electronics"
  actionLabel: String,  // e.g. "Shop Now", "View Order"

  // Secondary action (optional)
  secondaryActionUrl: String,
  secondaryActionLabel: String,

  // Targeting
  targetAudience: {
    type: String,
    enum: ['all', 'segment', 'individual'],
    default: 'all'
  },
  targetUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  targetSegment: {
    // Flexible segment filters
    customerGroup: String,           // e.g. 'wholesale', 'retail'
    registeredAfter: Date,
    registeredBefore: Date,
    lastOrderAfter: Date,
    lastOrderBefore: Date,
    minOrderCount: Number,
    maxOrderCount: Number,
    minTotalSpent: Number,
    maxTotalSpent: Number,
    hasLaybye: Boolean,
    tags: [String],
  },

  // Delivery channels
  channels: {
    inApp: { type: Boolean, default: true },
    webPush: { type: Boolean, default: true },
    mobilePush: { type: Boolean, default: true },
  },

  // Scheduling
  scheduledAt: Date,   // null = send immediately when status changes to 'sent'
  sentAt: Date,
  expiresAt: Date,     // When the notification disappears from bell

  // Status
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed'],
    default: 'draft'
  },

  // Stats
  stats: {
    targeted: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },

  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Priority (for ordering and push notification priority)
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },

  // Optional: link to specific entities
  relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  relatedCoupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },

}, { timestamps: true });

NotificationSchema.index({ status: 1, scheduledAt: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ type: 1, status: 1 });

module.exports = { Notification: mongoose.model('Notification', NotificationSchema), UserNotification };
