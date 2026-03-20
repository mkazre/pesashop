const Waybill = require('../models/Waybill');
const ShippingEvent = require('../models/ShippingEvent');
const ProofOfDelivery = require('../models/ProofOfDelivery');
const ShippingHub = require('../models/ShippingHub');
const Order = require('../models/Order');
const path = require('path');
const fs = require('fs').promises;

class ShippingService {
  // Create a new waybill for an order
  async createWaybill(orderId, shippingType, hubLocationId, userId) {
    // Fetch order without populate to preserve raw customer ObjectId
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.waybill) {
      throw new Error('Waybill already exists for this order');
    }

    // Resolve customer ID from the raw field (before any populate that could null it)
    const customerId = order.customer;
    if (!customerId) {
      throw new Error('Order has no customer assigned — cannot create waybill for guest orders');
    }

    // Generate waybill number
    const waybillNumber = await Waybill.generateWaybillNumber();

    // Get hub details if hub collection
    let hubLocation = null;
    if (shippingType === 'HUB_COLLECTION' && hubLocationId) {
      const hub = await ShippingHub.findById(hubLocationId);
      if (!hub) {
        throw new Error('Hub location not found');
      }
      hubLocation = {
        name: hub.name,
        address: `${hub.address.street || ''}, ${hub.address.city || ''}`,
        city: hub.address.city,
        state: hub.address.state,
        postalCode: hub.address.postalCode,
        phone: hub.contact?.phone,
        coordinates: hub.coordinates
      };
    }

    // Create waybill
    const waybill = await Waybill.create({
      waybillNumber,
      order: orderId,
      customer: customerId,
      shippingType,
      hubLocation,
      barcodeData: waybillNumber,
      createdBy: userId
    });

    // Update order with waybill reference
    order.waybill = waybill._id;
    await order.save();

    // Create initial shipping event
    await ShippingEvent.create({
      waybill: waybill._id,
      eventType: 'CREATED',
      description: 'Waybill created',
      status: 'CREATED',
      performedBy: userId
    });

