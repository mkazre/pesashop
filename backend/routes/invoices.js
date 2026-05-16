const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Settings = require('../models/Settings');
const pdfService = require('../services/pdfService');

function toInvoiceNumber(orderNumber) {
  if (!orderNumber) return null;
  return String(orderNumber).replace(/^#?ORD-?/i, 'INV-');
}

async function loadOrderForUser(orderId, user) {
  const order = await Order.findById(orderId).populate('customer', 'firstName lastName email phone');
  if (!order) return null;
  const isAdmin = ['admin', 'shop_manager', 'superadmin', 'super_admin'].includes(user.role);
  const isOwner = String(order.customer?._id || order.customer) === String(user.id || user._id);
  if (!isAdmin && !isOwner) return 'forbidden';
  return order;
}

async function resolveLogoPath() {
  const settings = await Settings.getSettings();
  let logoPath = null;
  if (settings?.storeLogo) {
    // storeLogo could be "/uploads/xyz.png" or just "xyz.png"
    const candidate = settings.storeLogo.startsWith('/')
      ? path.join(__dirname, '..', settings.storeLogo)
      : path.join(__dirname, '..', 'uploads', settings.storeLogo);
    if (fs.existsSync(candidate)) logoPath = candidate;
  }
  // Fallback: look for a logo file in uploads root
  if (!logoPath) {
    const fallbacks = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg', 'logo.webp'];
    for (const f of fallbacks) {
      const candidate = path.join(__dirname, '..', 'uploads', f);
      if (fs.existsSync(candidate)) { logoPath = candidate; break; }
    }
  }
  return logoPath;
}

// ─── Customer ───────────────────────────────────────────────────

// GET /api/invoices/mine — list invoices for the logged-in customer
router.get('/mine', protect, async (req, res) => {
  try {
    const orders = await Order.find({ customer: req.user.id })
      .select('orderNumber total subtotal createdAt status paymentStatus')
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();
    const invoices = orders.map(o => ({
      orderId: o._id,
      orderNumber: o.orderNumber,
      invoiceNumber: toInvoiceNumber(o.orderNumber),
      total: o.total,
      createdAt: o.createdAt,
      status: o.status,
      paymentStatus: o.paymentStatus
    }));
    res.json({ success: true, data: invoices });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/invoices/order/:orderId — generate & return invoice PDF URL (customer or admin)
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const order = await loadOrderForUser(req.params.orderId, req.user);
    if (order === 'forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const settings = await Settings.getSettings();
    const logo = await resolveLogoPath();

    const result = await pdfService.generateInvoicePDF({
      order,
      customer: order.customer,
      company: {
        name: settings?.storeName || 'PesaShop',
        address: settings?.storeAddress,
        phone: settings?.storePhone,
        email: settings?.storeEmail,
        logo
      }
    });

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Invoice generation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/invoices/order/:orderId/download — stream the PDF inline (for direct download)
router.get('/order/:orderId/download', protect, async (req, res) => {
  try {
    const order = await loadOrderForUser(req.params.orderId, req.user);
    if (order === 'forbidden') return res.status(403).json({ success: false, message: 'Forbidden' });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const settings = await Settings.getSettings();
    const logo = await resolveLogoPath();

    const result = await pdfService.generateInvoicePDF({
      order,
      customer: order.customer,
      company: {
        name: settings?.storeName || 'PesaShop',
        address: settings?.storeAddress,
        phone: settings?.storePhone,
        email: settings?.storeEmail,
        logo
      }
    });

    const fullPath = path.join(__dirname, '..', result.url);
    if (!fs.existsSync(fullPath)) return res.status(500).json({ success: false, message: 'Invoice file missing after generation' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err) {
    console.error('Invoice download error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
