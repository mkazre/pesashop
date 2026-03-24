const { Notification, UserNotification } = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const User = require('../models/User');
const Settings = require('../models/Settings');

let webpush;
try {
  webpush = require('web-push');
} catch (e) {
  console.warn('web-push not installed. Web push notifications disabled.');
}

class NotificationService {
  constructor() {
    this.vapidConfigured = false;
  }

  // ─── VAPID Setup ───
  async ensureVapidConfigured() {
    if (this.vapidConfigured || !webpush) return;
    try {
      const settings = await Settings.getSettings();
      const publicKey = settings.vapidPublicKey || process.env.VAPID_PUBLIC_KEY;
      const privateKey = settings.vapidPrivateKey || process.env.VAPID_PRIVATE_KEY;
      const email = settings.storeEmail || process.env.VAPID_EMAIL || 'admin@pesashop.com';

      if (publicKey && privateKey) {
        webpush.setVapidDetails(`mailto:${email}`, publicKey, privateKey);
        this.vapidConfigured = true;
      }
    } catch (err) {
      console.error('VAPID configuration error:', err.message);
    }
  }

  // ─── Resolve Target Users ───
  async resolveTargetUsers(notification) {
    let userQuery = {};

    if (notification.targetAudience === 'all') {
      userQuery = { role: { $in: ['customer', 'user'] } };
    } else if (notification.targetAudience === 'individual') {
      return notification.targetUsers || [];
    } else if (notification.targetAudience === 'segment') {
      const seg = notification.targetSegment || {};
      userQuery = { role: { $in: ['customer', 'user'] } };

      if (seg.customerGroup) userQuery.customerGroup = seg.customerGroup;
      if (seg.registeredAfter) userQuery.createdAt = { ...userQuery.createdAt, $gte: seg.registeredAfter };
      if (seg.registeredBefore) userQuery.createdAt = { ...userQuery.createdAt, $lte: seg.registeredBefore };
      if (seg.tags && seg.tags.length > 0) userQuery.tags = { $in: seg.tags };
      if (seg.hasLaybye !== undefined) userQuery.hasActiveLaybye = seg.hasLaybye;
    }

    const users = await User.find(userQuery).select('_id').lean();
    return users.map(u => u._id);
  }

  // ─── Send Notification (main orchestrator) ───
  async send(notificationId) {
    const notification = await Notification.findById(notificationId);
    if (!notification) throw new Error('Notification not found');
    if (notification.status === 'sent' || notification.status === 'sending') {
      throw new Error('Notification already sent or sending');
    }

    notification.status = 'sending';
    notification.sentAt = new Date();
    await notification.save();

    try {
      // Resolve target users
      const userIds = await this.resolveTargetUsers(notification);
      notification.stats.targeted = userIds.length;

      // Create UserNotification records in batches
      const batchSize = 500;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);

        // Create in-app notification records
        const userNotifOps = batch.map(userId => ({
          updateOne: {
            filter: { user: userId, notification: notification._id },
            update: {
              $setOnInsert: {
                user: userId,
                notification: notification._id,
                'channels.inApp': { sent: notification.channels.inApp, sentAt: notification.channels.inApp ? new Date() : undefined },
              }
            },
            upsert: true
          }
        }));

        if (userNotifOps.length > 0) {
          await UserNotification.bulkWrite(userNotifOps, { ordered: false }).catch(() => {});
        }

        // Send push notifications
        if (notification.channels.webPush || notification.channels.mobilePush) {
          const results = await this._sendPushBatch(batch, notification);
          totalSent += results.sent;
          totalFailed += results.failed;
        }

        if (notification.channels.inApp) {
          totalSent += batch.length;
        }
      }

      // Also send push to anonymous subscriptions (users not logged in but have app installed)
      if ((notification.channels.webPush || notification.channels.mobilePush) && notification.targetAudience === 'all') {
        const anonResults = await this._sendPushToAnonymousSubscriptions(notification);
        totalSent += anonResults.sent;
        totalFailed += anonResults.failed;
      }

      notification.stats.sent = totalSent;
      notification.stats.failed = totalFailed;
      notification.status = 'sent';
      await notification.save();

