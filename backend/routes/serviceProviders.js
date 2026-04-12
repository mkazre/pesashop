const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const ServiceProvider = require('../models/ServiceProvider');
const ServiceProviderCategory = require('../models/ServiceProviderCategory');
const ServiceProviderSubscriptionPlan = require('../models/ServiceProviderSubscriptionPlan');
const ServiceProviderAdPlacement = require('../models/ServiceProviderAdPlacement');
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
//  ADMIN — Provider Management
// ═══════════════════════════════════════════════════════════

// GET /api/service-providers — All providers (admin)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
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
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
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
router.put('/:id/approve', protect, authorize('admin', 'shop_manager'), async (req, res) => {
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
router.put('/:id/reject', protect, authorize('admin', 'shop_manager'), async (req, res) => {
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

module.exports = router;
