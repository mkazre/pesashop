const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ProductPageSettings = require('../models/ProductPageSettings');

/**
 * @route   GET /api/product-page-settings
 * @desc    Get product page settings (admin)
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const settings = await ProductPageSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching product page settings:', error);
    res.status(500).json({ success: false, message: 'Error fetching product page settings', error: error.message });
  }
});

/**
 * @route   GET /api/product-page-settings/public
 * @desc    Get product page settings (public - for frontend storefront)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const settings = await ProductPageSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Error fetching public product page settings:', error);
    res.status(500).json({ success: false, message: 'Error fetching product page settings' });
  }
});

/**
 * @route   PUT /api/product-page-settings
 * @desc    Update product page settings
 * @access  Private/Admin
 */
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let existing = await ProductPageSettings.findOne();

    if (!existing) {
      const settings = await ProductPageSettings.create(req.body);
      return res.json({ success: true, message: 'Product page settings created', data: settings });
    }

    // Strip Mongoose internals from payload before $set
    const payload = { ...req.body };
    delete payload._id;
    delete payload.__v;
    delete payload.createdAt;
    delete payload.updatedAt;

    // Use findOneAndUpdate with $set — this reliably persists all fields
    // including new nested arrays that didn't exist when the document was first created
    const settings = await ProductPageSettings.findOneAndUpdate(
      { _id: existing._id },
      { $set: payload },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: 'Product page settings updated', data: settings });
  } catch (error) {
    console.error('Error updating product page settings:', error);
    res.status(400).json({ success: false, message: 'Error updating product page settings', error: error.message });
  }
});

/**
 * @route   PUT /api/product-page-settings/section/:sectionKey
 * @desc    Update a single section of product page settings
 * @access  Private/Admin
 */
router.put('/section/:sectionKey', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await ProductPageSettings.findOne();
    if (!settings) {
      settings = await ProductPageSettings.create({});
    }

    const key = req.params.sectionKey;
    if (settings[key] === undefined) {
      return res.status(400).json({ success: false, message: `Invalid section: ${key}` });
    }

    settings[key] = req.body;
    settings.markModified(key);
    await settings.save();

    res.json({ success: true, message: `Section "${key}" updated`, data: settings });
  } catch (error) {
    console.error('Error updating section:', error);
    res.status(400).json({ success: false, message: 'Error updating section', error: error.message });
  }
});

/**
 * @route   POST /api/product-page-settings/reset
 * @desc    Reset product page settings to defaults
 * @access  Private/Admin
 */
router.post('/reset', protect, authorize('admin'), async (req, res) => {
  try {
    await ProductPageSettings.deleteMany({});
    const settings = await ProductPageSettings.create({});
    res.json({ success: true, message: 'Product page settings reset to defaults', data: settings });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ success: false, message: 'Error resetting settings', error: error.message });
  }
});

module.exports = router;