      return notification;
    } catch (error) {
      notification.status = 'failed';
      await notification.save();
      throw error;
    }
  }

  // ─── Send Push Notifications in Batch ───
  async _sendPushBatch(userIds, notification) {
    let sent = 0;
    let failed = 0;

    // Get all active subscriptions for these users
    const subscriptions = await PushSubscription.find({
      user: { $in: userIds },
      active: true
    }).lean();

    // Group by user
    const subsByUser = {};
    subscriptions.forEach(sub => {
      const uid = sub.user.toString();
      if (!subsByUser[uid]) subsByUser[uid] = [];
      subsByUser[uid].push(sub);
    });

    const pushPromises = [];

    for (const userId of userIds) {
      const userSubs = subsByUser[userId.toString()] || [];

      for (const sub of userSubs) {
        if (sub.platform === 'web' && notification.channels.webPush && sub.webPush?.endpoint) {
          pushPromises.push(
            this._sendWebPush(sub, notification, userId)
              .then(() => { sent++; })
              .catch(() => { failed++; })
          );
        }

        if (['ios', 'android', 'expo'].includes(sub.platform) && notification.channels.mobilePush && sub.expoPushToken) {
          pushPromises.push(
            this._sendExpoPush(sub, notification, userId)
              .then(() => { sent++; })
              .catch(() => { failed++; })
          );
        }
      }
    }

    await Promise.allSettled(pushPromises);
    return { sent, failed };
  }

  // ─── Web Push via VAPID ───
  async _sendWebPush(subscription, notification, userId) {
    if (!webpush) throw new Error('web-push not available');
    await this.ensureVapidConfigured();
    if (!this.vapidConfigured) throw new Error('VAPID not configured');

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/logo192.png',
      image: notification.image || undefined,
      badge: '/badge.png',
      data: {
        notificationId: notification._id.toString(),
        actionUrl: notification.actionUrl || '/',
        type: notification.type,
      },
      actions: notification.actionLabel ? [
        { action: 'open', title: notification.actionLabel },
        ...(notification.secondaryActionLabel ? [{ action: 'secondary', title: notification.secondaryActionLabel }] : [])
      ] : [],
      tag: notification._id.toString(),
      renotify: true,
      requireInteraction: true,
      silent: false,
    });

    try {
      await webpush.sendNotification({
        endpoint: subscription.webPush.endpoint,
        keys: subscription.webPush.keys
      }, payload);

      // Update user notification channel status
      await UserNotification.findOneAndUpdate(
        { user: userId, notification: notification._id },
        { 'channels.webPush': { sent: true, sentAt: new Date() } }
      );
    } catch (error) {
      // Handle expired/invalid subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await PushSubscription.findByIdAndUpdate(subscription._id, { active: false });
      }
      await UserNotification.findOneAndUpdate(
        { user: userId, notification: notification._id },
        { 'channels.webPush': { sent: false, error: error.message } }
      );
      throw error;
    }
  }

  // ─── Expo Push ───
  async _sendExpoPush(subscription, notification, userId) {
    const message = {
      to: subscription.expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification._id.toString(),
        actionUrl: notification.actionUrl || '/',
        type: notification.type,
      },
      priority: notification.priority === 'high' ? 'high' : 'default',
      channelId: 'default',
    };

    // Expo supports rich content (images) on Android via richContent
    if (notification.image) {
      message.richContent = { image: notification.image };
    }

    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.data?.status === 'error') {
        // Handle invalid tokens
        if (result.data.details?.error === 'DeviceNotRegistered') {
          await PushSubscription.findByIdAndUpdate(subscription._id, { active: false });
        }
        throw new Error(result.data.message || 'Expo push failed');
      }

      await UserNotification.findOneAndUpdate(
        { user: userId, notification: notification._id },
        { 'channels.mobilePush': { sent: true, sentAt: new Date() } }
      );
    } catch (error) {
      await UserNotification.findOneAndUpdate(
        { user: userId, notification: notification._id },
        { 'channels.mobilePush': { sent: false, error: error.message } }
      );
      throw error;
    }
  }

  // ─── Send Push to Anonymous Subscriptions (no user linked) ───
  async _sendPushToAnonymousSubscriptions(notification) {
    let sent = 0;
    let failed = 0;

    // Find active subscriptions that have no user (anonymous/not-logged-in installs)
    const anonSubs = await PushSubscription.find({
      user: null,
      active: true
    }).lean();

    const pushPromises = [];

    for (const sub of anonSubs) {
      if (sub.platform === 'web' && notification.channels.webPush && sub.webPush?.endpoint) {
        pushPromises.push(
          this._sendWebPushDirect(sub, notification)
            .then(() => { sent++; })
            .catch(() => { failed++; })
        );
      }
      if (['ios', 'android', 'expo'].includes(sub.platform) && notification.channels.mobilePush && sub.expoPushToken) {
        pushPromises.push(
          this._sendExpoPushDirect(sub, notification)
            .then(() => { sent++; })
            .catch(() => { failed++; })
        );
      }
    }

    await Promise.allSettled(pushPromises);
    return { sent, failed };
  }

  // ─── Direct Web Push (no user notification record) ───
  async _sendWebPushDirect(subscription, notification) {
    if (!webpush) throw new Error('web-push not available');
    await this.ensureVapidConfigured();
    if (!this.vapidConfigured) throw new Error('VAPID not configured');

    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/logo192.png',
      image: notification.image || undefined,
      badge: '/badge.png',
      data: {
        notificationId: notification._id.toString(),
        actionUrl: notification.actionUrl || '/',
        type: notification.type,
      },
      tag: notification._id.toString(),
      renotify: true,
      requireInteraction: true,
    });

    try {
      await webpush.sendNotification({
        endpoint: subscription.webPush.endpoint,
        keys: subscription.webPush.keys
      }, payload);
    } catch (error) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        await PushSubscription.findByIdAndUpdate(subscription._id, { active: false });
      }
      throw error;
    }
  }

  // ─── Direct Expo Push (no user notification record) ───
  async _sendExpoPushDirect(subscription, notification) {
    const message = {
      to: subscription.expoPushToken,
      sound: 'default',
      title: notification.title,
      body: notification.body,
      data: {
        notificationId: notification._id.toString(),
        actionUrl: notification.actionUrl || '/',
        type: notification.type,
      },
      priority: 'high',
      channelId: 'default',
    };

    if (notification.image) {
      message.richContent = { image: notification.image };
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const result = await response.json();
    if (result.data?.status === 'error') {
      if (result.data.details?.error === 'DeviceNotRegistered') {
        await PushSubscription.findByIdAndUpdate(subscription._id, { active: false });
      }
      throw new Error(result.data.message || 'Expo push failed');
    }
  }

  // ─── Send to Single User (for system-triggered notifications like order updates) ───
  async sendToUser(userId, { title, body, image, icon, type, actionUrl, actionLabel, channels }) {
    const notification = await Notification.create({
      title,
      body,
      image,
      icon,
      type: type || 'custom',
      actionUrl,
      actionLabel,
      targetAudience: 'individual',
      targetUsers: [userId],
      channels: {
        inApp: channels?.inApp !== false,
        webPush: channels?.webPush !== false,
        mobilePush: channels?.mobilePush !== false,
      },
      status: 'sent',
      sentAt: new Date(),
      stats: { targeted: 1 },
    });

    // Create in-app record
    await UserNotification.create({
      user: userId,
      notification: notification._id,
      delivered: true,
      deliveredAt: new Date(),
      channels: {
        inApp: { sent: true, sentAt: new Date() },
      }
    });

    // Send push (non-blocking)
    const subs = await PushSubscription.find({ user: userId, active: true }).lean();
    for (const sub of subs) {
      if (sub.platform === 'web' && sub.webPush?.endpoint) {
        this._sendWebPush(sub, notification, userId).catch(e => console.error('Web push error:', e.message));
      }
      if (['ios', 'android', 'expo'].includes(sub.platform) && sub.expoPushToken) {
        this._sendExpoPush(sub, notification, userId).catch(e => console.error('Expo push error:', e.message));
      }
    }

    return notification;
  }

  // ─── Get User's Bell Notifications ───
  async getUserNotifications(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
    const query = { user: userId };
    if (unreadOnly) query.read = false;

    const total = await UserNotification.countDocuments(query);
    const unreadCount = await UserNotification.countDocuments({ user: userId, read: false });

    const notifications = await UserNotification.find(query)
      .populate({
        path: 'notification',
        select: 'title body image icon type actionUrl actionLabel priority createdAt expiresAt'
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Filter out expired notifications
    const now = new Date();
    const filtered = notifications.filter(n =>
      n.notification && (!n.notification.expiresAt || n.notification.expiresAt > now)
    );

    return {
      notifications: filtered,
      unreadCount,
      total,
      page,
      pages: Math.ceil(total / limit),
    };
  }

  // ─── Mark as Read ───
  async markAsRead(userId, userNotificationId) {
    const un = await UserNotification.findOneAndUpdate(
      { _id: userNotificationId, user: userId },
      { read: true, readAt: new Date() },
      { new: true }
    );
    if (un) {
      await Notification.findByIdAndUpdate(un.notification, { $inc: { 'stats.opened': 1 } });
    }
    return un;
  }

  // ─── Mark All as Read ───
  async markAllAsRead(userId) {
    const result = await UserNotification.updateMany(
      { user: userId, read: false },
      { read: true, readAt: new Date() }
    );
    return result.modifiedCount;
  }

  // ─── Record Click ───
  async recordClick(userId, userNotificationId) {
    const un = await UserNotification.findOneAndUpdate(
      { _id: userNotificationId, user: userId },
      { clicked: true, clickedAt: new Date(), read: true, readAt: new Date() },
      { new: true }
    );
    if (un) {
      await Notification.findByIdAndUpdate(un.notification, { $inc: { 'stats.clicked': 1 } });
    }
    return un;
  }

  // ─── Dismiss ───
  async dismiss(userId, userNotificationId) {
    return UserNotification.findOneAndUpdate(
      { _id: userNotificationId, user: userId },
      { dismissed: true, dismissedAt: new Date() },
      { new: true }
    );
  }

  // ─── Get Unread Count ───
  async getUnreadCount(userId) {
    return UserNotification.countDocuments({ user: userId, read: false, dismissed: false });
  }

  // ─── Process Scheduled Notifications (called by cron/interval) ───
  async processScheduled() {
    const now = new Date();
    const due = await Notification.find({
      status: 'scheduled',
      scheduledAt: { $lte: now }
    });

    for (const notification of due) {
      try {
        await this.send(notification._id);
      } catch (error) {
        console.error(`Failed to send scheduled notification ${notification._id}:`, error.message);
      }
    }

    return due.length;
  }

  // ─── Generate VAPID Keys (one-time setup) ───
  generateVapidKeys() {
    if (!webpush) throw new Error('web-push not installed');
    return webpush.generateVAPIDKeys();
  }
}

module.exports = new NotificationService();
