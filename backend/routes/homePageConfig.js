const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const HomePageConfig = require('../models/HomePageConfig');

// GET public config (frontend)
router.get('/public', async (req, res, next) => {
  try {
    const config = await HomePageConfig.getConfig();
    // Only return enabled blocks, sorted by order
    const blocks = (config.blocks || [])
      .filter(b => b.enabled)
      .sort((a, b) => a.order - b.order);
    res.json({ success: true, data: { blocks, isPublished: config.isPublished } });
  } catch (error) {
    next(error);
  }
});

// GET admin config (all blocks, including disabled)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const config = await HomePageConfig.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// PUT update config (admin)
router.put('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const config = await HomePageConfig.getConfig();
    const { blocks, isPublished } = req.body;

    if (blocks !== undefined) {
      config.blocks = blocks;
    }
    if (isPublished !== undefined) {
      config.isPublished = isPublished;
      if (isPublished) {
        config.lastPublishedAt = new Date();
      }
    }

    await config.save();
    res.json({ success: true, data: config, message: 'Home page config updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST reset to default
router.post('/reset', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const config = await HomePageConfig.getConfig();
    config.blocks = [];
    config.isPublished = true;
    await config.save();
    res.json({ success: true, data: config, message: 'Home page config reset to default' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
