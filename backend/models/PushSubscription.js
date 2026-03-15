const mongoose = require('mongoose');

const PushSubscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Platform type
  platform: {
    type: String,
    enum: ['web', 'ios', 'android', 'expo'],
    required: true
  },

  // Web Push (VAPID) subscription
  webPush: {
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String,
    }
  },

  // Expo push token (for React Native mobile app)
  expoPushToken: String,

  // Device info
  deviceName: String,
  deviceId: String,     // Unique device identifier to prevent duplicates
  userAgent: String,
  appVersion: String,

  // Status
  active: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now },

  // Notification preferences per device
  preferences: {
    promotions: { type: Boolean, default: true },
    orderUpdates: { type: Boolean, default: true },
    announcements: { type: Boolean, default: true },
    reminders: { type: Boolean, default: true },
  }

}, { timestamps: true });

PushSubscriptionSchema.index({ user: 1, platform: 1 });
PushSubscriptionSchema.index({ user: 1, deviceId: 1 }, { unique: true, sparse: true });
PushSubscriptionSchema.index({ expoPushToken: 1 }, { sparse: true });
PushSubscriptionSchema.index({ 'webPush.endpoint': 1 }, { sparse: true });
PushSubscriptionSchema.index({ active: 1 });

module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
