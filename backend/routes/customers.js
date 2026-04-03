const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Order = require('../models/Order');
const { LoyaltyPoint } = require('../models/LoyaltyPoint');
const Laybye = require('../models/Laybye');
const { Coupon, GiftCard } = require('../models/Coupon');
const Review = require('../models/Review');
const { USER_ROLES } = require('../config/constants');

// GET all customers (with filters and pagination)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const query = { role: USER_ROLES.CUSTOMER };
    
    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    // Customer group filter
    if (req.query.group) {
      query.customerGroup = req.query.group;
    }
    
    // Active status filter
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const customers = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    const pages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: customers,
      pagination: {
        total,
        page,
        pages,
        limit,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET single customer with all related data
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire');
    
    if (!customer || customer.role !== USER_ROLES.CUSTOMER) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Get related data
    const [orders, loyaltyPoints, laybyes, coupons, giftCards, reviews] = await Promise.all([
      Order.find({ customer: customer._id }).sort({ createdAt: -1 }).limit(50),
      LoyaltyPoint.find({ user: customer._id }).sort({ createdAt: -1 }).limit(50),
      Laybye.find({ customer: customer._id }).sort({ createdAt: -1 }).populate('order'),
      Coupon.find({ 'usedBy.user': customer._id }).sort({ createdAt: -1 }),
      GiftCard.find({ purchasedBy: customer._id }).sort({ createdAt: -1 }),
      Review.find({ user: customer._id }).sort({ createdAt: -1 }).populate('product')
    ]);
    
    // Calculate statistics
    const totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const totalLoyaltyPoints = loyaltyPoints
      .filter(p => p.type === 'earned')
      .reduce((sum, p) => sum + (p.points || 0), 0) -
      loyaltyPoints
      .filter(p => p.type === 'redeemed')
      .reduce((sum, p) => sum + (p.points || 0), 0);
    
    res.json({
      success: true,
      data: {
        customer,
        relatedData: {
          orders,
          loyaltyPoints,
          laybyes,
          coupons,
          giftCards,
          reviews
        },
        statistics: {
          totalSpent,
          totalOrders,
          totalLoyaltyPoints,
          averageOrderValue: totalOrders > 0 ? totalSpent / totalOrders : 0
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST create new customer
router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      customerGroup,
      addresses,
      isActive,
      isEmailVerified,
      preferences
    } = req.body;
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    
    const customer = await User.create({
      email: email.toLowerCase(),
      password: password || 'TempPassword123!', // Default password, should be changed
      firstName,
      lastName,
      phone,
      role: USER_ROLES.CUSTOMER,
      customerGroup: customerGroup || 'retail',
      addresses: addresses || [],
      isActive: isActive !== undefined ? isActive : true,
      isEmailVerified: isEmailVerified || false,
      preferences: preferences || {}
    });
    
    // Remove password from response
    customer.password = undefined;
    
    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

// PUT update customer
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id);
    
    if (!customer || customer.role !== USER_ROLES.CUSTOMER) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      customerGroup,
      addresses,
      isActive,
      isEmailVerified,
      loyaltyPoints,
      totalSpent,
      orderCount,
      preferences
    } = req.body;
    
    // Check email uniqueness if changed
    if (email && email.toLowerCase() !== customer.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      customer.email = email.toLowerCase();
    }
    
    // Update fields
    if (firstName !== undefined) customer.firstName = firstName;
    if (lastName !== undefined) customer.lastName = lastName;
    if (phone !== undefined) customer.phone = phone;
    if (customerGroup !== undefined) customer.customerGroup = customerGroup;
    if (addresses !== undefined) customer.addresses = addresses;
    if (isActive !== undefined) customer.isActive = isActive;
    if (isEmailVerified !== undefined) customer.isEmailVerified = isEmailVerified;
    if (loyaltyPoints !== undefined) customer.loyaltyPoints = loyaltyPoints;
    if (totalSpent !== undefined) customer.totalSpent = totalSpent;
    if (orderCount !== undefined) customer.orderCount = orderCount;
    if (preferences !== undefined) customer.preferences = { ...customer.preferences, ...preferences };
    
    // Update password if provided
    if (password) {
      customer.password = password;
    }
    
    await customer.save();
    
    // Remove password from response
    customer.password = undefined;
    
    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

// DELETE customer
router.delete('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res, next) => {
  try {
    const customer = await User.findById(req.params.id);
    
    if (!customer || customer.role !== USER_ROLES.CUSTOMER) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }
    
    // Check if customer has orders (optional: prevent deletion if has orders)
    const orderCount = await Order.countDocuments({ customer: customer._id });
    if (orderCount > 0 && !req.query.force) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer with ${orderCount} order(s). Use ?force=true to force delete.`
      });
    }
    
    // Delete related data if force delete
    if (req.query.force === 'true') {
      await Promise.all([
        Order.deleteMany({ customer: customer._id }),
        LoyaltyPoint.deleteMany({ user: customer._id }),
        Laybye.deleteMany({ customer: customer._id }),
        Review.deleteMany({ user: customer._id })
      ]);
    }
    
    await User.findByIdAndDelete(customer._id);
    
  res.json({ 
    success: true, 
      message: 'Customer deleted successfully'
  });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
