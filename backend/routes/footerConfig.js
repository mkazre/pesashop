const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const FooterConfig = require('../models/FooterConfig');

// GET public config (frontend)
router.get('/public', async (req, res, next) => {
  try {
    const config = await FooterConfig.getConfig();
    if (!config.isActive) {
      return res.json({ success: true, data: { isActive: false } });
    }
    const rows = (config.rows || [])
      .filter(r => r.enabled)
      .sort((a, b) => a.order - b.order);
    res.json({
      success: true,
      data: {
        isActive: config.isActive,
        rows,
        globalBackgroundColor: config.globalBackgroundColor,
        globalTextColor: config.globalTextColor,
        globalLinkColor: config.globalLinkColor,
        globalLinkHoverColor: config.globalLinkHoverColor,
        globalHeadingColor: config.globalHeadingColor,
        globalFontFamily: config.globalFontFamily,
        bottomBarEnabled: config.bottomBarEnabled,
        bottomBarBackgroundColor: config.bottomBarBackgroundColor,
        bottomBarTextColor: config.bottomBarTextColor,
        bottomBarBorderTop: config.bottomBarBorderTop,
        copyrightText: config.copyrightText,
        copyrightPosition: config.copyrightPosition,
        showPaymentIcons: config.showPaymentIcons,
        paymentIcons: config.paymentIcons,
        bottomBarPaddingTop: config.bottomBarPaddingTop,
        bottomBarPaddingBottom: config.bottomBarPaddingBottom,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET admin config (full)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const config = await FooterConfig.getConfig();
    res.json({ success: true, data: config });
  } catch (error) {
    next(error);
  }
});

// PUT update config
router.put('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const config = await FooterConfig.getConfig();
    const allowedFields = [
      'isActive', 'rows',
      'globalBackgroundColor', 'globalTextColor', 'globalLinkColor',
      'globalLinkHoverColor', 'globalHeadingColor', 'globalFontFamily',
      'bottomBarEnabled', 'bottomBarBackgroundColor', 'bottomBarTextColor',
      'bottomBarBorderTop', 'copyrightText', 'copyrightPosition',
      'showPaymentIcons', 'paymentIcons',
      'bottomBarPaddingTop', 'bottomBarPaddingBottom',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        config[field] = req.body[field];
      }
    }

    if (req.body.isActive) {
      config.lastPublishedAt = new Date();
    }

    await config.save();
    res.json({ success: true, data: config, message: 'Footer config updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST reset to default
router.post('/reset', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const config = await FooterConfig.getConfig();
    config.rows = [];
    config.isActive = false;
    await config.save();
    res.json({ success: true, data: config, message: 'Footer config reset' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
