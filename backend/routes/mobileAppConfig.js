const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const MobileAppConfig = require('../models/MobileAppConfig');
const { uploadToCloudinary } = require('../config/cloudinary');

// Use memory storage so we can pipe buffer to Cloudinary
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Helper: get or create config singleton
async function getConfig() {
  let config = await MobileAppConfig.findOne();
  if (!config) {
    config = await MobileAppConfig.create({});
  }
  return config;
}

// ─── Public: Get splash screen config (used by mobile app) ──────
router.get('/public/splash', async (req, res) => {
  try {
    const config = await getConfig();
    res.json({ success: true, data: config.splashScreen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Get full config ─────────────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const config = await getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Update splash screen config ─────────────────────────
router.put('/splash', protect, async (req, res) => {
  try {
    const config = await getConfig();
    const existing = config.splashScreen && typeof config.splashScreen.toObject === 'function'
      ? config.splashScreen.toObject()
      : (config.splashScreen || {});
    // Merge, but let req.body.slides fully replace existing slides (don't merge per-slide)
    const merged = { ...existing, ...req.body };
    // Strip Mongoose _id from slides to let Mongoose generate fresh ones
    if (Array.isArray(merged.slides)) {
      merged.slides = merged.slides.map((s, i) => ({
        image: s.image || '',
        heading: s.heading || '',
        text: s.text || '',
        order: s.order ?? i,
      }));
    }
    config.splashScreen = merged;
    config.markModified('splashScreen');
    await config.save();
    res.json({ success: true, data: config.splashScreen });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Admin: Upload splash image ─────────────────────────────────
router.post('/splash/upload', protect, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    // Upload to Cloudinary so the URL is persistent and accessible from any device
    const result = await uploadToCloudinary(req.file.buffer, { folder: 'mobile-splash' });
    res.json({ success: true, data: { url: result.url } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
