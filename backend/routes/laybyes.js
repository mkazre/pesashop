const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Laybye = require('../models/Laybye');
const LaybyPlan = require('../models/LaybyPlan');
const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const { LAYBYE_STATUS } = require('../config/constants');
const LaybyTransaction = require('../models/LaybyTransaction');

// ─── CUSTOMER: Get my laybyes (MUST be before /:id routes) ───
router.get('/my-laybyes', protect, async (req, res, next) => {
  try {
    const laybyes = await Laybye.find({ customer: req.user._id })
      .populate('laybyPlan', 'name description')
      .populate('order', 'orderNumber total')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: laybyes });
  } catch (error) {
    next(error);
  }
});

// ─── CUSTOMER: Get single laybye detail ───
router.get('/my-laybyes/:id', protect, async (req, res, next) => {
  try {
    const laybye = await Laybye.findOne({ _id: req.params.id, customer: req.user._id })
      .populate('laybyPlan')
      .populate('order', 'orderNumber total status');

    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }

    res.json({ success: true, data: laybye });
  } catch (error) {
    next(error);
  }
});

// ─── CUSTOMER: Self-service payment ───
// paymentMethod: 'eft' | 'cash' | 'online'
// EFT and cash payments are saved as 'pending' — admin must verify funds before completing.
// Only 'online' (gateway) payments are auto-completed (future: gateway callback will confirm).
router.post('/my-laybyes/:id/pay', protect, async (req, res, next) => {
  try {
    const laybye = await Laybye.findOne({ _id: req.params.id, customer: req.user._id });
    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }

    if (laybye.status !== LAYBYE_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: 'Cannot make payment on inactive laybye' });
    }

    const { amount, paymentMethod, transactionId, note } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }

    if (amount > laybye.remainingAmount + 0.01) {
      return res.status(400).json({ success: false, message: 'Payment amount exceeds remaining balance' });
    }

    const method = paymentMethod || 'cash';
    // EFT and cash are pending until admin verifies; online is completed (gateway will confirm)
    const isPending = method !== 'online';
    const paymentStatus = isPending ? 'pending' : 'completed';

    const balanceBefore = laybye.remainingAmount;

    const payment = {
      amount,
      paymentDate: new Date(),
      paymentMethod: method,
      transactionId,
      note: note || '',
      status: paymentStatus
    };

    laybye.payments.push(payment);

    // Only update balances for completed payments (not pending)
    if (!isPending) {
      laybye.paidAmount += amount;
      laybye.remainingAmount = Math.max(0, laybye.remainingAmount - amount);

      if (laybye.remainingAmount <= 0.01) {
        laybye.status = LAYBYE_STATUS.COMPLETED;
        laybye.completedDate = new Date();
        laybye.remainingAmount = 0;
        if (laybye.order) {
          await Order.findByIdAndUpdate(laybye.order, {
            paymentStatus: 'completed',
            status: 'processing'
          });
        }
      } else {
        laybye.calculateNextPaymentDate();
      }
    }

    await laybye.save();

    // Log transaction
    await LaybyTransaction.create({
      laybye: laybye._id,
      customer: req.user._id,
      type: 'installment',
      amount,
      paymentMethod: method,
      transactionId,
      order: laybye.order,
      balanceBefore,
      balanceAfter: isPending ? balanceBefore : laybye.remainingAmount,
      status: paymentStatus,
      note: note || '',
      source: 'customer'
    });

    const message = isPending
      ? 'Payment submitted and awaiting verification. You will be notified once confirmed.'
      : 'Payment recorded successfully';

    res.json({
      success: true,
      data: laybye,
      message
    });
  } catch (error) {
    next(error);
  }
});

// GET all laybyes (with filters)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.customer) {
      query.customer = req.query.customer;
    }
    
    if (req.query.overdue === 'true') {
      query.status = LAYBYE_STATUS.ACTIVE;
      query.nextPaymentDate = { $lt: new Date() };
    }
    
    if (req.query.expired === 'true') {
      query.isExpired = true;
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const laybyes = await Laybye.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('order', 'orderNumber total')
      .populate('laybyPlan', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Laybye.countDocuments(query);
    const pages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: laybyes,
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

// GET single laybye
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const laybye = await Laybye.findById(req.params.id)
      .populate('customer', 'firstName lastName email phone')
      .populate({
        path: 'order',
        populate: {
          path: 'customer',
          select: 'firstName lastName email'
        }
      })
      .populate('laybyPlan')
      .populate('cancelledBy', 'firstName lastName');
    
    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }
    
    res.json({
      success: true,
      data: laybye
    });
  } catch (error) {
    next(error);
  }
});

