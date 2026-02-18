const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const LaybyTransaction = require('../models/LaybyTransaction');

// ─── ADMIN: Get all transactions (master log) ───
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, customerId, laybyeId, startDate, endDate } = req.query;
    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (customerId) query.customer = customerId;
    if (laybyeId) query.laybye = laybyeId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const total = await LaybyTransaction.countDocuments(query);
    const transactions = await LaybyTransaction.find(query)
      .populate('laybye', 'totalAmount remainingAmount status')
      .populate('customer', 'firstName lastName email')
      .populate('order', 'orderNumber')
      .populate('recordedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    // Calculate summary stats
    const allTransactions = await LaybyTransaction.find(query);
    const summary = {
      totalReceived: allTransactions.filter(t => t.amount > 0 && t.status === 'completed').reduce((sum, t) => sum + t.amount, 0),
      totalRefunded: allTransactions.filter(t => t.amount < 0 && t.status === 'completed').reduce((sum, t) => sum + Math.abs(t.amount), 0),
      totalTransactions: total,
      byType: {}
    };

    allTransactions.forEach(t => {
      if (!summary.byType[t.type]) summary.byType[t.type] = { count: 0, total: 0 };
      summary.byType[t.type].count++;
      summary.byType[t.type].total += t.amount;
    });

    res.json({
      success: true,
      data: transactions,
      summary,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── CUSTOMER: Get my transactions ───
router.get('/my-transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const query = { customer: req.user._id };

    const total = await LaybyTransaction.countDocuments(query);
    const transactions = await LaybyTransaction.find(query)
      .populate('laybye', 'totalAmount remainingAmount status')
      .populate('order', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: transactions,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get my transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Get transactions for a specific laybye ───
router.get('/laybye/:laybyeId', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const transactions = await LaybyTransaction.find({ laybye: req.params.laybyeId })
      .populate('customer', 'firstName lastName email')
      .populate('recordedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error('Get laybye transactions error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
