const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const MobileAppConfig = require('../models/MobileAppConfig');

// Upload config for splash images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'mobile');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `splash-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

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
    config.splashScreen = { ...config.splashScreen.toObject(), ...req.body };
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
    const imageUrl = `/uploads/mobile/${req.file.filename}`;
    res.json({ success: true, data: { url: imageUrl } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
