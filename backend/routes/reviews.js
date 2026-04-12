const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const Review = require('../models/Review');
const ReviewSettings = require('../models/ReviewSettings');
const Product = require('../models/Product');
const Order = require('../models/Order');
const loyaltyService = require('../services/loyaltyService');
const mongoose = require('mongoose');

// Helper: recalculate and update a product's rating + reviewCount from approved reviews
async function updateProductRating(productId) {
  try {
    const stats = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(productId), status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    if (stats.length) {
      await Product.findByIdAndUpdate(productId, { rating: Math.round(stats[0].avg * 10) / 10, reviewCount: stats[0].count });
    } else {
      await Product.findByIdAndUpdate(productId, { rating: 0, reviewCount: 0 });
    }
  } catch (err) {
    console.error('updateProductRating error:', err);
  }
}

// Multer storage for review images
const reviewImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/reviews');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `review-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadReviewImages = multer({
  storage: reviewImageStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max (validated per-settings in route)
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'), false);
  }
});

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

// POST create review (with optional image uploads)
router.post('/', optionalAuth, uploadReviewImages.array('images', 10), async (req, res, next) => {
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
    const ratingNum = parseInt(rating);
    if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    
    // Validate content length
    if (settings.minimumContentLength && (!content || content.length < settings.minimumContentLength)) {
      return res.status(400).json({ success: false, message: `Review must be at least ${settings.minimumContentLength} characters` });
    }
    
    // Validate comment length
    if (comment && comment.length > 60) {
      return res.status(400).json({ success: false, message: 'Comment must be 60 characters or less' });
    }
    
    // Purchase verification: require purchase + delivered
    if (settings.requirePurchase && req.user) {
      const orderQuery = {
        customer: req.user._id,
        'items.product': product,
      };
      if (settings.requireDelivered) {
        orderQuery.status = { $in: ['delivered', 'completed'] };
      } else {
        orderQuery.status = { $nin: ['cancelled', 'refunded'] };
      }
      const qualifyingOrder = await Order.findOne(orderQuery);
      if (!qualifyingOrder) {
        const msg = settings.requireDelivered 
          ? 'You can only review products from delivered orders'
          : 'You must purchase this product before reviewing it';
        return res.status(403).json({ success: false, message: msg });
      }
    }
    
    // Check if user already reviewed (if logged in)
    if (req.user) {
      const existingReview = await Review.findOne({ product, user: req.user._id });
      if (existingReview) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
      }
    } else {
      if (!guestEmail) {
        return res.status(400).json({ success: false, message: 'Email is required for guest reviews' });
      }
      const existingReview = await Review.findOne({ product, guestEmail });
      if (existingReview) {
        return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
      }
    }
    
    // Process uploaded images
    let reviewImages = [];
    if (req.files && req.files.length > 0) {
      if (!settings.allowImages) {
        return res.status(400).json({ success: false, message: 'Image uploads are not allowed' });
      }
      if (req.files.length > (settings.maxImages || 5)) {
        return res.status(400).json({ success: false, message: `Maximum ${settings.maxImages || 5} images allowed` });
      }
      // Validate file sizes
      const maxBytes = (settings.maxFileSizeMB || 5) * 1024 * 1024;
      for (const file of req.files) {
        if (file.size > maxBytes) {
          return res.status(400).json({ success: false, message: `Each image must be under ${settings.maxFileSizeMB || 5}MB` });
        }
      }
      reviewImages = req.files.map(file => ({
        url: `/uploads/reviews/${file.filename}`,
        alt: `Review image for ${productDoc.name}`
      }));
    }
    
    // Verify purchase for badge
    let isVerifiedPurchase = false;
    if (req.user) {
      const purchaseOrder = await Order.findOne({
        customer: req.user._id,
        'items.product': product,
        status: { $in: ['delivered', 'completed', 'processing', 'shipped'] }
      });
      isVerifiedPurchase = !!purchaseOrder;
    }
    
    // Determine status based on auto-approval settings
    let status = 'pending';
    if (settings.autoApproveEnabled && ratingNum >= settings.autoApproveThreshold) {
      status = 'approved';
    }
    
    // Parse categoryRatings if it's a string (from FormData)
    let parsedCategoryRatings = categoryRatings;
    if (typeof categoryRatings === 'string') {
      try { parsedCategoryRatings = JSON.parse(categoryRatings); } catch { parsedCategoryRatings = {}; }
    }
    
    // Create review
    const reviewData = {
      product,
      rating: ratingNum,
      categoryRatings: parsedCategoryRatings || {},
      title,
      content,
      comment: comment || undefined,
      images: reviewImages,
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
        await loyaltyService.awardExtraPoints(
          req.user._id,
          'review',
          { productName: productDoc.name, reviewId: review._id }
        );
        await Review.findByIdAndUpdate(review._id, { pointsAwarded: true });
      } catch (loyaltyError) {
        console.error('Failed to award PESA Coins for review:', loyaltyError);
      }
    }
    
    // Update product rating/reviewCount if auto-approved
    if (status === 'approved') {
      await updateProductRating(product);
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
    if (settings.loyaltyPointsEnabled && review.user && !review.pointsAwarded) {
      try {
        await loyaltyService.awardExtraPoints(
          review.user._id,
          'review',
          { productName: review.product?.name || 'N/A', reviewId: review._id }
        );
        await Review.findByIdAndUpdate(review._id, { pointsAwarded: true });
      } catch (loyaltyError) {
        console.error('Failed to award PESA Coins for review:', loyaltyError);
      }
    }
    
    // Update product rating/reviewCount
    await updateProductRating(review.product._id || review.product);

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
    
    // Recalculate product rating (review removed from approved pool)
    await updateProductRating(review.product._id || review.product);

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
    
    const fields = [
      'autoApproveThreshold', 'autoApproveEnabled', 'requireLogin',
      'loyaltyPointsEnabled', 'loyaltyPointsAmount',
      'emailReminderEnabled', 'emailReminderDays', 'emailTemplate',
      'showFirstName', 'showGuestName',
      'allowImages', 'maxImages', 'maxFileSizeMB', 'allowedImageTypes',
      'requirePurchase', 'requireDelivered',
      'enableProfanityFilter', 'minimumContentLength', 'showCategoryRatings'
    ];
    
    for (const field of fields) {
      if (req.body[field] !== undefined) settings[field] = req.body[field];
    }
    
    await settings.save();
    await settings.populate('emailTemplate', 'name subject body');
    
    res.json({ success: true, data: settings, message: 'Review settings updated' });
  } catch (error) {
    next(error);
  }
});

