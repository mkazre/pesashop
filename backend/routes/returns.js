const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Return = require('../models/Return');
const Order = require('../models/Order');
const returnService = require('../services/returnService');

// Disk storage for return uploads — saved per-customer
const uploadDir = path.join(__dirname, '..', 'uploads', 'returns');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-50);
    cb(null, `${req.user.id}-${Date.now()}-${file.fieldname}-${safe}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'];
    if (ok.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WebP or PDF allowed'));
  }
});

const returnUpload = upload.fields([
  { name: 'invoice', maxCount: 1 },
  { name: 'photos', maxCount: 5 }
]);

// ─── Customer ───────────────────────────────────────────────────

// GET /api/returns/eligibility/:orderId — check if order is returnable
router.get('/eligibility/:orderId', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.orderId, customer: req.user.id }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    const eligibility = returnService.isEligibleForReturn(order);
    const existing = await Return.findOne({ order: order._id, status: { $nin: ['rejected', 'closed'] } }).lean();
    res.json({
      success: true,
      data: {
        eligible: eligibility.ok && !existing,
        reason: existing ? 'An active return request already exists for this order.' : eligibility.reason,
        existingReturn: existing
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns — create a return request (multipart form-data)
router.post('/', protect, returnUpload, async (req, res) => {
  try {
    const { orderId, reason, reasonCategory, customerNotes, refundMethod } = req.body;
    let items;
    try { items = typeof req.body.items === 'string' ? JSON.parse(req.body.items) : req.body.items; } catch { items = null; }

    if (!orderId || !items?.length || !reason) {
      return res.status(400).json({ success: false, message: 'orderId, items, and reason are required' });
    }
    if (!req.files?.invoice?.[0]) {
      return res.status(400).json({ success: false, message: 'Proof of purchase (invoice) is required. Returns are only processed for purchases we can verify.' });
    }

    const order = await Order.findOne({ _id: orderId, customer: req.user.id });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const eligibility = returnService.isEligibleForReturn(order);
    if (!eligibility.ok) return res.status(400).json({ success: false, message: eligibility.reason });

    const existing = await Return.findOne({ order: order._id, status: { $nin: ['rejected', 'closed'] } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An active return already exists for this order.' });
    }

    const invoiceUrl = `/uploads/returns/${path.basename(req.files.invoice[0].path)}`;
    const photos = (req.files.photos || []).map(f => `/uploads/returns/${path.basename(f.path)}`);

    const enrichedItems = items.map(i => {
      const orderItem = order.items.find(oi => String(oi._id) === String(i.orderItem) || String(oi.product) === String(i.product));
      const unitPrice = orderItem?.salePrice || orderItem?.price || i.unitPrice || 0;
      const qty = Math.min(i.quantity || 1, orderItem?.quantity || i.quantity || 1);
      return {
        product: orderItem?.product || i.product,
        orderItem: orderItem?._id,
        name: orderItem?.name || i.name,
        sku: orderItem?.sku,
        quantity: qty,
        unitPrice,
        total: unitPrice * qty,
        reason: i.reason || reason,
        condition: i.condition || 'opened',
        restock: i.restock !== false
      };
    });

    const refundAmount = enrichedItems.reduce((s, i) => s + i.total, 0);

    const rma = await Return.create({
      order: order._id,
      customer: req.user.id,
      items: enrichedItems,
      reason,
      reasonCategory: reasonCategory || 'other',
      customerNotes,
      photos,
      invoiceUrl,
      refundMethod: refundMethod || 'pesa_coins',
      refundAmount
    });

    returnService.notifyCustomer(rma, 'requested').catch(() => {});
    returnService.notifyAdmin(rma).catch(() => {});

    res.status(201).json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/mine — customer's returns
router.get('/mine', protect, async (req, res) => {
  try {
    const returns = await Return.find({ customer: req.user.id })
      .populate('order', 'orderNumber total createdAt')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: returns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/:id — customer or admin
router.get('/:id', protect, async (req, res) => {
  try {
    const rma = await Return.findById(req.params.id).populate('order', 'orderNumber total items createdAt');
    if (!rma) return res.status(404).json({ success: false, message: 'Return not found' });
    const isOwner = String(rma.customer) === String(req.user.id);
    const isAdmin = ['admin', 'shop_manager', 'superadmin', 'super_admin'].includes(req.user.role);
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Forbidden' });
    res.json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/returns/:id/dispute — open dispute on rejected return
router.post('/:id/dispute', protect, async (req, res) => {
  try {
    const rma = await Return.findOne({ _id: req.params.id, customer: req.user.id });
    if (!rma) return res.status(404).json({ success: false, message: 'Return not found' });
    if (rma.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only rejected returns can be disputed' });
    }
    rma.status = 'disputed';
    rma.disputeReason = req.body.reason || '';
    rma.disputeOpenedAt = new Date();
    await rma.save();
    res.json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin ──────────────────────────────────────────────────────

// GET /api/returns/admin/all — list all returns
router.get('/admin/all', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.reasonCategory) query.reasonCategory = req.query.reasonCategory;
    const returns = await Return.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('order', 'orderNumber total')
      .sort({ createdAt: -1 })
      .limit(parseInt(req.query.limit) || 100);
    res.json({ success: true, data: returns });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/returns/admin/stats — analytics
router.get('/admin/stats', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const [byStatus, byReason, totalRefunded] = await Promise.all([
      Return.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Return.aggregate([{ $group: { _id: '$reasonCategory', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Return.aggregate([{ $match: { refundedAt: { $ne: null } } }, { $group: { _id: null, total: { $sum: '$refundAmount' } } }])
    ]);
    res.json({
      success: true,
      data: {
        byStatus,
        byReason,
        totalRefunded: totalRefunded[0]?.total || 0
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/returns/admin/:id/approve
router.put('/admin/:id/approve', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const rma = await Return.findById(req.params.id);
    if (!rma) return res.status(404).json({ success: false, message: 'Return not found' });
    if (!['requested', 'disputed'].includes(rma.status)) {
      return res.status(400).json({ success: false, message: 'Only requested or disputed returns can be approved' });
    }
    rma.status = 'awaiting_shipment';
    rma.approvedBy = req.user.id;
    rma.approvedAt = new Date();
    if (req.body.adminNotes) rma.adminNotes = req.body.adminNotes;
    if (req.body.refundMethod) rma.refundMethod = req.body.refundMethod;
    if (typeof req.body.refundAmount === 'number') rma.refundAmount = req.body.refundAmount;
    await rma.save();
    returnService.notifyCustomer(rma, 'approved').catch(() => {});
    res.json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/returns/admin/:id/reject
router.put('/admin/:id/reject', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const rma = await Return.findById(req.params.id);
    if (!rma) return res.status(404).json({ success: false, message: 'Return not found' });
    if (!['requested', 'disputed'].includes(rma.status)) {
      return res.status(400).json({ success: false, message: 'Cannot reject in current state' });
    }
    rma.status = 'rejected';
    rma.rejectionReason = req.body.reason || 'Not eligible';
    rma.adminNotes = req.body.adminNotes || rma.adminNotes;
    await rma.save();
    returnService.notifyCustomer(rma, 'rejected').catch(() => {});
    res.json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/returns/admin/:id/mark-received
router.put('/admin/:id/mark-received', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const rma = await Return.findById(req.params.id);
    if (!rma) return res.status(404).json({ success: false, message: 'Return not found' });
    rma.status = 'received';
    rma.receivedAt = new Date();
    await rma.save();
    await returnService.restockItems(rma);
    returnService.notifyCustomer(rma, 'received').catch(() => {});
    res.json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/returns/admin/:id/refund — issue refund
router.put('/admin/:id/refund', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const rma = await Return.findById(req.params.id);
    if (!rma) return res.status(404).json({ success: false, message: 'Return not found' });
    if (!['received', 'approved', 'awaiting_shipment'].includes(rma.status)) {
      return res.status(400).json({ success: false, message: 'Mark as received before refunding' });
    }
    if (req.body.refundMethod) rma.refundMethod = req.body.refundMethod;
    if (typeof req.body.refundAmount === 'number') rma.refundAmount = req.body.refundAmount;
    rma.status = 'refunded';
    await returnService.issueRefund(rma);
    returnService.notifyCustomer(rma, 'refunded').catch(() => {});
    res.json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/returns/admin/:id/close
router.put('/admin/:id/close', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const rma = await Return.findById(req.params.id);
    if (!rma) return res.status(404).json({ success: false, message: 'Return not found' });
    rma.status = 'closed';
    rma.closedAt = new Date();
    if (req.body.adminNotes) rma.adminNotes = req.body.adminNotes;
    await rma.save();
    returnService.notifyCustomer(rma, 'closed').catch(() => {});
    res.json({ success: true, data: rma });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
