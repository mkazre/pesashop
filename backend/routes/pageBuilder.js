const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { PageBuilder } = require('../models/Template');

/**
 * @route   GET /api/page-builder/:slug
 * @desc    Get page by slug
 * @access  Public
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const template = await PageBuilder.findOne({ 
      slug: req.params.slug,
      isPublished: true 
    }).lean();

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/page-builder
 * @desc    Get all pages
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const templates = await PageBuilder.find({ 
      isPublished: true 
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