// POST create laybye (from order or manually)
router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const {
      orderId,
      customerId,
      laybyPlanId,
      totalAmount,
      depositAmount,
      numberOfPayments,
      frequency,
      notes
    } = req.body;
    
    // Get layby plan
    const plan = await LaybyPlan.findById(laybyPlanId);
    if (!plan || !plan.isActive) {
      return res.status(400).json({ success: false, message: 'Invalid or inactive layby plan' });
    }
    
    // Get customer
    const customer = await User.findById(customerId);
    if (!customer || customer.role !== 'customer') {
      return res.status(400).json({ success: false, message: 'Invalid customer' });
    }
    
    // Calculate amounts
    const calculatedDeposit = plan.calculateDeposit(totalAmount);
    const finalDeposit = depositAmount || calculatedDeposit;
    const remaining = totalAmount - finalDeposit;
    const installmentAmount = remaining / numberOfPayments;
    
    // Calculate expiry date if set
    let expiryDate = null;
    if (plan.expiryDays > 0) {
      expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + plan.expiryDays);
    }
    
    // Calculate next payment date
    const startDate = new Date();
    const nextPaymentDate = new Date(startDate);
    switch (frequency) {
      case 'weekly':
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
        break;
      case 'biweekly':
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 14);
        break;
      case 'monthly':
        nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        break;
    }
    
    // Create laybye
    const laybye = new Laybye({
      order: orderId || null,
      customer: customerId,
      laybyPlan: laybyPlanId,
      totalAmount,
      depositAmount: finalDeposit,
      remainingAmount: remaining,
      paidAmount: 0,
      installmentPlan: {
        frequency,
        numberOfPayments,
        installmentAmount
      },
      startDate,
      nextPaymentDate,
      expiryDate,
      holdFunds: plan.holdFunds,
      notes,
      status: LAYBYE_STATUS.ACTIVE
    });
    
    await laybye.save();
    
    // Update order if provided
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        isLaybye: true,
        laybye: laybye._id,
        paymentStatus: 'pending'
      });
    }
    
    // Update plan usage count
    plan.usageCount += 1;
    await plan.save();
    
    res.status(201).json({
      success: true,
      data: laybye,
      message: 'Laybye created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT update laybye
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const laybye = await Laybye.findById(req.params.id);
    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }
    
    const {
      notes,
      adminNotes,
      status,
      nextPaymentDate,
      expiryDate
    } = req.body;
    
    if (notes !== undefined) laybye.notes = notes;
    if (adminNotes !== undefined) laybye.adminNotes = adminNotes;
    if (status !== undefined) laybye.status = status;
    if (nextPaymentDate !== undefined) laybye.nextPaymentDate = new Date(nextPaymentDate);
    if (expiryDate !== undefined) laybye.expiryDate = expiryDate ? new Date(expiryDate) : null;
    
    await laybye.save();
    
    res.json({
      success: true,
      data: laybye,
      message: 'Laybye updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST record payment
router.post('/:id/payments', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const laybye = await Laybye.findById(req.params.id);
    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }
    
    if (laybye.status !== LAYBYE_STATUS.ACTIVE) {
      return res.status(400).json({ success: false, message: 'Cannot record payment for inactive laybye' });
    }
    
    const { amount, paymentMethod, transactionId, note, paymentDate } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid payment amount' });
    }
    
    // Record payment
    const payment = {
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod: paymentMethod || 'manual',
      transactionId,
      status: 'completed',
      note
    };
    
    const balanceBefore = laybye.remainingAmount;
    
    laybye.payments.push(payment);
    laybye.paidAmount += amount;
    laybye.remainingAmount = Math.max(0, laybye.remainingAmount - amount);
    
    // Check if fully paid
    if (laybye.remainingAmount <= 0.01) { // Allow small rounding differences
      laybye.status = LAYBYE_STATUS.COMPLETED;
      laybye.completedDate = new Date();
      laybye.remainingAmount = 0;
      
      // Update order if exists
      if (laybye.order) {
        await Order.findByIdAndUpdate(laybye.order, {
          paymentStatus: 'completed',
          status: 'processing'
        });
      }
    } else {
      // Calculate next payment date
      laybye.calculateNextPaymentDate();
    }
    
    await laybye.save();
    
    // Log transaction
    await LaybyTransaction.create({
      laybye: laybye._id,
      customer: laybye.customer,
      type: laybye.payments.length === 1 ? 'deposit' : 'installment',
      amount,
      paymentMethod: paymentMethod || 'manual',
      transactionId,
      order: laybye.order,
      balanceBefore,
      balanceAfter: laybye.remainingAmount,
      status: 'completed',
      note,
      recordedBy: req.user._id,
      source: 'admin'
    });
    
    res.json({
      success: true,
      data: laybye,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    next(error);
  }
});

// PUT update individual payment status (admin confirms pending payments)
router.put('/:id/payments/:paymentId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const laybye = await Laybye.findById(req.params.id);
    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }

    const payment = laybye.payments.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    const { status } = req.body;
    if (!status || !['completed', 'failed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status. Must be completed, failed, or cancelled.' });
    }

    const oldStatus = payment.status;
    payment.status = status;

    // If confirming a pending payment as completed, update balances
    if (oldStatus === 'pending' && status === 'completed') {
      laybye.paidAmount += payment.amount;
      laybye.remainingAmount = Math.max(0, laybye.remainingAmount - payment.amount);

      // Check if fully paid
      if (laybye.remainingAmount <= 0.01) {
        laybye.status = LAYBYE_STATUS.COMPLETED;
        laybye.completedDate = new Date();
        laybye.remainingAmount = 0;
        if (laybye.order) {
          await Order.findByIdAndUpdate(laybye.order, {
            paymentStatus: 'completed',
            status: 'processing'
          });
        }
      } else {
        laybye.calculateNextPaymentDate();
      }

      // Update the transaction log
      await LaybyTransaction.findOneAndUpdate(
        { laybye: laybye._id, amount: payment.amount, status: 'pending' },
        { status: 'completed', balanceAfter: laybye.remainingAmount }
      );
    }

    // If rejecting a pending payment, just mark it
    if (oldStatus === 'pending' && (status === 'failed' || status === 'cancelled')) {
      await LaybyTransaction.findOneAndUpdate(
        { laybye: laybye._id, amount: payment.amount, status: 'pending' },
        { status }
      );
    }

    await laybye.save();

    res.json({
      success: true,
      data: laybye,
      message: `Payment ${status === 'completed' ? 'confirmed' : status} successfully`
    });
  } catch (error) {
    next(error);
  }
});

