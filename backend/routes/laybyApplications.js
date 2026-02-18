const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const LaybyApplication = require('../models/LaybyApplication');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const emailService = require('../services/emailService');

// Configure multer for ID document uploads
const idDocStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/layby-documents');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `id-doc-${uniqueSuffix}${ext}`);
  }
});

const idDocFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|pdf|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
  const mimetype = allowedMimes.includes(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) and PDF files are allowed'));
  }
};

const uploadIdDoc = multer({
  storage: idDocStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: idDocFilter
});

// ─── PUBLIC: Get layby settings (T&C, widget config) ───
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: {
        enabled: settings.layby?.enabled ?? true,
        termsAndConditions: settings.layby?.termsAndConditions || '',
        widgetEnabled: settings.layby?.widgetEnabled ?? true,
        widgetButtonText: settings.layby?.widgetButtonText || 'GET IT ON LAYBY'
      }
    });
  } catch (error) {
    console.error('Get layby settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── PUBLIC: Submit a layby application ───
router.post('/apply', optionalAuth, uploadIdDoc.single('idDocument'), async (req, res) => {
  try {
    const { firstName, lastName, email, phone, productId, notes } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !productId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: firstName, lastName, email, phone, productId'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload your ID or passport document'
      });
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productPrice = product.salePrice || product.regularPrice || product.price;

    // Check if layby is enabled
    const settings = await Settings.getSettings();
    if (!settings.layby?.enabled) {
      return res.status(400).json({ success: false, message: 'Layby is currently not available' });
    }

    // Create application
    const application = await LaybyApplication.create({
      firstName,
      lastName,
      email,
      phone,
      idDocument: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path
      },
      product: productId,
      productName: product.name,
      productPrice,
      customer: req.user?._id || null,
      notes: notes || '',
      status: 'pending'
    });

    // Send notification email to admin
    const applicationEmail = settings.layby?.applicationEmail || 'hello@pesashop.com';
    try {
      await emailService.sendEmail({
        to: applicationEmail,
        subject: `New Layby Application - ${firstName} ${lastName} - ${product.name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a1a2e; border-bottom: 2px solid #e94560; padding-bottom: 10px;">New Layby Application</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Applicant Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #666; width: 140px;">Name:</td><td style="padding: 8px 0; font-weight: bold;">${firstName} ${lastName}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Phone:</td><td style="padding: 8px 0;"><a href="tel:${phone}">${phone}</a></td></tr>
              </table>
            </div>

            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Product Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr><td style="padding: 8px 0; color: #666; width: 140px;">Product:</td><td style="padding: 8px 0; font-weight: bold;">${product.name}</td></tr>
                <tr><td style="padding: 8px 0; color: #666;">Price:</td><td style="padding: 8px 0; font-weight: bold; color: #e94560;">R ${productPrice.toFixed(2)}</td></tr>
              </table>
            </div>

            ${notes ? `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #856404;">Customer Notes</h4>
              <p style="margin-bottom: 0; color: #856404;">${notes}</p>
            </div>
            ` : ''}

            <p style="color: #666; font-size: 14px;">
              <strong>ID Document:</strong> ${req.file.originalname} (attached)<br>
              <strong>Application ID:</strong> ${application._id}<br>
              <strong>Date:</strong> ${new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })}
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
              Please review this application in the admin panel under Laybyes → Applications.
            </p>
          </div>
        `,
        attachments: [{
          filename: req.file.originalname,
          path: req.file.path
        }]
      });

      application.notificationSent = true;
      await application.save();
    } catch (emailError) {
      console.error('Failed to send layby application email:', emailError);
      // Don't fail the application if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Your layby application has been submitted successfully. Our team will review it and get back to you.',
      data: {
        applicationId: application._id,
        status: application.status
      }
    });
  } catch (error) {
    console.error('Layby application error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// ─── PROTECTED: Get my applications (customer) ───
router.get('/my-applications', protect, async (req, res) => {
  try {
    const applications = await LaybyApplication.find({
      $or: [
        { customer: req.user._id },
        { email: req.user.email }
      ]
    })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Get all applications ───
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const total = await LaybyApplication.countDocuments(query);
    const applications = await LaybyApplication.find(query)
      .populate('product', 'name slug images')
      .populate('customer', 'firstName lastName email')
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: applications,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Get single application ───
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const application = await LaybyApplication.findById(req.params.id)
      .populate('product', 'name slug images price regularPrice salePrice')
      .populate('customer', 'firstName lastName email phone')
      .populate('reviewedBy', 'firstName lastName')
      .populate('laybye');

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    res.json({ success: true, data: application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Approve application ───
router.put('/:id/approve', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const application = await LaybyApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Application is not pending' });
    }

    application.status = 'approved';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.reviewNotes = req.body.notes || '';
    await application.save();

    // Send approval email to applicant
    try {
      await emailService.sendEmail({
        to: application.email,
        subject: 'Your Layby Application Has Been Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #28a745;">Your Layby Application Has Been Approved!</h2>
            <p>Dear ${application.firstName},</p>
            <p>Great news! Your layby application for <strong>${application.productName}</strong> has been approved.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Product:</strong> ${application.productName}</p>
              <p><strong>Price:</strong> R ${application.productPrice.toFixed(2)}</p>
            </div>
            <p>Our team will be in touch with you shortly to set up your payment plan.</p>
            <p>Thank you for choosing PesaShop!</p>
          </div>
        `
      });
      application.approvalEmailSent = true;
      await application.save();
    } catch (emailError) {
      console.error('Failed to send approval email:', emailError);
    }

    res.json({ success: true, data: application, message: 'Application approved' });
  } catch (error) {
    console.error('Approve application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Reject application ───
router.put('/:id/reject', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const application = await LaybyApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Application is not pending' });
    }

    application.status = 'rejected';
    application.reviewedBy = req.user._id;
    application.reviewedAt = new Date();
    application.rejectionReason = req.body.reason || '';
    application.reviewNotes = req.body.notes || '';
    await application.save();

    // Send rejection email to applicant
    try {
      await emailService.sendEmail({
        to: application.email,
        subject: 'Update on Your Layby Application',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc3545;">Layby Application Update</h2>
            <p>Dear ${application.firstName},</p>
            <p>Thank you for your interest in our layby program. Unfortunately, we are unable to approve your application for <strong>${application.productName}</strong> at this time.</p>
            ${application.rejectionReason ? `<p><strong>Reason:</strong> ${application.rejectionReason}</p>` : ''}
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Thank you for your understanding.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
    }

    res.json({ success: true, data: application, message: 'Application rejected' });
  } catch (error) {
    console.error('Reject application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Download ID document ───
router.get('/:id/document', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const application = await LaybyApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    const filePath = application.idDocument.path;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found' });
    }

    res.download(filePath, application.idDocument.originalName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Delete application ───
router.delete('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const application = await LaybyApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Delete the uploaded document
    if (application.idDocument?.path && fs.existsSync(application.idDocument.path)) {
      fs.unlinkSync(application.idDocument.path);
    }

    await application.deleteOne();
    res.json({ success: true, message: 'Application deleted' });
  } catch (error) {
    console.error('Delete application error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─── ADMIN: Get applications by customer ID ───
router.get('/customer/:customerId', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const applications = await LaybyApplication.find({ customer: req.params.customerId })
      .populate('product', 'name slug images')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: applications });
  } catch (error) {
    console.error('Get customer applications error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
