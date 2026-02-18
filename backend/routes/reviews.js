const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Review = require('../models/Review');
const ReviewSettings = require('../models/ReviewSettings');
const Product = require('../models/Product');
const Order = require('../models/Order');
const loyaltyService = require('../services/loyaltyService');

// GET all reviews (with filters)
router.get('/', async (req, res, next) => {
  try {
    const query = {};
    
    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    // Filter by product
    if (req.query.product) {
      query.product = req.query.product;
    }
    
    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }
    
    // For frontend, only show approved reviews
    if (req.query.public === 'true') {
      query.status = 'approved';
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const reviews = await Review.find(query)
      .populate('product', 'name slug images')
      .populate('user', 'firstName lastName email')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Review.countDocuments(query);
    
    res.json({
      success: true,
      data: reviews,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET single review
router.get('/:id', async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('product', 'name slug images')
      .populate('user', 'firstName lastName email')
      .populate('order', 'orderNumber');
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// POST create review
router.post('/', async (req, res, next) => {
  try {
    const settings = await ReviewSettings.getSettings();
    
    // Check login requirement
    if (settings.requireLogin && !req.user) {
      return res.status(401).json({ success: false, message: 'Login required to submit review' });
    }
    
    const { product, order, rating, categoryRatings, title, content, comment, guestName, guestEmail } = req.body;
    
    // Validate product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    // Validate comment length
    if (comment && comment.length > 60) {
      return res.status(400).json({ success: false, message: 'Comment must be 60 characters or less' });
    }
    
    // Check if user already reviewed (if logged in)
    if (req.user) {
      const existingReview = await Review.findOne({ product, user: req.user._id });
      if (existingReview) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
      }
    } else {
      // For guest reviews, check by email
      if (!guestEmail) {
        return res.status(400).json({ success: false, message: 'Email is required for guest reviews' });
      }
      const existingReview = await Review.findOne({ product, guestEmail });
      if (existingReview) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
      }
    }
    
    // Verify purchase if order is provided
    let isVerifiedPurchase = false;
    if (order && req.user) {
      const orderDoc = await Order.findOne({
        _id: order,
        customer: req.user._id,
        'items.product': product
      });
      isVerifiedPurchase = !!orderDoc;
    }
    
    // Determine status based on auto-approval settings
    let status = 'pending';
    if (settings.autoApproveEnabled && rating >= settings.autoApproveThreshold) {
      status = 'approved';
    }
    
    // Create review
    const reviewData = {
      product,
      rating,
      categoryRatings: categoryRatings || {},
      title,
      content,
      comment: comment || undefined,
      status,
      isVerifiedPurchase
    };
    
    if (req.user) {
      reviewData.user = req.user._id;
    } else {
      reviewData.guestName = guestName || 'Guest';
      reviewData.guestEmail = guestEmail;
    }
    
    if (order) {
      reviewData.order = order;
    }
    
    const review = await Review.create(reviewData);
    
    // Award PESA Coins if enabled and review is approved
    if (settings.loyaltyPointsEnabled && status === 'approved' && req.user) {
      try {
        await loyaltyService.awardBonusPoints(
          req.user._id,
          'review_bonus',
          settings.loyaltyPointsAmount,
          { reviewId: review._id, productId: product }
        );
      } catch (loyaltyError) {
        console.error('Failed to award PESA Coins for review:', loyaltyError);
        // Don't fail the review creation if PESA Coins fail
      }
    }
    
    // Populate and return
    await review.populate('product', 'name slug images');
    if (review.user) {
      await review.populate('user', 'firstName lastName email');
    }
    
    res.status(201).json({ 
      success: true, 
      data: review,
      message: status === 'approved' ? 'Review submitted and approved' : 'Review submitted and pending approval'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }
    next(error);
  }
});

// PUT update review
router.put('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user owns the review or is admin
    if (review.user && review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const { rating, categoryRatings, title, content, comment } = req.body;
    
    // Validate comment length
    if (comment && comment.length > 60) {
      return res.status(400).json({ success: false, message: 'Comment must be 60 characters or less' });
    }
    
    // Update fields
    if (rating !== undefined) review.rating = rating;
    if (categoryRatings) review.categoryRatings = categoryRatings;
    if (title !== undefined) review.title = title;
    if (content !== undefined) review.content = content;
    if (comment !== undefined) review.comment = comment;
    
    // Re-check auto-approval if rating changed
    if (rating !== undefined) {
      const settings = await ReviewSettings.getSettings();
      if (settings.autoApproveEnabled && rating >= settings.autoApproveThreshold && review.status === 'pending') {
        review.status = 'approved';
      }
    }
    
    await review.save();
    
    await review.populate('product', 'name slug images');
    if (review.user) {
      await review.populate('user', 'firstName lastName email');
    }
    
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// POST approve review
router.post('/:id/approve', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    ).populate('product', 'name slug images')
     .populate('user', 'firstName lastName email');
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Award PESA Coins if enabled and not already awarded
    const settings = await ReviewSettings.getSettings();
    if (settings.loyaltyPointsEnabled && review.user) {
      // Check if points were already awarded (by checking if review was just approved)
      try {
        await loyaltyService.awardBonusPoints(
          review.user._id,
          'review_bonus',
          settings.loyaltyPointsAmount,
          { reviewId: review._id, productId: review.product._id }
        );
      } catch (loyaltyError) {
        console.error('Failed to award PESA Coins for review:', loyaltyError);
      }
    }
    
    res.json({ success: true, data: review, message: 'Review approved' });
  } catch (error) {
    next(error);
  }
});

// POST reject review
router.post('/:id/reject', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    ).populate('product', 'name slug images')
     .populate('user', 'firstName lastName email');
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    res.json({ success: true, data: review, message: 'Review rejected' });
  } catch (error) {
    next(error);
  }
});

// DELETE review
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }
    
    // Check if user owns the review or is admin
    if (review.user && review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await Review.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
});

