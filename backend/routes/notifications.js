const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Notification, UserNotification } = require('../models/Notification');
const PushSubscription = require('../models/PushSubscription');
const notificationService = require('../services/notificationService');
const Settings = require('../models/Settings');

// ═══════════════════════════════════════════
// PUBLIC / CUSTOMER ROUTES
// ═══════════════════════════════════════════

// GET my notifications (bell inbox)
router.get('/my', protect, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await notificationService.getUserNotifications(req.user._id, { page, limit, unreadOnly });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET unread count
router.get('/my/unread-count', protect, async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT mark one as read
router.put('/my/:id/read', protect, async (req, res) => {
  try {
    const un = await notificationService.markAsRead(req.user._id, req.params.id);
    if (!un) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: un });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT mark all as read
router.put('/my/read-all', protect, async (req, res) => {
  try {
    const count = await notificationService.markAllAsRead(req.user._id);
    res.json({ success: true, data: { markedRead: count } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST record click (for analytics)
router.post('/my/:id/click', protect, async (req, res) => {
  try {
    const un = await notificationService.recordClick(req.user._id, req.params.id);
    if (!un) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, data: un });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE dismiss notification
router.delete('/my/:id', protect, async (req, res) => {
  try {
    const un = await notificationService.dismiss(req.user._id, req.params.id);
    if (!un) return res.status(404).json({ success: false, message: 'Notification not found' });
    res.json({ success: true, message: 'Dismissed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════
// PUSH SUBSCRIPTION ROUTES
// ═══════════════════════════════════════════

// POST register push subscription (web push or expo token)
router.post('/subscribe', protect, async (req, res) => {
  try {
    const { platform, webPush, expoPushToken, deviceName, deviceId, userAgent, appVersion } = req.body;

    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' });
    }

    // Upsert by user + deviceId (or endpoint for web)
    const filter = { user: req.user._id };
    if (deviceId) {
      filter.deviceId = deviceId;
    } else if (platform === 'web' && webPush?.endpoint) {
      filter['webPush.endpoint'] = webPush.endpoint;
    } else if (expoPushToken) {
      filter.expoPushToken = expoPushToken;
    }

    const update = {
      user: req.user._id,
      platform,
      active: true,
      lastUsed: new Date(),
      ...(webPush && { webPush }),
      ...(expoPushToken && { expoPushToken }),
      ...(deviceName && { deviceName }),
      ...(deviceId && { deviceId }),
      ...(userAgent && { userAgent }),
      ...(appVersion && { appVersion }),
    };

    const sub = await PushSubscription.findOneAndUpdate(filter, update, { upsert: true, new: true });
    res.json({ success: true, data: sub });
  } catch (error) {
    // Handle duplicate key errors gracefully
    if (error.code === 11000) {
      res.json({ success: true, message: 'Subscription already exists' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// POST register anonymous push subscription (no auth required - for non-logged-in users)
router.post('/subscribe-anonymous', async (req, res) => {
  try {
    const { platform, webPush, expoPushToken, deviceName, deviceId, userAgent, appVersion } = req.body;

    if (!platform) {
      return res.status(400).json({ success: false, message: 'Platform is required' });
    }

    // Build filter to find existing anonymous subscription for this device
    const filter = { user: null };
    if (deviceId) {
      filter.deviceId = deviceId;
    } else if (platform === 'web' && webPush?.endpoint) {
      filter['webPush.endpoint'] = webPush.endpoint;
    } else if (expoPushToken) {
      filter.expoPushToken = expoPushToken;
    }

    const update = {
      user: null,
      platform,
      active: true,
      lastUsed: new Date(),
      ...(webPush && { webPush }),
      ...(expoPushToken && { expoPushToken }),
      ...(deviceName && { deviceName }),
      ...(deviceId && { deviceId }),
      ...(userAgent && { userAgent }),
      ...(appVersion && { appVersion }),
    };

    const sub = await PushSubscription.findOneAndUpdate(filter, update, { upsert: true, new: true });
    res.json({ success: true, data: sub });
  } catch (error) {
    if (error.code === 11000) {
      res.json({ success: true, message: 'Subscription already exists' });
    } else {
      res.status(500).json({ success: false, message: error.message });
    }
  }
});

// DELETE unsubscribe
router.delete('/subscribe', protect, async (req, res) => {
  try {
    const { deviceId, endpoint, expoPushToken } = req.body;
    const filter = { user: req.user._id };

    if (deviceId) filter.deviceId = deviceId;
    else if (endpoint) filter['webPush.endpoint'] = endpoint;
    else if (expoPushToken) filter.expoPushToken = expoPushToken;

    await PushSubscription.findOneAndUpdate(filter, { active: false });
    res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET VAPID public key (for web push subscription on frontend)
router.get('/vapid-public-key', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const publicKey = settings.vapidPublicKey || process.env.VAPID_PUBLIC_KEY || '';
    res.json({ success: true, data: { publicKey } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═══════════════════════════════════════════
// ADMIN ROUTES
// ═══════════════════════════════════════════

// ─── Admin: Get stats overview (MUST be before /:id) ───
router.get('/admin/stats', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const totalSent = await Notification.countDocuments({ status: 'sent' });
    const totalScheduled = await Notification.countDocuments({ status: 'scheduled' });
    const totalDrafts = await Notification.countDocuments({ status: 'draft' });
    const totalSubscribers = await PushSubscription.countDocuments({ active: true });

    const aggStats = await Notification.aggregate([
      { $match: { status: 'sent' } },
      {
        $group: {
          _id: null,
          totalTargeted: { $sum: '$stats.targeted' },
          totalDelivered: { $sum: '$stats.delivered' },
          totalOpened: { $sum: '$stats.opened' },
          totalClicked: { $sum: '$stats.clicked' },
        }
      }
    ]);

    const agg = aggStats[0] || { totalTargeted: 0, totalDelivered: 0, totalOpened: 0, totalClicked: 0 };

    res.json({
      success: true,
      data: {
        totalSent,
        totalScheduled,
        totalDrafts,
        totalSubscribers,
        ...agg,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Generate VAPID keys (MUST be before /:id) ───
router.post('/admin/generate-vapid-keys', protect, authorize('admin'), async (req, res) => {
  try {
    const keys = notificationService.generateVapidKeys();

    const settings = await Settings.getSettings();
    settings.vapidPublicKey = keys.publicKey;
    settings.vapidPrivateKey = keys.privateKey;
    await settings.save();

    notificationService.vapidConfigured = false;

    res.json({ success: true, data: { publicKey: keys.publicKey }, message: 'VAPID keys generated and saved' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all notifications (admin list)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;
    const type = req.query.type;
    const search = req.query.search;

    const query = {};
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { body: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single notification (admin detail)
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('relatedProduct', 'name slug images')
      .lean();

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create notification (draft)
router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const notification = await Notification.create({
      ...req.body,
      createdBy: req.user._id,
      status: req.body.scheduledAt ? 'scheduled' : 'draft',
    });

    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update notification
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.status === 'sent' || notification.status === 'sending') {
      return res.status(400).json({ success: false, message: 'Cannot edit a sent notification' });
    }

    Object.assign(notification, req.body);
    if (req.body.scheduledAt && notification.status === 'draft') {
      notification.status = 'scheduled';
    }
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST send notification immediately
router.post('/:id/send', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const result = await notificationService.send(req.params.id);
    res.json({ success: true, data: result, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST duplicate notification
router.post('/:id/duplicate', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const original = await Notification.findById(req.params.id).lean();
    if (!original) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    delete original._id;
    delete original.createdAt;
    delete original.updatedAt;

    const duplicate = await Notification.create({
      ...original,
      title: `${original.title} (Copy)`,
      status: 'draft',
      sentAt: null,
      scheduledAt: null,
      stats: { targeted: 0, sent: 0, delivered: 0, opened: 0, clicked: 0, failed: 0 },
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST cancel scheduled notification
router.post('/:id/cancel', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Only scheduled notifications can be cancelled' });
    }

    notification.status = 'cancelled';
    await notification.save();

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE notification
router.delete('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    // Delete all associated user notifications
    await UserNotification.deleteMany({ notification: notification._id });
    await notification.deleteOne();

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
