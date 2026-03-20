const express = require('express');
const router = express.Router();
const multer = require('multer');
const shippingService = require('../services/shippingService');
const pdfService = require('../services/pdfService');
const { protect, authorize } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const Waybill = require('../models/Waybill');
const ShippingEvent = require('../models/ShippingEvent');
const ProofOfDelivery = require('../models/ProofOfDelivery');
const ShippingHub = require('../models/ShippingHub');
const Order = require('../models/Order');
const User = require('../models/User');
const Laybye = require('../models/Laybye');
const Settings = require('../models/Settings');

// Helper: Check if an order is eligible for shipping
async function checkShippingEligibility(orderId) {
  const order = await Order.findById(orderId);
  if (!order) {
    return { eligible: false, reason: 'Order not found' };
  }

  // Check if waybill already exists
  const existingWaybill = await Waybill.findOne({ order: orderId });
  if (existingWaybill) {
    return { eligible: false, reason: 'A waybill already exists for this order' };
  }

  // Check if order is cancelled/refunded/failed
  if (['cancelled', 'refunded', 'failed'].includes(order.status)) {
    return { eligible: false, reason: `Cannot ship an order with status: ${order.status}` };
  }

  // Check if it's a laybye order
  const laybyes = await Laybye.find({ order: orderId, status: { $in: ['active', 'Active'] } });

  if (laybyes.length > 0) {
    // Laybye order: eligible if 1 installment or fewer left, OR remaining balance < 20% of total
    for (const laybye of laybyes) {
      const totalPayments = laybye.installmentPlan?.numberOfPayments || 0;
      const completedPayments = laybye.payments?.filter(p => p.status === 'completed').length || 0;
      const remainingInstallments = totalPayments - completedPayments;
      const remainingPercentage = laybye.totalAmount > 0 
        ? (laybye.remainingAmount / laybye.totalAmount) * 100 
        : 0;

      if (remainingInstallments > 1 && remainingPercentage >= 20) {
        return { 
          eligible: false, 
          reason: `Laybye has ${remainingInstallments} installments remaining (${remainingPercentage.toFixed(1)}% unpaid). Must have 1 or fewer installments left, or less than 20% remaining balance.` 
        };
      }
    }
    // All laybyes meet the criteria
    return { eligible: true, reason: 'Laybye order eligible for shipping' };
  }

  // Regular order: must be paid in full
  if (order.paymentStatus !== 'completed') {
    return { eligible: false, reason: 'Order must be paid in full before shipping' };
  }

  return { eligible: true, reason: 'Order is eligible for shipping' };
}

