const express = require('express');
const router = express.Router();
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const Offer = require('../models/Offer');
const CustomerOffer = require('../models/CustomerOffer');
const emailService = require('../services/emailService');
const Settings = require('../models/Settings');

// ─── Public / Customer ────────────────────────────────────────────

// GET /api/offers?page=product_detail — Contextual offers for a page
router.get('/', optionalAuth, async (req, res) => {
  try {
    const query = { isActive: true };
    if (req.query.page) {
      query.displayPages = req.query.page;
    }

    // Filter by customer group if logged in — always include offers that target no groups (public)
    if (req.user) {
      const user = await require('../models/User').findById(req.user.id).select('dynamicGroupIds customerGroup').lean();
      const userGroupIds = user?.dynamicGroupIds || [];
      query.$or = [
        { targetCustomerGroups: { $exists: false } },
        { targetCustomerGroups: { $size: 0 } },
        { targetCustomerGroups: null },
        { targetCustomerGroups: { $in: userGroupIds } }
      ];
    }

    const offers = await Offer.find(query).sort({ displayOrder: 1, createdAt: -1 });

    // Track views
    const ids = offers.map(o => o._id);
    await Offer.updateMany({ _id: { $in: ids } }, { $inc: { 'stats.views': 1 } });

    res.json({ success: true, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/offers/:id/take — Customer takes/buys offer
router.post('/:id/take', protect, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer || !offer.isActive) {
      return res.status(404).json({ success: false, message: 'Offer not found or inactive.' });
    }

    // Check if already taken
    const existing = await CustomerOffer.findOne({
      customer: req.user.id,
      offer: req.params.id,
      status: { $in: ['active', 'pending_contact'] }
    });
    if (existing) {
      return res.status(400).json({ success: false, message: 'You have already taken this offer.' });
    }

    const customerOfferData = {
      customer: req.user.id,
      offer: offer._id,
      offerTitle: offer.title,
      offerType: offer.offerType,
      status: offer.offerType === 'contact_request' ? 'pending_contact' : 'active',
      purchaseDate: offer.offerType !== 'contact_request' ? new Date() : undefined,
      requestedAt: offer.offerType === 'contact_request' ? new Date() : undefined,
      amountPaid: offer.offerType !== 'contact_request' ? (req.body.amountPaid || offer.pricing?.amount || 0) : 0,
      paymentReference: req.body.paymentReference
    };

    // Subscription expiry
    if (offer.offerType === 'subscription' && offer.pricing?.billingCycle) {
      const cycleMap = { monthly: 30, quarterly: 90, annually: 365 };
      const days = cycleMap[offer.pricing.billingCycle] || 30;
      customerOfferData.expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      customerOfferData.nextRenewalDate = customerOfferData.expiryDate;
    }

    const customerOffer = await CustomerOffer.create(customerOfferData);

    // Update offer stats
    await Offer.findByIdAndUpdate(req.params.id, {
      $inc: { 'stats.clicks': 1, 'stats.conversions': 1 }
    });

    // Send confirmation email to customer + admin notification
    const user = await require('../models/User').findById(req.user.id).select('email firstName lastName phone').lean();
    try {
      await emailService.sendTemplatedEmail('offer_taken', user.email, {
        customerName: user.firstName,
        offerTitle: offer.title,
        offerType: offer.offerType,
        providerName: offer.providerName
      });
    } catch (e) { console.error('Offer taken customer email error:', e.message); }

    // Admin notification email
    try {
      const settings = await Settings.getSettings();
      const adminEmail = offer.contactEmail || settings.adminEmail || settings.storeEmail;
      if (adminEmail) {
        await emailService.sendEmail({
          to: adminEmail,
          subject: `Offer Taken: ${offer.title}`,
          html: `
            <h2>A customer has taken an offer</h2>
            <p><strong>Offer:</strong> ${offer.title}</p>
            <p><strong>Type:</strong> ${offer.offerType}</p>
            <p><strong>Customer:</strong> ${user.firstName} ${user.lastName}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            ${user.phone ? `<p><strong>Phone:</strong> ${user.phone}</p>` : ''}
            <p><strong>Date:</strong> ${new Date().toLocaleString('en-ZA')}</p>
            ${offer.offerType === 'contact_request' ? '<p><strong>Action required:</strong> Please contact this customer about the offer.</p>' : ''}
          `
        });
      }
    } catch (e) { console.error('Offer taken admin email error:', e.message); }

    res.status(201).json({ success: true, data: customerOffer, message: 'Offer activated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/offers/:id/contact-request — Contact request type offer
router.post('/:id/contact-request', protect, async (req, res) => {
  try {
    const offer = await Offer.findById(req.params.id);
    if (!offer || offer.offerType !== 'contact_request') {
      return res.status(400).json({ success: false, message: 'Invalid offer type for contact request.' });
    }

    const user = await require('../models/User').findById(req.user.id).select('email firstName lastName phone').lean();

    // Create or update customer offer record
    let customerOffer = await CustomerOffer.findOne({ customer: req.user.id, offer: req.params.id });
    if (!customerOffer) {
      customerOffer = await CustomerOffer.create({
        customer: req.user.id,
        offer: offer._id,
        offerTitle: offer.title,
        offerType: 'contact_request',
        status: 'pending_contact',
        requestedAt: new Date()
      });
    }

    // Notify admin
    const contactEmail = offer.contactEmail || (await Settings.getSettings()).supportEmail;
    try {
      await emailService.sendEmail({
        to: contactEmail,
        subject: `New Contact Request: ${offer.title}`,
        html: `
          <h2>New Offer Contact Request</h2>
          <p><strong>Offer:</strong> ${offer.title}</p>
          <p><strong>Customer:</strong> ${user.firstName} ${user.lastName}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Phone:</strong> ${user.phone || 'Not provided'}</p>
          <p><strong>Message:</strong> ${req.body.message || 'Customer requested to be contacted.'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        `
      });
    } catch (e) { console.error('Contact request admin email error:', e.message); }

    // Confirm to customer
    try {
      await emailService.sendTemplatedEmail('offer_contact_request_customer', user.email, {
        customerName: user.firstName,
        offerTitle: offer.title
      });
    } catch (e) { console.error('Contact request customer email error:', e.message); }

    await Offer.findByIdAndUpdate(req.params.id, { $inc: { 'stats.clicks': 1, 'stats.conversions': 1 } });

    res.json({ success: true, message: 'Your request has been received. We will contact you shortly.', data: customerOffer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/offers/mine — Customer's taken offers
router.get('/mine', protect, async (req, res) => {
  try {
    const myOffers = await CustomerOffer.find({ customer: req.user.id })
      .populate('offer', 'title shortDescription logoUrl offerType pricing providerName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: myOffers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/offers/mine/:id — Cancel / remove an offer
router.delete('/mine/:id', protect, async (req, res) => {
  try {
    const co = await CustomerOffer.findOne({ _id: req.params.id, customer: req.user.id });
    if (!co) return res.status(404).json({ success: false, message: 'Not found.' });
    co.status = 'cancelled';
    await co.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin ────────────────────────────────────────────────────────

// GET /api/offers/admin/all — All offers (admin)
router.get('/admin/all', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const query = {};
    if (req.query.type) query.offerType = req.query.type;
    if (req.query.status) query.isActive = req.query.status === 'active';
    if (req.query.page) query.displayPages = req.query.page;

    const offers = await Offer.find(query).sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: offers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/offers/admin — Create offer (admin)
router.post('/admin', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const offer = await Offer.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/offers/admin/:id — Update offer (admin)
router.put('/admin/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!offer) return res.status(404).json({ success: false, message: 'Offer not found' });
    res.json({ success: true, data: offer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/offers/admin/:id — Delete offer (admin)
router.delete('/admin/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/offers/admin/:id/customers — Customers who took an offer (admin)
router.get('/admin/:id/customers', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const [records, total] = await Promise.all([
      CustomerOffer.find({ offer: req.params.id })
        .populate('customer', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CustomerOffer.countDocuments({ offer: req.params.id })
    ]);

    res.json({ success: true, data: records, pagination: { total, page, pages: Math.ceil(total / limit), limit } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/offers/admin/customer-offers/:id/mark-contacted — Admin marks customer as contacted
router.put('/admin/customer-offers/:id/mark-contacted', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const co = await CustomerOffer.findByIdAndUpdate(req.params.id, {
      status: 'contacted',
      contactedAt: new Date(),
      contactNotes: req.body.notes || ''
    }, { new: true });
    if (!co) return res.status(404).json({ success: false, message: 'Not found.' });
    res.json({ success: true, data: co });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
