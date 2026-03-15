const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Role = require('../models/Role');
const Order = require('../models/Order');

// GET all users (admin list with filters)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search;
    const role = req.query.role;
    const status = req.query.status;
    const sort = req.query.sort || '-createdAt';

    const query = {};
    if (role) query.role = role;
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .populate('customRole', 'name slug')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET user stats (counts by role)
router.get('/stats', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalActive = await User.countDocuments({ isActive: true });
    const totalInactive = await User.countDocuments({ isActive: false });
    const roleCounts = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);
    const byRole = {};
    roleCounts.forEach(r => { byRole[r._id] = r.count; });

    // Recent signups (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const recentSignups = await User.countDocuments({ createdAt: { $gte: thirtyDaysAgo } });

    res.json({
      success: true,
      data: { totalUsers, totalActive, totalInactive, byRole, recentSignups },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET single user
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire')
      .populate('customRole', 'name slug permissions')
      .lean();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Get order stats
    const orderStats = await Order.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: '$totalAmount' } } },
    ]);

    user.orderStats = orderStats[0] || { count: 0, total: 0 };

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST create user (admin can create admins, managers, customers)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, customRole, isActive, customerGroup } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ success: false, message: 'Email, password, first name and last name are required' });
    }

    // Check if email already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A user with this email already exists' });
    }

    const userData = {
      email,
      password,
      firstName,
      lastName,
      phone: phone || undefined,
      role: role || 'customer',
      isActive: isActive !== undefined ? isActive : true,
      customerGroup: customerGroup || 'retail',
    };

    if (customRole) userData.customRole = customRole;

    const user = await User.create(userData);
    const created = await User.findById(user._id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .lean();

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT update user
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Prevent demoting yourself
    if (req.params.id === req.user._id.toString() && req.body.role && req.body.role !== user.role) {
      return res.status(400).json({ success: false, message: 'Cannot change your own role' });
    }

    const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'role', 'customRole', 'isActive', 'customerGroup', 'loyaltyPoints', 'loyaltyPointsBanned'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // Handle password reset by admin
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();
    const updated = await User.findById(user._id)
      .select('-password -resetPasswordToken -resetPasswordExpire')
      .populate('customRole', 'name slug')
      .lean();

    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE user
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT toggle user active status
router.put('/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: { isActive: user.isActive } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
