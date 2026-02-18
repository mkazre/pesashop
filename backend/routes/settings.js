const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Settings = require('../models/Settings');

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    // Don't send the API key in response - only send if it's configured
    const settingsData = settings.toObject();
    settingsData.openaiApiKey = settingsData.openaiApiKey ? '***configured***' : '';
    
    res.json({
      success: true,
      data: settingsData
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/settings
 * @desc    Update settings
 * @access  Private/Admin
 */
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      // If API key is being updated and it's the masked value, don't update it
      if (req.body.openaiApiKey === '***configured***') {
        delete req.body.openaiApiKey;
      }
      
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        }
      });
      
      await settings.save();
    }
    
    // Don't send the API key in response
    const settingsData = settings.toObject();
    settingsData.openaiApiKey = settingsData.openaiApiKey ? '***configured***' : '';
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settingsData
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating settings',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/settings/product-display
 * @desc    Get product display settings (public - for frontend storefront)
 * @access  Public
 */
router.get('/product-display', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings.productDisplay || {
        detailPage: { titleLines: 0, descriptionLines: 0, shortDescriptionLines: 0, reviewLines: 0 },
        otherLocations: { titleLines: 2, descriptionLines: 3, shortDescriptionLines: 2, reviewLines: 3 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
});

/**
 * @route   GET /api/settings/social-login
 * @desc    Get social login configuration (public - only exposes enabled state and client IDs, never secrets)
 * @access  Public
 */
router.get('/social-login', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const sl = settings.socialLogin || {};
    res.json({
      success: true,
      data: {
        google: {
          enabled: !!(sl.google?.enabled && sl.google?.clientId),
          clientId: sl.google?.enabled ? sl.google.clientId : '',
        },
        facebook: {
          enabled: !!(sl.facebook?.enabled && sl.facebook?.appId),
          appId: sl.facebook?.enabled ? sl.facebook.appId : '',
        },
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching social login settings' });
  }
});

/**
 * @route   GET /api/settings/bank-details
 * @desc    Get bank details for EFT payments (public)
 * @access  Public
 */
router.get('/bank-details', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings.bankDetails || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bank details' });
  }
});

module.exports = router;