// POST bulk approve/reject reviews
router.post('/bulk-status', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { reviewIds, status } = req.body;
    if (!reviewIds?.length || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Provide reviewIds array and status (approved/rejected)' });
    }
    const result = await Review.updateMany(
      { _id: { $in: reviewIds } },
      { status }
    );

    // Update product ratings for affected products
    const reviews = await Review.find({ _id: { $in: reviewIds } }).select('product');
    const productIds = [...new Set(reviews.map(r => r.product.toString()))];
    for (const pid of productIds) {
      await updateProductRating(pid);
    }

    res.json({ success: true, message: `${result.modifiedCount} reviews ${status}`, data: { modified: result.modifiedCount } });
  } catch (error) {
    next(error);
  }
});

// GET review summary/stats (admin)
router.get('/summary/stats', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const [statusCounts, ratingDist, recentCount, withImages, verifiedCount] = await Promise.all([
      Review.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Review.countDocuments({ createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } }),
      Review.countDocuments({ 'images.0': { $exists: true } }),
      Review.countDocuments({ isVerifiedPurchase: true }),
    ]);

    const total = statusCounts.reduce((sum, s) => sum + s.count, 0);
    const byStatus = {};
    statusCounts.forEach(s => { byStatus[s._id] = s.count; });
    const avgRating = await Review.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus,
        ratingDistribution: ratingDist,
        averageRating: avgRating[0]?.avg || 0,
        recentWeek: recentCount,
        withImages,
        verifiedPurchases: verifiedCount,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET public review settings (for frontend review form)
