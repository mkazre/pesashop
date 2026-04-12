const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const RecurringOrder = require('../models/RecurringOrder');
const RecurringPlan = require('../models/RecurringPlan');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

// ─── Customer ─────────────────────────────────────────────────────

// GET /api/recurring-orders/mine — customer's recurring orders
router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await RecurringOrder.find({ customer: req.user.id })
      .populate('product', 'name slug featuredImage regularPrice salePrice')
      .populate('recurringPlan', 'name frequency')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/recurring-orders — Create recurring order
router.post('/', protect, async (req, res) => {
  try {
    const {
      productId, variantData, recurringPlanId, frequency,
      quantity, paymentMode, totalInstances, shippingAddress
    } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Check global recurring enabled
    const settings = await Settings.getSettings();
    if (!settings.recurringEnabled) {
      return res.status(400).json({ success: false, message: 'Recurring purchases are not currently available.' });
    }

    // Check max active limit per customer
    const maxActive = settings.recurringMaxActivePerCustomer || 10;
    const activeCount = await RecurringOrder.countDocuments({ customer: req.user.id, status: 'active' });
    if (activeCount >= maxActive) {
      return res.status(400).json({ success: false, message: `You have reached the maximum of ${maxActive} active recurring orders.` });
    }

    // Get plan interval
    let plan = null;
    let intervalDays = 30;
    if (recurringPlanId) {
      plan = await RecurringPlan.findById(recurringPlanId);
      if (plan) intervalDays = plan.intervalDays || 30;
    } else {
      const freqMap = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30, bimonthly: 60, quarterly: 90 };
      intervalDays = freqMap[frequency] || 30;
    }

    const unitPrice = product.salePrice || product.regularPrice;
    const startDate = new Date();
    const nextDeliveryDate = new Date(startDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);

    // Build initial delivery schedule
    const deliveries = [];
    const instanceCount = paymentMode === 'upfront' ? (parseInt(totalInstances) || 2) : 1;
    for (let i = 0; i < instanceCount; i++) {
      deliveries.push({
        scheduledDate: new Date(nextDeliveryDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000),
        status: 'scheduled',
        paymentStatus: paymentMode === 'upfront' ? 'paid' : 'pending'
      });
    }

    const recurringOrder = await RecurringOrder.create({
      customer: req.user.id,
      product: productId,
      productName: product.name,
      productSku: product.sku,
      variant: variantData || null,
      recurringPlan: recurringPlanId || undefined,
      frequency: frequency || (plan && plan.frequency),
      intervalDays,
      quantity: parseInt(quantity) || 1,
      unitPrice,
      paymentMode,
      totalInstances: paymentMode === 'upfront' ? instanceCount : undefined,
      totalAmountPaid: paymentMode === 'upfront' ? unitPrice * (parseInt(quantity) || 1) * instanceCount : 0,
      remainingInstances: paymentMode === 'upfront' ? instanceCount : undefined,
      deliveries,
      startDate,
      nextDeliveryDate,
      nextPaymentDate: paymentMode === 'pay_as_you_go'
        ? new Date(nextDeliveryDate.getTime() - (settings.recurringReminderDays || 3) * 24 * 60 * 60 * 1000)
        : undefined,
      shippingAddress
    });

    res.status(201).json({ success: true, data: recurringOrder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/recurring-orders/:id/pause
router.put('/:id/pause', protect, async (req, res) => {
  try {
    const ro = await RecurringOrder.findOne({ _id: req.params.id, customer: req.user.id });
    if (!ro) return res.status(404).json({ success: false, message: 'Recurring order not found' });
    if (ro.status !== 'active') return res.status(400).json({ success: false, message: 'Only active recurring orders can be paused.' });

    ro.status = 'paused';
    ro.pausedAt = new Date();
    ro.pauseReason = req.body.reason || '';
    await ro.save();

    res.json({ success: true, data: ro });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/recurring-orders/:id/resume
router.put('/:id/resume', protect, async (req, res) => {
  try {
    const ro = await RecurringOrder.findOne({ _id: req.params.id, customer: req.user.id });
    if (!ro) return res.status(404).json({ success: false, message: 'Recurring order not found' });
    if (ro.status !== 'paused') return res.status(400).json({ success: false, message: 'Only paused recurring orders can be resumed.' });

    ro.status = 'active';
    ro.pausedAt = undefined;
    ro.pauseReason = '';
    await ro.save();

    res.json({ success: true, data: ro });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/recurring-orders/:id/cancel
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    // Customers can only cancel their own; admins can cancel any
    if (!['admin', 'shop_manager'].includes(req.user.role)) {
      query.customer = req.user.id;
    }

    const ro = await RecurringOrder.findOne(query);
    if (!ro) return res.status(404).json({ success: false, message: 'Recurring order not found' });

    ro.status = 'cancelled';
    ro.cancelledAt = new Date();
    ro.cancellationReason = req.body.reason || '';
    await ro.save();

    res.json({ success: true, data: ro });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/recurring-orders/:id/update-frequency
router.put('/:id/update-frequency', protect, async (req, res) => {
  try {
    const ro = await RecurringOrder.findOne({ _id: req.params.id, customer: req.user.id });
    if (!ro) return res.status(404).json({ success: false, message: 'Recurring order not found' });

    const { frequency } = req.body;
    const freqMap = { daily: 1, weekly: 7, fortnightly: 14, monthly: 30, bimonthly: 60, quarterly: 90 };
    const intervalDays = freqMap[frequency];
    if (!intervalDays) return res.status(400).json({ success: false, message: 'Invalid frequency.' });

    ro.frequency = frequency;
    ro.intervalDays = intervalDays;
    if (ro.nextDeliveryDate) {
      ro.nextDeliveryDate = new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
    }
    await ro.save();

    res.json({ success: true, data: ro });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin ────────────────────────────────────────────────────────

// GET /api/recurring-orders — All recurring orders (admin)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.paymentMode) query.paymentMode = req.query.paymentMode;
    if (req.query.frequency) query.frequency = req.query.frequency;
    if (req.query.customer) query.customer = req.query.customer;
    if (req.query.dateFrom) query.createdAt = { $gte: new Date(req.query.dateFrom) };
    if (req.query.dateTo) { query.createdAt = { ...(query.createdAt || {}), $lte: new Date(req.query.dateTo) }; }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [orders, total] = await Promise.all([
      RecurringOrder.find(query)
        .populate('customer', 'firstName lastName email')
        .populate('product', 'name slug featuredImage')
        .populate('recurringPlan', 'name')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      RecurringOrder.countDocuments(query)
    ]);

    res.json({ success: true, data: orders, pagination: { total, page, pages: Math.ceil(total / limit), limit } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/recurring-orders/:id — Single order detail (admin)
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const order = await RecurringOrder.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate('product', 'name slug featuredImage regularPrice salePrice')
      .populate('recurringPlan', 'name frequency intervalDays');
    if (!order) return res.status(404).json({ success: false, message: 'Recurring order not found' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/recurring-orders/:id/send-reminder — Manual reminder (admin)
router.post('/:id/send-reminder', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const ro = await RecurringOrder.findById(req.params.id)
      .populate('customer', 'email firstName')
      .populate('product', 'name');
    if (!ro) return res.status(404).json({ success: false, message: 'Recurring order not found' });

    const emailService = require('../services/emailService');
    await emailService.sendTemplatedEmail(
      ro.paymentMode === 'pay_as_you_go' ? 'recurring_payment_reminder' : 'recurring_delivery_upcoming',
      ro.customer.email,
      {
        customerName: ro.customer.firstName,
        productName: ro.product?.name || ro.productName,
        nextDeliveryDate: ro.nextDeliveryDate?.toLocaleDateString() || 'upcoming',
        frequency: ro.frequency,
        quantity: ro.quantity
      }
    );

    ro.lastReminderSentAt = new Date();
    await ro.save();

    res.json({ success: true, message: 'Reminder sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Recurring Plans (admin) ──────────────────────────────────────
// GET /api/recurring-orders/plans/all
router.get('/plans/all', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const plans = await RecurringPlan.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/recurring-orders/plans/active — Public list for frontend widget
router.get('/plans/active', async (req, res) => {
  try {
    const plans = await RecurringPlan.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/plans', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const plan = await RecurringPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put('/plans/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const plan = await RecurringPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: plan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/plans/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await RecurringPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
