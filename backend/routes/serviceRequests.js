const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ServiceRequest = require('../models/ServiceRequest');
const ServiceType = require('../models/ServiceType');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');

// ═══════════════════════════════════════════════════════════
//  PUBLIC / CUSTOMER
// ═══════════════════════════════════════════════════════════

// POST /api/service-requests — submit a new request
router.post('/', async (req, res) => {
  try {
    const {
      firstName, lastName, email, phone,
      serviceTypeId, serviceModes, description,
      address, suburb, city, province,
      productId, productName,
    } = req.body;

    if (!firstName || !lastName || !email || !serviceTypeId) {
      return res.status(400).json({ success: false, message: 'First name, last name, email, and service type are required.' });
    }

    const serviceType = await ServiceType.findById(serviceTypeId);
    if (!serviceType) return res.status(404).json({ success: false, message: 'Service type not found.' });

    const requestData = {
      firstName, lastName, email, phone,
      serviceType: serviceTypeId,
      serviceModes: serviceModes || [],
      description,
      address, suburb, city, province,
      productName,
    };

    // Link to customer account if logged in (optional — middleware doesn't require auth)
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requestData.customer = decoded.id;
      } catch (_) {}
    }

    if (productId) requestData.product = productId;

    const request = await ServiceRequest.create(requestData);

    // Notify admin
    const settings = await Settings.getSettings();
    const adminEmail = settings.storeEmail;
    if (adminEmail) {
      try {
        await emailService.sendEmail({
          to: adminEmail,
          subject: `New Service Request: ${serviceType.title}`,
          html: `
            <h2>New Service Request Received</h2>
            <p><strong>Service:</strong> ${serviceType.title}</p>
            <p><strong>Customer:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Modes:</strong> ${(serviceModes || []).join(', ') || 'Not specified'}</p>
            <p><strong>Location:</strong> ${[address, suburb, city, province].filter(Boolean).join(', ') || 'Not provided'}</p>
            ${productName ? `<p><strong>Product:</strong> ${productName}</p>` : ''}
            ${description ? `<p><strong>Notes:</strong> ${description}</p>` : ''}
            <p><a href="${process.env.ADMIN_URL || ''}/service-requests">View all service requests →</a></p>
          `,
        });
      } catch (mailErr) {
        console.error('Admin email failed for service request:', mailErr.message);
      }
    }

    // Confirmation to customer
    try {
      await emailService.sendEmail({
        to: email,
        subject: `We received your service request — ${serviceType.title}`,
        html: `
          <h2>Thank you, ${firstName}!</h2>
          <p>We've received your request for <strong>${serviceType.title}</strong> and will be in touch soon to confirm your booking.</p>
          ${description ? `<p><strong>Your notes:</strong> ${description}</p>` : ''}
          <p>Our team will contact you at <strong>${email}</strong>${phone ? ` or ${phone}` : ''}.</p>
        `,
      });
    } catch (_) {}

    res.status(201).json({ success: true, data: request, message: "Request submitted! We'll be in touch soon." });
  } catch (err) {
    console.error('serviceRequests POST:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// GET /api/service-requests/mine — logged-in customer's requests
router.get('/mine', protect, async (req, res) => {
  try {
    const requests = await ServiceRequest.find({ customer: req.user.id })
      .populate('serviceType', 'title icon')
      .populate('assignedProvider', 'businessName contactName phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════════════════════

// GET /api/service-requests — all requests (admin)
router.get('/', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { status, serviceType, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (serviceType) filter.serviceType = serviceType;

    const total = await ServiceRequest.countDocuments(filter);
    const requests = await ServiceRequest.find(filter)
      .populate('serviceType', 'title icon')
      .populate('customer', 'firstName lastName email')
      .populate('assignedProvider', 'businessName contactName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: requests, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/service-requests/:id — single (admin)
router.get('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('serviceType', 'title icon')
      .populate('customer', 'firstName lastName email phone')
      .populate('assignedProvider', 'businessName contactName phone email');
    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/service-requests/:id — update status / assign provider / notes
router.put('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { status, assignedProvider, adminNotes, scheduledDate } = req.body;
    const update = {};
    if (status) update.status = status;
    if (assignedProvider !== undefined) update.assignedProvider = assignedProvider || null;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (scheduledDate !== undefined) update.scheduledDate = scheduledDate;
    if (status === 'completed') update.completedDate = new Date();

    const request = await ServiceRequest.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('serviceType', 'title icon')
      .populate('customer', 'firstName lastName email')
      .populate('assignedProvider', 'businessName contactName phone');

    if (!request) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/service-requests/:id — delete (admin)
router.delete('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    await ServiceRequest.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
