const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const ServiceProviderAd = require('../models/ServiceProviderAd');
const ServiceProviderAdPlacement = require('../models/ServiceProviderAdPlacement');
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

module.exports = router;
