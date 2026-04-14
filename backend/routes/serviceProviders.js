const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize, protectProvider, generateToken } = require('../middleware/auth');
const ServiceProviderAd = require('../models/ServiceProviderAd');
const ServiceProvider = require('../models/ServiceProvider');
const ServiceProviderCategory = require('../models/ServiceProviderCategory');
const ServiceProviderSubscriptionPlan = require('../models/ServiceProviderSubscriptionPlan');
const ServiceProviderAdPlacement = require('../models/ServiceProviderAdPlacement');
const ServiceProviderAdOrder = require('../models/ServiceProviderAdOrder');
const emailService = require('../services/emailService');

// Multer for document uploads
const docStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/service-providers');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `sp-doc-${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`);
  }
});
const uploadDocs = multer({ storage: docStorage, limits: { fileSize: 10 * 1024 * 1024 } });

// ═══════════════════════════════════════════════════════════
//  PUBLIC — Application & Auth
// ═══════════════════════════════════════════════════════════

// POST /api/service-providers/apply — Submit application
router.post('/apply', uploadDocs.array('documents', 5), async (req, res) => {
  try {
    const {
      businessName, contactName, email, phone, website, bio,
      categoryId, province, city, serviceAreas, password
    } = req.body;

    const existing = await ServiceProvider.findOne({ email: email?.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

    const docs = (req.files || []).map((f, i) => ({
      type: req.body[`docType_${i}`] || 'other',
      label: req.body[`docLabel_${i}`] || f.originalname,
      url: `/uploads/service-providers/${f.filename}`
    }));

    const provider = await ServiceProvider.create({
      businessName, contactName, email, phone, website, bio,
      category: categoryId, province, city,
      serviceAreas: serviceAreas ? (Array.isArray(serviceAreas) ? serviceAreas : [serviceAreas]) : [],
      password,
      documents: docs,
      applicationStatus: 'pending'
    });

    // Send confirmation email
    try {
      await emailService.sendTemplatedEmail('service_provider_application_received', email, {
        businessName,
        contactName
      });
    } catch (e) { console.error('Application email error:', e.message); }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. We will review your application and contact you shortly.',
      data: { id: provider._id, email: provider.email, status: provider.applicationStatus }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-providers/categories — Public list of SP categories
router.get('/categories', async (req, res) => {
  try {
    const cats = await ServiceProviderCategory.find({ isActive: true }).sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: cats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-providers/plans/public — Public subscription plans
router.get('/plans/public', async (req, res) => {
  try {
    const plans = await ServiceProviderSubscriptionPlan.find({ isActive: true }).sort({ displayOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  PROVIDER PORTAL — Self-Service Auth & Dashboard
// ═══════════════════════════════════════════════════════════

// POST /api/service-providers/portal/login
router.post('/portal/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const provider = await ServiceProvider.findOne({ email: email.toLowerCase() }).select('+password');
    if (!provider) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await provider.comparePassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    if (provider.applicationStatus !== 'approved') {
      return res.status(403).json({ success: false, message: `Your application status is "${provider.applicationStatus}". Only approved providers can access the portal.` });
    }
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: provider._id, type: 'service_provider' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      success: true,
      token,
      provider: {
        _id: provider._id,
        businessName: provider.businessName,
        contactName: provider.contactName,
        email: provider.email,
        logo: provider.logo,
        applicationStatus: provider.applicationStatus,
        subscriptionStatus: provider.subscriptionStatus,
        subscriptionExpiry: provider.subscriptionExpiry
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-providers/me — Provider's own profile
router.get('/me', protectProvider, async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.provider._id)
      .populate('category', 'name icon')
      .populate('subscriptionPlan', 'name price billingCycle featuresIncluded maxActiveAds')
      .select('-password');
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-providers/me/ads — Provider's own ads
router.get('/me/ads', protectProvider, async (req, res) => {
  try {
    const ads = await ServiceProviderAd.find({ provider: req.provider._id })
      .sort({ createdAt: -1 })
      .populate('placementSlot', 'slotLabel slotPage');
    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/service-providers/me/ads — Create ad request
router.post('/me/ads', protectProvider, async (req, res) => {
  try {
    const { title, body, ctaText, ctaUrl, imageUrl, placementSlot, startDate, endDate, aiKeywords } = req.body;
    const ad = await ServiceProviderAd.create({
      provider: req.provider._id,
      title, body, ctaText, ctaUrl, imageUrl,
      placementSlot,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      aiKeywords: aiKeywords || [],
      status: 'pending'
    });
    res.status(201).json({ success: true, data: ad, message: 'Ad submitted for review. You will be notified when it is approved.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-providers/portal/slots — Available ad slots (for providers)
router.get('/portal/slots', protectProvider, async (req, res) => {
  try {
    const slots = await ServiceProviderAdPlacement.find({ isActive: true }).sort({ slotPage: 1, slotLabel: 1 });
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN — Provider Management
// ═══════════════════════════════════════════════════════════

// GET /api/service-providers — All providers (admin)
router.get('/', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.applicationStatus = req.query.status;
    if (req.query.category) query.category = req.query.category;
    if (req.query.subscriptionStatus) query.subscriptionStatus = req.query.subscriptionStatus;
    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      query.$or = [{ businessName: re }, { email: re }, { contactName: re }];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      ServiceProvider.find(query)
        .populate('category', 'name icon')
        .populate('subscriptionPlan', 'name price billingCycle')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password'),
      ServiceProvider.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: providers,
      pagination: { total, page, pages: Math.ceil(total / limit), limit }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-providers/:id — Single provider detail (admin)
router.get('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const provider = await ServiceProvider.findById(req.params.id)
      .populate('category', 'name icon keywords')
      .populate('subscriptionPlan', 'name price billingCycle featuresIncluded maxActiveAds')
      .select('-password');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-providers/:id/approve — Approve application
router.put('/:id/approve', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const provider = await ServiceProvider.findByIdAndUpdate(req.params.id, {
      applicationStatus: 'approved',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      reviewNotes: req.body.notes || ''
    }, { new: true }).select('-password');

    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    try {
      await emailService.sendTemplatedEmail('service_provider_approved', provider.email, {
        businessName: provider.businessName,
        contactName: provider.contactName,
        portalUrl: `${process.env.FRONTEND_URL}/service-providers/dashboard`
      });
    } catch (e) { console.error('Approval email error:', e.message); }

    res.json({ success: true, data: provider, message: 'Provider approved successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-providers/:id/reject — Reject application
router.put('/:id/reject', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const provider = await ServiceProvider.findByIdAndUpdate(req.params.id, {
      applicationStatus: 'rejected',
      reviewedBy: req.user.id,
      reviewedAt: new Date(),
      rejectionReason: req.body.reason || '',
      reviewNotes: req.body.notes || ''
    }, { new: true }).select('-password');

    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });

    try {
      await emailService.sendTemplatedEmail('service_provider_rejected', provider.email, {
        businessName: provider.businessName,
        contactName: provider.contactName,
        reason: req.body.reason || ''
      });
    } catch (e) { console.error('Rejection email error:', e.message); }

    res.json({ success: true, data: provider, message: 'Provider application rejected.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-providers/:id/suspend — Suspend provider
router.put('/:id/suspend', protect, authorize('admin'), async (req, res) => {
  try {
    const provider = await ServiceProvider.findByIdAndUpdate(req.params.id, {
      applicationStatus: 'suspended',
      isActive: false
    }, { new: true }).select('-password');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-providers/:id/subscription — Update subscription (admin)
router.put('/:id/subscription', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const { planId, status, startDate, expiryDate } = req.body;
    const update = {};
    if (planId) update.subscriptionPlan = planId;
    if (status) update.subscriptionStatus = status;
    if (startDate) update.subscriptionStartDate = new Date(startDate);
    if (expiryDate) update.subscriptionExpiry = new Date(expiryDate);

    const provider = await ServiceProvider.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-providers/:id — General update (admin)
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const allowed = ['businessName', 'contactName', 'phone', 'website', 'bio', 'province', 'city', 'serviceAreas', 'isVerified', 'isActive', 'category'];
    const update = {};
    for (const f of allowed) { if (req.body[f] !== undefined) update[f] = req.body[f]; }
    const provider = await ServiceProvider.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    if (!provider) return res.status(404).json({ success: false, message: 'Provider not found' });
    res.json({ success: true, data: provider });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/service-providers/:id — Delete provider (admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await ServiceProvider.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Provider deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN — Categories, Plans & Ad Slots Management
// ═══════════════════════════════════════════════════════════

// Categories CRUD
router.get('/admin/categories', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const cats = await ServiceProviderCategory.find().sort({ displayOrder: 1, name: 1 });
    res.json({ success: true, data: cats });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/admin/categories', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const cat = await ServiceProviderCategory.create(req.body);
    res.status(201).json({ success: true, data: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put('/admin/categories/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const cat = await ServiceProviderCategory.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: cat });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.delete('/admin/categories/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await ServiceProviderCategory.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Subscription Plans CRUD
router.get('/admin/plans', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const plans = await ServiceProviderSubscriptionPlan.find().sort({ displayOrder: 1 });
    res.json({ success: true, data: plans });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/admin/plans', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const plan = await ServiceProviderSubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put('/admin/plans/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const plan = await ServiceProviderSubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: plan });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.delete('/admin/plans/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await ServiceProviderSubscriptionPlan.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// Ad Placement Slots CRUD
router.get('/admin/slots', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const slots = await ServiceProviderAdPlacement.find().sort({ slotPage: 1, displayOrder: 1 });
    res.json({ success: true, data: slots });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.post('/admin/slots', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const slot = await ServiceProviderAdPlacement.create(req.body);
    res.status(201).json({ success: true, data: slot });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});
router.put('/admin/slots/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const slot = await ServiceProviderAdPlacement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, data: slot });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/service-providers/admin/create — Admin creates a provider directly (JSON, pre-approved)
router.post('/admin/create', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const { businessName, contactName, email, phone, website, bio, categoryId, province, city, serviceAreas, serviceModes, password } = req.body;
    if (!email || !businessName || !password) {
      return res.status(400).json({ success: false, message: 'businessName, email and password are required' });
    }
    const existing = await ServiceProvider.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

    const provider = await ServiceProvider.create({
      businessName, contactName, email, phone, website, bio,
      category: categoryId || null,
      province, city,
      serviceAreas: Array.isArray(serviceAreas) ? serviceAreas : (serviceAreas ? [serviceAreas] : []),
      serviceModes: Array.isArray(serviceModes) ? serviceModes : [],
      password,
      applicationStatus: 'approved',
      createdByAdmin: true,
    });

    res.status(201).json({ success: true, data: provider, message: 'Provider created and pre-approved.' });
  } catch (err) {
    console.error('Admin create provider error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  PROVIDER PORTAL — Ad Orders (Self-Service Checkout)
// ═══════════════════════════════════════════════════════════

// Helper: calculate end date from start date + quantity * durationType
function calcEndDate(start, durationType, quantity) {
  const d = new Date(start);
  switch (durationType) {
    case 'daily':   d.setDate(d.getDate() + quantity); break;
    case 'weekly':  d.setDate(d.getDate() + (quantity * 7)); break;
    case 'monthly': d.setMonth(d.getMonth() + quantity); break;
    case 'yearly':  d.setFullYear(d.getFullYear() + quantity); break;
  }
  return d;
}

// POST /api/service-providers/portal/ad-orders — Provider creates an ad order
router.post('/portal/ad-orders', protectProvider, async (req, res) => {
  try {
    const { slotId, durationType, quantity = 1, paymentMethod = 'eft', notes = '' } = req.body;

    if (!slotId || !durationType) {
      return res.status(400).json({ success: false, message: 'slotId and durationType are required' });
    }

    // Look up slot
    const slot = await ServiceProviderAdPlacement.findOne({ slotId, isActive: true });
    if (!slot) return res.status(404).json({ success: false, message: 'Ad slot not found or inactive' });

    // Resolve unit price from durationType
    const rateMap = { daily: slot.dailyRate, weekly: slot.weeklyRate, monthly: slot.monthlyRate, yearly: slot.yearlyRate };
    const unitPrice = rateMap[durationType] || 0;
    if (unitPrice <= 0) {
      return res.status(400).json({ success: false, message: `No rate configured for durationType "${durationType}" on this slot` });
    }

    const qty = Math.max(1, parseInt(quantity));
    const totalAmount = unitPrice * qty;
    const startDate = new Date();
    const endDate = calcEndDate(startDate, durationType, qty);

    const order = await ServiceProviderAdOrder.create({
      provider: req.provider._id,
      slotId: slot.slotId,
      slotLabel: slot.slotLabel,
      slotPage: slot.slotPage,
      durationType,
      quantity: qty,
      unitPrice,
      totalAmount,
      paymentMethod,
      notes,
      startDate,
      endDate,
      status: 'pending_payment',
    });

    res.status(201).json({ success: true, data: order, message: 'Ad order placed. Awaiting payment confirmation.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-providers/portal/ad-orders — Provider gets their own orders
router.get('/portal/ad-orders', protectProvider, async (req, res) => {
  try {
    const orders = await ServiceProviderAdOrder.find({ provider: req.provider._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN — Ad Orders Management
// ═══════════════════════════════════════════════════════════

// GET /api/service-providers/ad-orders — Admin list all ad orders
router.get('/ad-orders', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      ServiceProviderAdOrder.find(query)
        .populate('provider', 'businessName contactName email')
        .populate('activatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ServiceProviderAdOrder.countDocuments(query),
    ]);

    // Stats
    const [pendingCount, activeCount] = await Promise.all([
      ServiceProviderAdOrder.countDocuments({ status: 'pending_payment' }),
      ServiceProviderAdOrder.countDocuments({ status: 'active' }),
    ]);
    const revenueAgg = await ServiceProviderAdOrder.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      success: true,
      data: orders,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
      stats: { pendingCount, activeCount, totalRevenue },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-providers/ad-orders/:orderId/activate — Admin activates an order
router.put('/ad-orders/:orderId/activate', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const order = await ServiceProviderAdOrder.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.status = 'active';
    order.activatedBy = req.user.id;
    order.activatedAt = new Date();
    await order.save();

    // Update provider subscription status
    await ServiceProvider.findByIdAndUpdate(order.provider, {
      subscriptionStatus: 'active',
      subscriptionExpiry: order.endDate,
    });

    await order.populate('provider', 'businessName contactName email');
    res.json({ success: true, data: order, message: 'Ad order activated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-providers/ad-orders/:orderId/decline — Admin declines an order
router.put('/ad-orders/:orderId/decline', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { reason = '' } = req.body;
    const order = await ServiceProviderAdOrder.findByIdAndUpdate(
      req.params.orderId,
      { status: 'declined', declineReason: reason },
      { new: true }
    ).populate('provider', 'businessName contactName email');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order, message: 'Ad order declined.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