// PUT cancel laybye
router.put('/:id/cancel', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const laybye = await Laybye.findById(req.params.id).populate('laybyPlan');
    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }
    
    if (laybye.status === LAYBYE_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Laybye is already cancelled' });
    }
    
    const { reason, keepDeposit } = req.body;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Cancellation reason is required' });
    }
    
    // Calculate refund and fees
    const plan = laybye.laybyPlan;
    let refundAmount = laybye.paidAmount;
    let cancellationFee = 0;
    
    if (keepDeposit) {
      refundAmount = Math.max(0, laybye.paidAmount - laybye.depositAmount);
    }
    
    if (plan) {
      if (plan.cancellationFee > 0) {
        cancellationFee = plan.cancellationFee;
      } else if (plan.cancellationFeePercentage > 0) {
        cancellationFee = (laybye.totalAmount * plan.cancellationFeePercentage) / 100;
      }
      refundAmount = Math.max(0, refundAmount - cancellationFee);
    }
    
    // Cancel laybye
    await laybye.cancel(reason, refundAmount, keepDeposit, req.user._id);
    
    // Update order if exists
    if (laybye.order) {
      await Order.findByIdAndUpdate(laybye.order, {
        status: 'cancelled',
        paymentStatus: 'refunded'
      });
    }
    
    // Log cancellation fee transaction
    if (cancellationFee > 0) {
      await LaybyTransaction.create({
        laybye: laybye._id,
        customer: laybye.customer,
        type: 'cancellation_fee',
        amount: -cancellationFee,
        order: laybye.order,
        balanceBefore: laybye.remainingAmount + cancellationFee,
        balanceAfter: laybye.remainingAmount,
        status: 'completed',
        note: `Cancellation fee: ${reason}`,
        recordedBy: req.user._id,
        source: 'admin'
      });
    }
    
    // Log refund transaction
    if (refundAmount > 0) {
      await LaybyTransaction.create({
        laybye: laybye._id,
        customer: laybye.customer,
        type: 'refund',
        amount: -refundAmount,
        order: laybye.order,
        balanceBefore: 0,
        balanceAfter: 0,
        status: 'completed',
        note: `Refund on cancellation: ${reason}`,
        recordedBy: req.user._id,
        source: 'admin'
      });
    }
    
    res.json({
      success: true,
      data: laybye,
      message: 'Laybye cancelled successfully',
      refundAmount,
      cancellationFee
    });
  } catch (error) {
    next(error);
  }
});

// DELETE laybye (permanent delete)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const laybye = await Laybye.findById(req.params.id);
    if (!laybye) {
      return res.status(404).json({ success: false, message: 'Laybye not found' });
    }
    
    // Update order if exists
    if (laybye.order) {
      await Order.findByIdAndUpdate(laybye.order, {
        isLaybye: false,
        laybye: null
      });
    }
    
    await Laybye.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Laybye deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
