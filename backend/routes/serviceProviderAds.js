const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const ServiceProviderAd = require('../models/ServiceProviderAd');
const ServiceProviderAdPlacement = require('../models/ServiceProviderAdPlacement');
const ServiceProviderAdEnquiry = require('../models/ServiceProviderAdEnquiry');
const { getContextualAds, recordImpression, recordClick } = require('../services/adContextEngine');
const emailService = require('../services/emailService');

// ─── Public / Frontend ────────────────────────────────────────────

// GET /api/service-provider-ads/debug — temporary: diagnose why ads don't show
router.get('/debug', async (req, res) => {
  try {
    const ServiceProvider = require('../models/ServiceProvider');
    const ads = await ServiceProviderAd.find({}).lean();
    const placements = await ServiceProviderAdPlacement.find({}).lean();
    const providers = await ServiceProvider.find({}).select('businessName applicationStatus subscriptionStatus').lean();
    res.json({
      ads: ads.map(a => ({ _id: a._id, title: a.title, status: a.status, placementSlot: a.placementSlot, startDate: a.startDate, endDate: a.endDate, provider: a.provider })),
      placements: placements.map(p => ({ _id: p._id, slotId: p.slotId, isActive: p.isActive })),
      providers: providers.map(p => ({ _id: p._id, name: p.businessName, appStatus: p.applicationStatus, subStatus: p.subscriptionStatus })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/service-provider-ads/contextual
// Query: slotId, pageType, productId, categorySlug, maxAds
router.get('/contextual', optionalAuth, async (req, res) => {
  try {
    const { slotId, pageType, productId, categorySlug, maxAds } = req.query;
    if (!slotId) return res.status(400).json({ success: false, message: 'slotId is required' });

    const ads = await getContextualAds(slotId, {
      pageType,
      productId,
      categorySlug,
      customerId: req.user?.id || null,
      maxAds: parseInt(maxAds) || 3
    });

    res.json({ success: true, data: ads });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/service-provider-ads/:id/impression — record impression
router.post('/:id/impression', async (req, res) => {
  try {
    await recordImpression(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/service-provider-ads/:id/click — record click
router.post('/:id/click', async (req, res) => {
  try {
    await recordClick(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Ad Display Settings (must be before /:id wildcards) ─────────
// GET /api/service-provider-ads/settings — Public: get ad display settings
router.get('/settings', async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.findOne().lean();
    res.json({ success: true, data: settings?.serviceProviderAdSettings || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-provider-ads/settings — Admin: update ad display settings
router.put('/settings', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const Settings = require('../models/Settings');
    const settings = await Settings.findOneAndUpdate(
      {},
      { $set: { serviceProviderAdSettings: req.body } },
      { new: true, upsert: true, strict: false }
    );
    res.json({ success: true, data: settings.serviceProviderAdSettings || req.body });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin — Ad Management ────────────────────────────────────────

// GET /api/service-provider-ads — All ads (admin)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const query = {};
    if (req.query.status) query.status = req.query.status;
    if (req.query.provider) query.provider = req.query.provider;
    if (req.query.slot) query.placementSlot = req.query.slot;
    if (req.query.dateFrom) query.startDate = { $gte: new Date(req.query.dateFrom) };
    if (req.query.dateTo) query.endDate = { $lte: new Date(req.query.dateTo) };

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [ads, total] = await Promise.all([
      ServiceProviderAd.find(query)
        .populate('provider', 'businessName email logoUrl')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      ServiceProviderAd.countDocuments(query)
    ]);

    res.json({ success: true, data: ads, pagination: { total, page, pages: Math.ceil(total / limit), limit } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/service-provider-ads — Create ad
router.post('/', protect, async (req, res) => {
  try {
    const adData = { ...req.body, status: 'pending_approval' };
    // Validate slot exists and is active
    const slot = await ServiceProviderAdPlacement.findOne({ slotId: adData.placementSlot, isActive: true });
    if (!slot) return res.status(400).json({ success: false, message: 'Invalid or inactive ad placement slot.' });

    const ad = await ServiceProviderAd.create(adData);
    res.status(201).json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-provider-ads/:id/approve — Approve ad creative
router.put('/:id/approve', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    // Self-heal: if placementSlot is stored as a MongoDB ObjectId (old bug), replace with slotId string
    const existing = await ServiceProviderAd.findById(req.params.id);
    if (existing && /^[a-f\d]{24}$/i.test(existing.placementSlot)) {
      const placement = await ServiceProviderAdPlacement.findById(existing.placementSlot);
      if (placement) {
        await ServiceProviderAd.updateOne({ _id: existing._id }, { $set: { placementSlot: placement.slotId } });
      }
    }

    const ad = await ServiceProviderAd.findByIdAndUpdate(req.params.id, {
      status: 'active',
      approvedBy: req.user.id,
      approvedAt: new Date()
    }, { new: true }).populate('provider', 'businessName email');

    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });

    // Notify provider
    try {
      await emailService.sendTemplatedEmail('service_provider_ad_approved', ad.provider.email, {
        businessName: ad.provider.businessName,
        adTitle: ad.title,
        startDate: ad.startDate ? ad.startDate.toLocaleDateString() : 'N/A',
        endDate: ad.endDate ? ad.endDate.toLocaleDateString() : 'N/A'
      });
    } catch (e) { console.error('Ad approval email error:', e.message); }

    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-provider-ads/:id/reject — Reject ad
router.put('/:id/reject', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const ad = await ServiceProviderAd.findByIdAndUpdate(req.params.id, {
      status: 'rejected',
      rejectionReason: req.body.reason || ''
    }, { new: true });
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-provider-ads/:id — Update ad
router.put('/:id', protect, async (req, res) => {
  try {
    const allowed = ['title', 'body', 'ctaText', 'ctaUrl', 'imageUrl', 'logoUrl', 'aiKeywords', 'targetCategories', 'targetProductKeywords'];
    const update = {};
    for (const f of allowed) { if (req.body[f] !== undefined) update[f] = req.body[f]; }
    // Admin can also update status
    if (req.user.role === 'admin' && req.body.status) update.status = req.body.status;

    const ad = await ServiceProviderAd.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!ad) return res.status(404).json({ success: false, message: 'Ad not found' });
    res.json({ success: true, data: ad });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/service-provider-ads/:id
router.delete('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    await ServiceProviderAd.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Ad Enquiries ──────────────────────────────────────────────────

// POST /api/service-provider-ads/:id/enquire — Public: customer submits enquiry
router.post('/:id/enquire', async (req, res) => {
  try {
    const ad = await ServiceProviderAd.findById(req.params.id).populate('provider', 'businessName email');
    if (!ad || ad.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Ad not found or inactive' });
    }
    const { name, phone, email, location, additionalInfo, preferredDate } = req.body;
    if (!name || !phone || !email) {
      return res.status(400).json({ success: false, message: 'Name, phone and email are required' });
    }

    const enquiry = await ServiceProviderAdEnquiry.create({
      ad: ad._id,
      provider: ad.provider._id,
      name, phone, email, location, additionalInfo,
      preferredDate: preferredDate ? new Date(preferredDate) : undefined,
    });

    // Email admin
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.findOne().lean();
      const adminEmail = settings?.adminEmail || process.env.ADMIN_EMAIL || 'admin@pesashop.com';
      await emailService.sendEmail({
        to: adminEmail,
        subject: `New Ad Enquiry: ${ad.title}`,
        html: `
          <h2>New Service Provider Ad Enquiry</h2>
          <p><strong>Ad:</strong> ${ad.title}</p>
          <p><strong>Provider:</strong> ${ad.provider?.businessName || 'N/A'}</p>
          <hr/>
          <p><strong>Customer Name:</strong> ${name}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Location:</strong> ${location || 'Not provided'}</p>
          <p><strong>Preferred Date:</strong> ${preferredDate ? new Date(preferredDate).toLocaleDateString() : 'Not specified'}</p>
          <p><strong>Additional Info:</strong> ${additionalInfo || 'None'}</p>
          <hr/>
          <p>Log in to the admin panel to review and push forward this enquiry to the service provider.</p>
        `
      });
    } catch (e) { console.error('Enquiry admin email error:', e.message); }

    res.status(201).json({ success: true, data: enquiry, message: 'Enquiry submitted successfully. We will be in touch shortly.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-provider-ads/enquiries — Admin: list all enquiries
router.get('/enquiries', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const total = await ServiceProviderAdEnquiry.countDocuments(filter);
    const enquiries = await ServiceProviderAdEnquiry.find(filter)
      .populate('ad', 'title placementSlot imageUrl')
      .populate('provider', 'businessName email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: enquiries, pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-provider-ads/enquiries/:enquiryId/push-forward — Admin: approve + notify provider
router.put('/enquiries/:enquiryId/push-forward', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const enquiry = await ServiceProviderAdEnquiry.findById(req.params.enquiryId)
      .populate('ad', 'title imageUrl')
      .populate('provider', 'businessName email');

    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });

    enquiry.status = 'pushed_forward';
    enquiry.adminNotes = req.body.notes || '';
    enquiry.pushedForwardAt = new Date();
    enquiry.pushedForwardBy = req.user.id;
    await enquiry.save();

    // Email service provider
    try {
      if (enquiry.provider?.email) {
        await emailService.sendEmail({
          to: enquiry.provider.email,
          subject: `New Customer Enquiry for: ${enquiry.ad?.title}`,
          html: `
            <h2>You have a new customer enquiry!</h2>
            <p>A customer has enquired about your ad: <strong>${enquiry.ad?.title}</strong></p>
            <hr/>
            <p><strong>Customer Name:</strong> ${enquiry.name}</p>
            <p><strong>Phone:</strong> ${enquiry.phone}</p>
            <p><strong>Email:</strong> ${enquiry.email}</p>
            <p><strong>Location:</strong> ${enquiry.location || 'Not provided'}</p>
            <p><strong>Preferred Date:</strong> ${enquiry.preferredDate ? new Date(enquiry.preferredDate).toLocaleDateString() : 'Not specified'}</p>
            <p><strong>Additional Info:</strong> ${enquiry.additionalInfo || 'None'}</p>
            ${req.body.notes ? `<p><strong>Admin Notes:</strong> ${req.body.notes}</p>` : ''}
            <hr/>
            <p>Log in to your service provider portal to view this enquiry and follow up with the customer.</p>
          `
        });
      }
    } catch (e) { console.error('Push-forward email error:', e.message); }

    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/service-provider-ads/enquiries/:enquiryId/reject — Admin: reject enquiry
router.put('/enquiries/:enquiryId/reject', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const enquiry = await ServiceProviderAdEnquiry.findByIdAndUpdate(req.params.enquiryId, {
      status: 'rejected',
      adminNotes: req.body.notes || '',
      rejectedAt: new Date(),
      rejectedBy: req.user.id,
    }, { new: true });
    if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found' });
    res.json({ success: true, data: enquiry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/service-provider-ads/enquiries/mine — Provider: see only pushed-forward enquiries
router.get('/enquiries/mine', async (req, res) => {
  try {
    // Auth via provider token (same as protectProvider middleware)
    const jwt = require('jsonwebtoken');
    const ServiceProvider = require('../models/ServiceProvider');
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authorised' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const provider = await ServiceProvider.findById(decoded.id);
    if (!provider) return res.status(401).json({ success: false, message: 'Provider not found' });

    const enquiries = await ServiceProviderAdEnquiry.find({
      provider: provider._id,
      status: 'pushed_forward'
    })
      .populate('ad', 'title placementSlot imageUrl')
      .sort({ pushedForwardAt: -1 });

    // Mark as viewed
    await ServiceProviderAdEnquiry.updateMany(
      { provider: provider._id, status: 'pushed_forward', providerViewedAt: null },
      { $set: { providerViewedAt: new Date() } }
    );

    res.json({ success: true, data: enquiries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
