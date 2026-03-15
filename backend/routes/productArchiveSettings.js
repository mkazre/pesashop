const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ProductArchiveSettings = require('../models/ProductArchiveSettings');

/**
 * @route   GET /api/product-archive-settings
 * @desc    Get product archive settings (admin)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const settings = await ProductArchiveSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching product archive settings:', error);
    res.status(500).json({ success: false, message: 'Error fetching product archive settings', error: error.message });
  }
});

/**
 * @route   GET /api/product-archive-settings/public
 * @desc    Get product archive settings (public - for frontend storefront)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const settings = await ProductArchiveSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching public product archive settings:', error);
    res.status(500).json({ success: false, message: 'Error fetching product archive settings' });
  }
});

/**
 * @route   PUT /api/product-archive-settings
 * @desc    Update product archive settings
 * @access  Private/Admin
 */
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let existing = await ProductArchiveSettings.findOne();

    if (!existing) {
      const settings = await ProductArchiveSettings.create(req.body);
      return res.json({ success: true, message: 'Product archive settings created', data: settings });
    }

    // Strip Mongoose internals from payload before $set
    const payload = { ...req.body };
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;

    const settings = await ProductArchiveSettings.findOneAndUpdate(
      { _id: existing._id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Product archive settings updated', data: settings });
  } catch (error) {
    console.error('Error updating product archive settings:', error);
    res.status(400).json({ success: false, message: 'Error updating product archive settings', error: error.message });
  }
});

/**
 * @route   POST /api/product-archive-settings/reset
 * @desc    Reset product archive settings to defaults
 * @access  Private/Admin
 */
router.post('/reset', protect, authorize('admin'), async (req, res) => {
  try {
    await ProductArchiveSettings.deleteMany({});
    const settings = await ProductArchiveSettings.create({});
    res.json({ success: true, message: 'Product archive settings reset to defaults', data: settings });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ success: false, message: 'Error resetting settings', error: error.message });
  }
});

module.exports = router;