router.get('/settings/public', async (req, res, next) => {
  try {
    const settings = await ReviewSettings.getSettings();
    res.json({
      success: true,
      data: {
        requireLogin: settings.requireLogin,
        requirePurchase: settings.requirePurchase,
        requireDelivered: settings.requireDelivered,
        allowImages: settings.allowImages,
        maxImages: settings.maxImages,
        maxFileSizeMB: settings.maxFileSizeMB,
        allowedImageTypes: settings.allowedImageTypes,
        minimumContentLength: settings.minimumContentLength,
        showCategoryRatings: settings.showCategoryRatings,
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET check if user can review product
router.get('/can-review/:productId', protect, async (req, res, next) => {
  try {
    const settings = await ReviewSettings.getSettings();
    const userId = req.user._id;
    const productId = req.params.productId;

    // Check existing review
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return res.json({ success: true, data: { canReview: false, hasPurchased: true, hasReviewed: true, reason: 'already_reviewed' } });
    }

    // Check purchase + delivery status
    if (settings.requirePurchase) {
      const orderQuery = { customer: userId, 'items.product': productId };
      if (settings.requireDelivered) {
        orderQuery.status = { $in: ['delivered', 'completed'] };
      } else {
        orderQuery.status = { $nin: ['cancelled', 'refunded'] };
      }
      const order = await Order.findOne(orderQuery);
      if (!order) {
        return res.json({
          success: true,
          data: {
            canReview: false,
            hasPurchased: false,
            hasReviewed: false,
            reason: settings.requireDelivered ? 'not_delivered' : 'not_purchased'
          }
        });
      }
    }

    res.json({ success: true, data: { canReview: true, hasPurchased: true, hasReviewed: false } });
  } catch (error) {
    next(error);
  }
});

// POST vote helpful/unhelpful
router.post('/:id/vote', protect, async (req, res, next) => {
  try {
    const { vote } = req.body; // 'helpful' or 'unhelpful'
    if (!['helpful', 'unhelpful'].includes(vote)) {
      return res.status(400).json({ success: false, message: 'Vote must be helpful or unhelpful' });
    }
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    await review.vote(req.user._id, vote);
    res.json({ success: true, data: { helpfulCount: review.helpfulCount, unhelpfulCount: review.unhelpfulCount } });
  } catch (error) {
    next(error);
  }
});

// POST report review
router.post('/:id/report', protect, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    
    const alreadyReported = review.reports.some(r => r.user.toString() === req.user._id.toString());
    if (alreadyReported) return res.status(400).json({ success: false, message: 'Already reported' });
    
    review.reports.push({ user: req.user._id, reason });
    review.reportedCount = review.reports.length;
    await review.save();
    res.json({ success: true, message: 'Review reported' });
  } catch (error) {
    next(error);
  }
});

// POST admin response to review
router.post('/:id/admin-response', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ success: false, message: 'Response content required' });
    
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { adminResponse: { content, respondedBy: req.user._id, respondedAt: new Date() } },
      { new: true }
    ).populate('product', 'name slug images').populate('user', 'firstName lastName email');
    
    if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
    res.json({ success: true, data: review });
  } catch (error) {
    next(error);
  }
});

// ─── Review Categories ─────────────────────────────────────────────
const ReviewCategory = require('../models/ReviewCategory');

// GET /api/reviews/categories — Active review categories (public)
router.get('/categories', async (req, res) => {
  try {
    const cats = await ReviewCategory.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/reviews/categories/all — All categories (admin)
router.get('/categories/all', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const cats = await ReviewCategory.find().sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/reviews/categories — Create (admin)
router.post('/categories', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const cat = await ReviewCategory.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reviews/categories/reorder — Reorder drag-drop (admin)
router.put('/categories/reorder', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const { orderedIds } = req.body;
    await Promise.all(orderedIds.map((id, idx) =>
      ReviewCategory.findByIdAndUpdate(id, { displayOrder: idx })
    ));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/reviews/categories/:id — Update (admin)
router.put('/categories/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const cat = await ReviewCategory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!cat) return res.status(404).json({ success: false, message: 'Category not found' });
    res.json({ success: true, data: cat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/reviews/categories/:id — Delete (admin)
router.delete('/categories/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await ReviewCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
