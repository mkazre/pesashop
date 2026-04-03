const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { Coupon } = require('../models/Coupon');
const CouponEmailSettings = require('../models/CouponEmailSettings');
const couponEmailService = require('../services/couponEmailService');

// ==================== PUBLIC / CUSTOMER ENDPOINTS ====================

// POST validate coupon (public — works for guests and logged-in users)
router.post('/public/validate', async (req, res, next) => {
  try {
    const { code, cartTotal, cartItems } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }

    const validation = coupon.isValid(null, cartTotal || 0, cartItems || []);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }

    const discount = coupon.calculateDiscount(cartTotal || 0, cartItems || []);

    res.json({
      success: true,
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description,
          excludeSaleItems: coupon.excludeSaleItems,
          freeShipping: coupon.type === 'free_shipping',
          minimumAmount: coupon.minimumAmount,
          maxDiscount: coupon.maxDiscount
        },
        discount,
        message: 'Coupon is valid'
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET auto-apply coupons (for URL-based auto-apply)
router.get('/public/auto-apply', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.json({ success: true, data: null });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), autoApply: true, isActive: true });
    if (!coupon) {
      return res.json({ success: true, data: null });
    }

    const now = new Date();
    if ((coupon.startDate && now < coupon.startDate) || (coupon.endDate && now > coupon.endDate)) {
      return res.json({ success: true, data: null });
    }
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.json({ success: true, data: null });
    }

    res.json({
      success: true,
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET my coupons (authenticated customer — available coupons for this user)
router.get('/my-coupons', protect, async (req, res, next) => {
  try {
    const now = new Date();
    const user = req.user;

    // Find all active coupons that are valid for this user
    const allCoupons = await Coupon.find({
      isActive: true,
      $or: [{ endDate: null }, { endDate: { $gte: now } }],
      $or: [{ startDate: null }, { startDate: { $lte: now } }]
    }).sort({ createdAt: -1 });

    const available = [];
    const used = [];

    for (const coupon of allCoupons) {
      // Check if user-specific restrictions apply
      if (coupon.allowedEmails.length > 0 && !coupon.allowedEmails.includes(user.email)) continue;
      if (coupon.excludedEmails.length > 0 && coupon.excludedEmails.includes(user.email)) continue;
      if (coupon.allowedCustomerGroups.length > 0 && !coupon.allowedCustomerGroups.includes(user.customerGroup)) continue;

      // Check if first purchase only
      if (coupon.firstPurchaseOnly && user.orderCount > 0) continue;

      // Check usage limit
      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) continue;

      const userUsage = coupon.usedBy.find(u => u.user.toString() === user._id.toString());
      const userUsageCount = userUsage ? userUsage.count : 0;
      const isFullyUsed = coupon.usageLimitPerUser && userUsageCount >= coupon.usageLimitPerUser;

      const couponData = {
        _id: coupon._id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        minimumAmount: coupon.minimumAmount,
        maximumAmount: coupon.maximumAmount,
        maxDiscount: coupon.maxDiscount,
        excludeSaleItems: coupon.excludeSaleItems,
        startDate: coupon.startDate,
        endDate: coupon.endDate,
        usageLimitPerUser: coupon.usageLimitPerUser,
        userUsageCount,
        freeShipping: coupon.type === 'free_shipping'
      };

      if (isFullyUsed) {
        used.push({ ...couponData, status: 'used' });
      } else {
        available.push({ ...couponData, status: 'available' });
      }
    }

    res.json({
      success: true,
      data: { available, used }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN COUPONS ====================

// GET all coupons
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const isActive = req.query.isActive;
    
    const query = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const coupons = await Coupon.find(query)
      .populate('allowedProducts', 'name sku')
      .populate('excludedProducts', 'name sku')
      .populate('allowedCategories', 'name')
      .populate('excludedCategories', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Coupon.countDocuments(query);
    
    res.json({
      success: true,
      data: coupons,
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

// GET single coupon
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('allowedProducts', 'name sku')
      .populate('excludedProducts', 'name sku')
      .populate('allowedCategories', 'name')
      .populate('excludedCategories', 'name');
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    
    res.json({ success: true, data: coupon });
  } catch (error) {
    next(error);
  }
});

// POST create coupon
router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json({ success: true, data: coupon, message: 'Coupon created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    next(error);
  }
});

// PUT update coupon
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    
    res.json({ success: true, data: coupon, message: 'Coupon updated successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Coupon code already exists' });
    }
    next(error);
  }
});

// DELETE coupon
router.delete('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res, next) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    res.json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST validate coupon (public)
router.post('/validate', protect, async (req, res, next) => {
  try {
    const { code, cartTotal, cartItems } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Coupon not found' });
    }
    
    const validation = coupon.isValid(req.user._id, cartTotal || 0, cartItems || []);
    if (!validation.valid) {
      return res.status(400).json({ success: false, message: validation.message });
    }
    
    const discount = coupon.calculateDiscount(cartTotal || 0, cartItems || []);
    
    res.json({
      success: true,
      data: {
        coupon: {
          _id: coupon._id,
          code: coupon.code,
          type: coupon.type,
          value: coupon.value,
          description: coupon.description
        },
        discount,
        message: 'Coupon is valid'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== COUPON EMAIL SETTINGS ====================

// GET coupon email settings
router.get('/email/settings', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const settings = await CouponEmailSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PUT update coupon email settings
router.put('/email/settings', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    let settings = await CouponEmailSettings.getSettings();
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        settings[key] = req.body[key];
      }
    });
    await settings.save();
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST send test coupon email
router.post('/email/test', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { userId, couponId, templateType } = req.body;
    const emailSent = await couponEmailService.sendCouponEmail(userId, couponId, templateType);
    
    if (emailSent) {
      res.json({ success: true, message: 'Test email sent successfully' });
    } else {
      res.status(500).json({ success: false, message: 'Failed to send test email' });
    }
  } catch (error) {
    next(error);
  }
});

module.exports = router;