    return waybill;
  }

  // Upload product photos
  async uploadProductPhotos(waybillId, orderItemId, photos, userId) {
    const waybill = await Waybill.findById(waybillId);
    if (!waybill) {
      throw new Error('Waybill not found');
    }

    // Save photos to uploads directory
    const uploadDir = path.join(__dirname, '..', 'uploads', 'shipping', waybillId);
    await fs.mkdir(uploadDir, { recursive: true });

    const photoUrls = [];
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = `${orderItemId}-${Date.now()}-${i}${path.extname(photo.originalname)}`;
      const filepath = path.join(uploadDir, filename);
      await fs.writeFile(filepath, photo.buffer);
      photoUrls.push(`/uploads/shipping/${waybillId}/${filename}`);
    }

    // Create shipping event
    await ShippingEvent.create({
      waybill: waybillId,
      eventType: 'PHOTO_UPLOADED',
      description: `Uploaded ${photos.length} product photos`,
      status: waybill.status,
      performedBy: userId,
      photoData: {
        orderItem: orderItemId,
        photoUrls,
        caption: `Product photos for order item ${orderItemId}`
      }
    });

    return photoUrls;
  }

  // Scan out waybill
  async scanOut(waybillNumber, destination, deviceInfo, userId) {
    const waybill = await Waybill.findOne({ waybillNumber });
    if (!waybill) {
      throw new Error('Waybill not found');
    }

    if (waybill.status !== 'PACKED') {
      throw new Error('Waybill must be packed before scan-out');
    }

    // Update waybill status
    const newStatus = destination === 'direct delivery' ? 'OUT_FOR_DELIVERY' : 'DISPATCHED_FROM_HUB';
    await waybill.updateStatus(newStatus, userId);

    // Create scan event
    await ShippingEvent.create({
      waybill: waybill._id,
      eventType: 'SCAN_OUT',
      description: `Scanned out for ${destination}`,
      status: newStatus,
      performedBy: userId,
      scanData: {
        scanType: 'SCAN_OUT',
        destination,
        deviceInfo
      }
    });

    return waybill;
  }

  // Scan in waybill
  async scanIn(waybillNumber, location, deviceInfo, userId) {
    const waybill = await Waybill.findOne({ waybillNumber });
    if (!waybill) {
      throw new Error('Waybill not found');
    }

    // Check waybill is in a valid status for scan-in
    const validScanInStatuses = ['DISPATCHED_FROM_HUB', 'OUT_FOR_DELIVERY'];
    if (!validScanInStatuses.includes(waybill.status)) {
      throw new Error(`Cannot scan-in: waybill status is "${waybill.status.replace(/_/g, ' ')}". Must be dispatched or out for delivery first.`);
    }

    // Determine new status based on current status
    let newStatus;
    if (waybill.status === 'DISPATCHED_FROM_HUB') {
      newStatus = 'RECEIVED_AT_HUB';
    } else if (waybill.status === 'OUT_FOR_DELIVERY') {
      newStatus = 'WITH_DELIVERY_DRIVER';
    } else {
      throw new Error('Invalid status for scan-in');
    }

    // Update waybill status
    await waybill.updateStatus(newStatus, userId);

    // Create scan event
    await ShippingEvent.create({
      waybill: waybill._id,
      eventType: 'SCAN_IN',
      description: `Scanned in at ${location}`,
      status: newStatus,
      performedBy: userId,
      scanData: {
        scanType: 'SCAN_IN',
        destination: location,
        deviceInfo
      },
      location: {
        type: location.includes('HUB') ? 'HUB' : 'OTHER',
        name: location
      }
    });

    return waybill;
  }

  // Capture proof of delivery
  async capturePOD(waybillNumber, podData, userId) {
    const waybill = await Waybill.findOne({ waybillNumber }).populate('order');
    if (!waybill) {
      throw new Error('Waybill not found');
    }

    // Validate waybill status
    const validStatuses = ['WITH_DELIVERY_DRIVER', 'RECEIVED_AT_HUB'];
    if (!validStatuses.includes(waybill.status)) {
      throw new Error('Invalid waybill status for POD capture');
    }

    // Get pre-shipment photos
    const photoEvents = await ShippingEvent.find({
      waybill: waybill._id,
      eventType: 'PHOTO_UPLOADED'
    });

    const preShipmentPhotos = photoEvents.map(event => ({
      orderItemId: event.photoData.orderItem,
      photoUrls: event.photoData.photoUrls,
      uploadedAt: event.createdAt,
      uploadedBy: event.performedBy
    }));

    // Create POD record
    const pod = await ProofOfDelivery.create({
      waybill: waybill._id,
      order: waybill.order._id,
      deliveryType: waybill.shippingType === 'HUB_COLLECTION' ? 'HUB_COLLECTION' : 'DELIVERY',
      recipient: podData.recipient,
      signature: {
        imageData: podData.signatureData,
        signedAt: new Date()
      },
      processedBy: userId,
      location: podData.location,
      preShipmentPhotos,
      notes: podData.notes,
      deviceInfo: podData.deviceInfo
    });

    // Update waybill status
    const finalStatus = waybill.shippingType === 'HUB_COLLECTION' ? 'COLLECTED' : 'DELIVERED';
    await waybill.updateStatus(finalStatus, userId);

    // Create POD event
    await ShippingEvent.create({
      waybill: waybill._id,
      eventType: 'POD_CAPTURED',
      description: 'Proof of delivery captured',
      status: finalStatus,
      performedBy: userId,
      podReference: pod._id
    });

    // Update order status
    await Order.findByIdAndUpdate(waybill.order._id, {
      status: 'completed',
      deliveredAt: new Date()
    });

    return pod;
  }

  // Get waybill with full details
  async getWaybillDetails(waybillId) {
    const waybill = await Waybill.findById(waybillId)
      .populate('order')
      .populate('customer')
      .populate('createdBy', 'name email');

    if (!waybill) {
      throw new Error('Waybill not found');
    }

    // Get all events
    const events = await ShippingEvent.find({ waybill: waybillId })
      .populate('performedBy', 'name email')
      .sort({ createdAt: 1 });

    // Get POD if exists
    const pod = await ProofOfDelivery.findOne({ waybill: waybillId })
      .populate('processedBy', 'name email');

    return {
      waybill,
      events,
      pod
    };
  }

  // Get waybills list with filters
  async getWaybills(filters = {}) {
    const query = {};

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.shippingType) {
      query.shippingType = filters.shippingType;
    }

    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) {
        query.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        query.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    if (filters.customer) {
      query.customer = filters.customer;
    }

    const waybills = await Waybill.find(query)
      .populate('order', 'orderNumber total')
      .populate('customer', 'name email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .skip(filters.skip || 0);

    const total = await Waybill.countDocuments(query);

    return {
      waybills,
      total
    };
  }

  // Update waybill status
  async updateWaybillStatus(waybillId, newStatus, userId, note) {
    const waybill = await Waybill.findById(waybillId);
    if (!waybill) {
      throw new Error('Waybill not found');
    }

    await waybill.updateStatus(newStatus, userId);

    if (note) {
      await ShippingEvent.create({
        waybill: waybillId,
        eventType: 'NOTE_ADDED',
        description: note,
        status: newStatus,
        performedBy: userId
      });
    }

    return waybill;
  }

  // Get shipping hubs
  async getShippingHubs(filters = {}) {
    const query = {};

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    if (filters.city) {
      query['address.city'] = new RegExp(filters.city, 'i');
    }

    return ShippingHub.find(query).sort({ name: 1 });
  }

  // Create or update shipping hub
  async saveShippingHub(hubData, hubId = null) {
    if (hubId) {
      return ShippingHub.findByIdAndUpdate(hubId, hubData, { new: true });
    }
    return ShippingHub.create(hubData);
  }
}

module.exports = new ShippingService();
