const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { LoyaltyPoint } = require('../models/LoyaltyPoint');
const loyaltyService = require('../services/loyaltyService');
const couponEmailService = require('../services/couponEmailService');

// GET all orders (with filters)
router.get('/', protect, async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'customer') query.customer = req.user._id;
    if (req.query.status) query.status = req.query.status;
    if (req.query.paymentStatus) query.paymentStatus = req.query.paymentStatus;
    
    // Search functionality
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { orderNumber: searchRegex },
        { 'customer.firstName': searchRegex },
        { 'customer.lastName': searchRegex },
        { 'customer.email': searchRegex },
        { 'billingAddress.firstName': searchRegex },
        { 'billingAddress.lastName': searchRegex },
        { 'billingAddress.email': searchRegex }
      ];
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find(query)
      .populate('customer', 'firstName lastName email')
      .populate('laybye', 'status totalAmount paidAmount remainingAmount')
      .populate('giftCardsApplied.giftCard', 'code currentBalance')
      .populate('couponsApplied.coupon', 'code type value')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limit);
    
    res.json({ 
      success: true, 
      data: orders, 
      pagination: {
        total,
        page,
        pages,
        limit,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    next(error);
  }
});

// PUBLIC: Track order by order number + email (billing address or customer account email)
router.post('/track', async (req, res, next) => {
  try {
    const { orderNumber, email } = req.body;

    if (!orderNumber || !email) {
      return res.status(400).json({ success: false, message: 'Order number and email are required' });
    }

    const trimmedOrder = orderNumber.trim();
    const emailRegex = new RegExp(`^${email.trim()}$`, 'i');

    // Try matching by billingAddress.email first
    let order = await Order.findOne({
      orderNumber: trimmedOrder,
      'billingAddress.email': { $regex: emailRegex }
    })
      .populate('items.product', 'name slug images')
      .select('-adminNote -notes -customerIp -userAgent -metadata -paymentDetails');

    // Fallback: match by customer account email
    if (!order) {
      const User = require('../models/User');
      const customer = await User.findOne({ email: { $regex: emailRegex } }).select('_id');
      if (customer) {
        order = await Order.findOne({
          orderNumber: trimmedOrder,
          customer: customer._id
        })
          .populate('items.product', 'name slug images')
          .select('-adminNote -notes -customerIp -userAgent -metadata -paymentDetails');
      }
    }

    if (!order) {
      return res.status(404).json({ success: false, message: 'No order found with that order number and email combination' });
    }

    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// GET single order
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer')
      .populate('items.product')
      .populate('laybye')
      .populate('giftCardsApplied.giftCard', 'code currentBalance initialBalance')
      .populate('couponsApplied.coupon', 'code type value description');
    
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user.role === 'customer' && order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// CREATE order
router.post('/', protect, async (req, res, next) => {
  try {
    const { 
      items, 
      billingAddress, 
      shippingAddress, 
      paymentMethod, 
      giftCardCode, 
      giftCardAmount,
      couponCode,
      loyaltyPointsUsed,
      subtotal: providedSubtotal, 
      tax, 
      shipping, 
      total: providedTotal 
    } = req.body;
    
    let subtotal = 0;
    const orderItems = [];
    
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) throw new Error(`Product ${item.product} not found`);
      
      const price = product.getPriceForCustomerGroup(req.user.customerGroup, item.quantity);
      const total = price * item.quantity;
      
      orderItems.push({
        product: product._id,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price,
        total
      });
      
      subtotal += total;
      await product.updateStock(item.quantity);
    }
    
    // Use provided subtotal if available (from frontend calculation), otherwise use calculated
    const finalSubtotal = providedSubtotal || subtotal;
    const finalTax = tax || finalSubtotal * 0.15;
    const finalShipping = shipping || 0;
    const giftCardDiscount = giftCardAmount || 0;
    
    // Handle gift card redemption if provided
    let giftCard = null;
    const giftCardsApplied = [];
    
    if (giftCardCode && giftCardAmount > 0) {
      const { GiftCard } = require('../models/Coupon');
      giftCard = await GiftCard.findOne({ code: giftCardCode });
      
      if (!giftCard) {
        return res.status(400).json({ success: false, message: 'Gift card not found' });
      }
      
      const validation = giftCard.isValid();
      if (!validation.valid) {
        return res.status(400).json({ success: false, message: validation.message });
      }
      
      if (giftCard.currentBalance < giftCardAmount) {
        return res.status(400).json({ success: false, message: 'Insufficient gift card balance' });
      }
      
      giftCardsApplied.push({
        giftCard: giftCard._id,
        code: giftCard.code,
        amount: giftCardAmount
      });
    }
    
    // Handle coupon if provided
    const couponsApplied = [];
    let couponDiscount = 0;
    if (couponCode) {
      const { Coupon } = require('../models/Coupon');
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      
      if (coupon) {
        const validation = coupon.isValid(req.user._id, finalSubtotal, orderItems);
        if (validation.valid) {
          const discount = coupon.calculateDiscount(finalSubtotal, orderItems);
          couponDiscount = discount;
          couponsApplied.push({
            coupon: coupon._id,
            code: coupon.code,
            discount: discount,
            type: coupon.type
          });
          // Record coupon usage
          await coupon.recordUsage(req.user._id);
        }
      }
    }
    
    // Calculate total discount (gift card + coupon + PESA Coins)
    const loyaltyPointsDiscount = loyaltyPointsUsed || 0; // Assuming 1 point = R1, adjust as needed
    const totalDiscount = giftCardDiscount + couponDiscount + loyaltyPointsDiscount;
    const finalTotal = providedTotal || Math.max(0, finalSubtotal + finalTax + finalShipping - totalDiscount);
    
    // Determine payment method
    let finalPaymentMethod = paymentMethod;
    if (giftCardAmount > 0 && finalTotal === 0) {
      finalPaymentMethod = 'gift_card';
    } else if (giftCardAmount > 0 && finalTotal > 0) {
      // Partial payment with gift card, keep original payment method
      finalPaymentMethod = paymentMethod || 'card';
    }
    
    const order = await Order.create({
      customer: req.user._id,
      items: orderItems,
      subtotal: finalSubtotal,
      tax: finalTax,
      shipping: finalShipping,
      discount: totalDiscount,
      total: finalTotal,
      billingAddress,
      shippingAddress,
      paymentMethod: finalPaymentMethod,
      giftCardsApplied,
      couponsApplied,
      loyaltyPointsUsed: loyaltyPointsUsed || 0
    });
    
    // Redeem gift card after order creation
    if (giftCard && order._id && giftCardAmount > 0) {
      await giftCard.redeem(giftCardAmount, order._id);
    }
    
    res.status(201).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// UPDATE order status
router.put('/:id/status', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const oldStatus = order.status;
    order.status = req.body.status;
    order.addStatusHistory(req.body.status, req.body.note, req.user._id);
    await order.save();
    
    // Handle PESA Coins
    if (req.body.status === 'completed' && oldStatus !== 'completed') {
      // Assign points for completed order
      await loyaltyService.assignOrderPoints(order._id);
    } else if ((req.body.status === 'cancelled' || req.body.status === 'refunded') && 
               oldStatus !== 'cancelled' && oldStatus !== 'refunded') {
      // Remove points for canceled/refunded order
      await loyaltyService.removeOrderPoints(order._id);
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
});

// UPDATE admin note
router.put('/:id/admin-note', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    // Handle empty string as deletion
    if (req.body.adminNote === '' || req.body.adminNote === null || req.body.adminNote === undefined) {
      order.adminNote = undefined;
    } else {
      order.adminNote = req.body.adminNote;
    }
    
    await order.save();
    
    res.json({ success: true, data: order, message: order.adminNote ? 'Admin note updated successfully' : 'Admin note deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Add a note to the notes array
router.post('/:id/notes', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const { content, isCustomerNotified } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }
    
    order.notes.push({
      content,
      isCustomerNotified: isCustomerNotified || false,
      addedBy: req.user._id,
      createdAt: new Date()
    });
    
    await order.save();
    
    res.json({ success: true, data: order, message: 'Note added successfully' });
  } catch (error) {
    next(error);
  }
});

// Update a note in the notes array
router.put('/:id/notes/:noteId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const note = order.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    const { content, isCustomerNotified } = req.body;
    if (content !== undefined) note.content = content;
    if (isCustomerNotified !== undefined) note.isCustomerNotified = isCustomerNotified;
    
    await order.save();
    
    res.json({ success: true, data: order, message: 'Note updated successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete a note from the notes array
router.delete('/:id/notes/:noteId', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    
    const note = order.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ success: false, message: 'Note not found' });
    
    note.deleteOne();
    await order.save();
    
    res.json({ success: true, data: order, message: 'Note deleted successfully' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