// Configure multer for photo uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// Check shipping eligibility for an order
router.get('/eligibility/:orderId', protect, checkPermission('shipping_waybills', 'read'), async (req, res) => {
  try {
    const result = await checkShippingEligibility(req.params.orderId);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Create waybill
router.post('/waybills', protect, checkPermission('shipping_waybills', 'create'), async (req, res) => {
  try {
    const { orderId, shippingType, hubLocationId } = req.body;

    // Check eligibility before creating waybill
    const eligibility = await checkShippingEligibility(orderId);
    if (!eligibility.eligible) {
      return res.status(400).json({
        success: false,
        message: eligibility.reason
      });
    }
    
    const waybill = await shippingService.createWaybill(
      orderId,
      shippingType,
      hubLocationId,
      req.user._id
    );
    
    res.json({
      success: true,
      waybill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get waybills list
router.get('/waybills', protect, checkPermission('shipping_waybills', 'read'), async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      shippingType: req.query.shippingType,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      customer: req.query.customer,
      limit: parseInt(req.query.limit) || 50,
      skip: parseInt(req.query.skip) || 0
    };
    
    const result = await shippingService.getWaybills(filters);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get waybill details
router.get('/waybills/:id', protect, checkPermission('shipping_waybills', 'read'), async (req, res) => {
  try {
    const details = await shippingService.getWaybillDetails(req.params.id);
    
    res.json({
      success: true,
      ...details
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update waybill status
router.put('/waybills/:id/status', protect, checkPermission('shipping_waybills', 'update'), async (req, res) => {
  try {
    const { status, note } = req.body;
    
    const waybill = await shippingService.updateWaybillStatus(
      req.params.id,
      status,
      req.user._id,
      note
    );
    
    res.json({
      success: true,
      waybill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Upload product photos
router.post('/waybills/:waybillId/photos', 
  protect, 
  checkPermission('shipping_photos', 'create'),
  upload.array('photos', 5),
  async (req, res) => {
    try {
      const { orderItemId } = req.body;
      
      const photoUrls = await shippingService.uploadProductPhotos(
        req.params.waybillId,
        orderItemId,
        req.files,
        req.user._id
      );
      
      res.json({
        success: true,
        photoUrls
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
);

// Generate waybill PDF
router.get('/waybills/:id/pdf', protect, checkPermission('shipping_waybills', 'read'), async (req, res) => {
  try {
    const waybill = await Waybill.findById(req.params.id)
      .populate('order')
      .populate('customer')
      .populate('createdBy', 'name');
      
    if (!waybill) {
      return res.status(404).json({
        success: false,
        message: 'Waybill not found'
      });
    }
    
    // Get company settings from DB
    const settings = await Settings.getSettings();

    // Resolve logo path to an absolute file path for PDFKit
    let logoPath = null;
    if (settings.storeLogo) {
      const path = require('path');
      const fs = require('fs');
      // storeLogo could be "/uploads/xyz.png" or a full URL
      const candidate = settings.storeLogo.startsWith('/')
        ? path.join(__dirname, '..', settings.storeLogo)
        : path.join(__dirname, '..', 'uploads', settings.storeLogo);
      if (fs.existsSync(candidate)) logoPath = candidate;
    }
    // Fallback: check for a logo file in uploads root
    if (!logoPath) {
      const path = require('path');
      const fs = require('fs');
      const fallbacks = ['logo.png', 'logo.jpg', 'logo.jpeg', 'logo.svg', 'logo.webp'];
      for (const f of fallbacks) {
        const candidate = path.join(__dirname, '..', 'uploads', f);
        if (fs.existsSync(candidate)) { logoPath = candidate; break; }
      }
    }
    
    const pdfUrl = await pdfService.generateWaybillPDF({
      waybill,
      order: waybill.order,
      customer: waybill.customer,
      company: {
        name: settings.storeName || 'PesaShop',
        address: settings.storeAddress,
        phone: settings.storePhone,
        email: settings.storeEmail,
        logo: logoPath
      }
    });
    
    res.json({
      success: true,
      pdfUrl
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Scan out
router.post('/scan/out', protect, checkPermission('shipping_scanout', 'create'), async (req, res) => {
  try {
    const { waybillNumber, destination } = req.body;
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.body.platform || 'web',
      isMobile: req.body.isMobile || false
    };
    
    const waybill = await shippingService.scanOut(
      waybillNumber,
      destination,
      deviceInfo,
      req.user._id
    );
    
    res.json({
      success: true,
      waybill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Scan in
router.post('/scan/in', protect, checkPermission('shipping_scanin', 'create'), async (req, res) => {
  try {
    const { waybillNumber, location } = req.body;
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.body.platform || 'web',
      isMobile: req.body.isMobile || false
    };
    
    const waybill = await shippingService.scanIn(
      waybillNumber,
      location,
      deviceInfo,
      req.user._id
    );
    
    res.json({
      success: true,
      waybill
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Capture POD
router.post('/pod', protect, checkPermission('shipping_pod', 'create'), async (req, res) => {
  try {
    const { waybillNumber, recipient, signatureData, location, notes } = req.body;
    const deviceInfo = {
      userAgent: req.headers['user-agent'],
      platform: req.body.platform || 'web',
      isMobile: req.body.isMobile || false
    };
    
    const pod = await shippingService.capturePOD(
      waybillNumber,
      {
        recipient,
        signatureData,
        location,
        notes,
        deviceInfo
      },
      req.user._id
    );
    
    res.json({
      success: true,
      pod
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get POD PDF
router.get('/pod/:waybillId/pdf', protect, checkPermission('shipping_pod', 'read'), async (req, res) => {
  try {
    const pod = await ProofOfDelivery.findOne({ waybill: req.params.waybillId })
      .populate('processedBy', 'name');
      
    if (!pod) {
      return res.status(404).json({
        success: false,
        message: 'POD not found'
      });
    }
    
    const waybill = await Waybill.findById(pod.waybill)
      .populate('order')
      .populate('customer');
    
    // Get company settings
    const settings = {}; // TODO: Get from settings service
    
    const pdfUrl = await pdfService.generatePODPDF({
      pod,
      waybill,
      order: waybill.order,
      customer: waybill.customer,
      company: {
        name: settings.companyName || 'PesaShop',
        address: settings.companyAddress,
        phone: settings.companyPhone,
        email: settings.companyEmail,
        logo: settings.companyLogo
      }
    });
    
    res.json({
      success: true,
      pdfUrl
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get shipping hubs
router.get('/hubs', protect, checkPermission('shipping_hubs', 'read'), async (req, res) => {
  try {
    const filters = {
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
      type: req.query.type,
      city: req.query.city
    };
    
    const hubs = await shippingService.getShippingHubs(filters);
    
    res.json({
      success: true,
      hubs
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Create/Update shipping hub
router.post('/hubs', protect, checkPermission('shipping_hubs', 'create'), async (req, res) => {
  try {
    const hub = await shippingService.saveShippingHub(req.body);
    
    res.json({
      success: true,
      hub
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

router.put('/hubs/:id', protect, checkPermission('shipping_hubs', 'update'), async (req, res) => {
  try {
    const hub = await shippingService.saveShippingHub(req.body, req.params.id);
    
    res.json({
      success: true,
      hub
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Customer tracking endpoint (public with order verification)
router.get('/track/:waybillNumber', async (req, res) => {
  try {
    const { email } = req.query;
    
    const waybill = await Waybill.findOne({ waybillNumber: req.params.waybillNumber })
      .populate('order')
      .populate('customer');
      
    if (!waybill) {
      return res.status(404).json({
        success: false,
        message: 'Waybill not found'
      });
    }
    
    // Verify customer email
    if (waybill.customer.email !== email) {
      return res.status(403).json({
        success: false,
        message: 'Invalid email for this waybill'
      });
    }
    
    // Get events
    const events = await ShippingEvent.find({ waybill: waybill._id })
      .select('eventType description status createdAt')
      .sort({ createdAt: 1 });
    
    // Get POD if exists
    const pod = await ProofOfDelivery.findOne({ waybill: waybill._id })
      .select('createdAt podDocumentUrl');
    
    res.json({
      success: true,
      tracking: {
        waybillNumber: waybill.waybillNumber,
        status: waybill.status,
        shippingType: waybill.shippingType,
        hubLocation: waybill.hubLocation,
        events: events.map(e => ({
          type: e.eventType,
          description: e.description,
          status: e.status,
          timestamp: e.createdAt
        })),
        pod: pod ? {
          deliveredAt: pod.createdAt,
          podUrl: pod.podDocumentUrl
        } : null
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Mobile scanner endpoints
router.get('/mobile/scan/:waybillNumber', protect, async (req, res) => {
  try {
    const waybill = await Waybill.findOne({ waybillNumber: req.params.waybillNumber })
      .populate('order', 'orderNumber')
      .populate('customer', 'firstName lastName');
      
    if (!waybill) {
      return res.status(404).json({
        success: false,
        message: 'Waybill not found'
      });
    }
    
    res.json({
      success: true,
      waybill: {
        _id: waybill._id,
        waybillNumber: waybill.waybillNumber,
        status: waybill.status,
        shippingType: waybill.shippingType,
        customer: waybill.customer ? `${waybill.customer.firstName} ${waybill.customer.lastName}` : 'Unknown Customer',
        orderNumber: waybill.order?.orderNumber || 'N/A'
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