// GET review settings
router.get('/settings/get', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const settings = await ReviewSettings.getSettings();
    await settings.populate('emailTemplate', 'name subject body');
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PUT update review settings
router.put('/settings/update', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const settings = await ReviewSettings.getSettings();
    
    const {
      autoApproveThreshold,
      autoApproveEnabled,
      requireLogin,
      loyaltyPointsEnabled,
      loyaltyPointsAmount,
      emailReminderEnabled,
      emailReminderDays,
      emailTemplate,
      showFirstName,
      showGuestName
    } = req.body;
    
    if (autoApproveThreshold !== undefined) settings.autoApproveThreshold = autoApproveThreshold;
    if (autoApproveEnabled !== undefined) settings.autoApproveEnabled = autoApproveEnabled;
    if (requireLogin !== undefined) settings.requireLogin = requireLogin;
    if (loyaltyPointsEnabled !== undefined) settings.loyaltyPointsEnabled = loyaltyPointsEnabled;
    if (loyaltyPointsAmount !== undefined) settings.loyaltyPointsAmount = loyaltyPointsAmount;
    if (emailReminderEnabled !== undefined) settings.emailReminderEnabled = emailReminderEnabled;
    if (emailReminderDays !== undefined) settings.emailReminderDays = emailReminderDays;
    if (emailTemplate !== undefined) settings.emailTemplate = emailTemplate;
    if (showFirstName !== undefined) settings.showFirstName = showFirstName;
    if (showGuestName !== undefined) settings.showGuestName = showGuestName;
    
    await settings.save();
    await settings.populate('emailTemplate', 'name subject body');
    
    res.json({ success: true, data: settings, message: 'Review settings updated' });
  } catch (error) {
    next(error);
  }
});

// GET check if user can review product
router.get('/can-review/:productId', protect, async (req, res, next) => {
  try {
    const canReview = await Review.canUserReview(req.user._id, req.params.productId);
    res.json({ success: true, data: canReview });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
