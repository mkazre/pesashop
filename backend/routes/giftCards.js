const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { GiftCard } = require('../models/Coupon');
const emailService = require('../services/emailService');

// ==================== PUBLIC / CUSTOMER ENDPOINTS ====================

// GET check gift card balance (public — no auth needed)
router.get('/public/check-balance/:code', async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().replace(/-/g, '');
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;

    const giftCard = await GiftCard.findOne({ code: formattedCode });
    if (!giftCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }

    const validation = giftCard.isValid();

    res.json({
      success: true,
      data: {
        code: giftCard.code,
        currentBalance: giftCard.currentBalance,
        initialBalance: giftCard.initialBalance,
        currency: giftCard.currency,
        isActive: giftCard.isActive,
        isExpired: giftCard.expiryDate ? new Date() > giftCard.expiryDate : false,
        expiryDate: giftCard.expiryDate,
        isValid: validation.valid,
        message: validation.valid ? 'Gift card is valid' : validation.message
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET my gift cards (authenticated customer — purchased and received)
router.get('/my-gift-cards', protect, async (req, res, next) => {
  try {
    const user = req.user;

    // Gift cards purchased by this user
    const purchasedRaw = await GiftCard.find({ purchasedBy: user._id })
      .sort({ createdAt: -1 })
      .select('code initialBalance currentBalance currency recipientEmail recipientName senderMessage isActive isRedeemed expiryDate paymentStatus createdAt');

    // Gift cards received by this user (by email)
    const receivedRaw = await GiftCard.find({
      recipientEmail: { $regex: new RegExp(`^${user.email}$`, 'i') },
      purchasedBy: { $ne: user._id }
    })
      .sort({ createdAt: -1 })
      .select('code initialBalance currentBalance currency senderName senderMessage isActive isRedeemed expiryDate paymentStatus createdAt');

    // Hide code for pending_payment gift cards
    const maskCard = (gc) => {
      const obj = gc.toObject();
      if (obj.paymentStatus === 'pending_payment') {
        obj.code = '****-****-****-****';
      }
      return obj;
    };

    res.json({
      success: true,
      data: {
        purchased: purchasedRaw.map(maskCard),
        received: receivedRaw.map(maskCard),
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST send gift card to a friend (from existing balance — splits a gift card)
router.post('/send-to-friend', protect, async (req, res, next) => {
  try {
    const { giftCardId, amount, recipientEmail, recipientName, message } = req.body;

    if (!giftCardId || !amount || !recipientEmail) {
      return res.status(400).json({ success: false, message: 'Gift card ID, amount, and recipient email are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ success: false, message: 'Amount must be positive' });
    }

    // Find the source gift card
    const sourceCard = await GiftCard.findById(giftCardId);
    if (!sourceCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }

    // Verify ownership (purchased by user or received by user email)
    const isOwner = sourceCard.purchasedBy?.toString() === req.user._id.toString();
    const isRecipient = sourceCard.recipientEmail?.toLowerCase() === req.user.email.toLowerCase();
    if (!isOwner && !isRecipient) {
      return res.status(403).json({ success: false, message: 'You do not own this gift card' });
    }

    if (sourceCard.currentBalance < amount) {
      return res.status(400).json({ success: false, message: `Insufficient balance. Current balance: R${sourceCard.currentBalance.toFixed(2)}` });
    }

    // Deduct from source
    sourceCard.currentBalance -= amount;
    sourceCard.usageHistory.push({
      amount,
      balanceAfter: sourceCard.currentBalance,
      date: new Date()
    });
    if (sourceCard.currentBalance === 0) sourceCard.isRedeemed = true;
    await sourceCard.save();

    // Create new gift card for recipient
    const newCode = await GiftCard.generateCode();
    const newCard = await GiftCard.create({
      code: newCode,
      initialBalance: amount,
      currentBalance: amount,
      currency: sourceCard.currency,
      recipientEmail,
      recipientName: recipientName || '',
      senderName: `${req.user.firstName} ${req.user.lastName}`,
      senderMessage: message || '',
      purchasedBy: req.user._id,
      activationDate: new Date(),
      expiryDate: sourceCard.expiryDate, // Same expiry as source
      isActive: true
    });

    res.json({
      success: true,
      message: `Gift card of R${amount.toFixed(2)} sent to ${recipientEmail}`,
      data: {
        newGiftCard: {
          code: newCard.code,
          amount: newCard.initialBalance,
          recipientEmail: newCard.recipientEmail
        },
        sourceBalance: sourceCard.currentBalance
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET gift card usage history (for a specific card owned by user)
router.get('/my-gift-cards/:id/history', protect, async (req, res, next) => {
  try {
    const giftCard = await GiftCard.findById(req.params.id)
      .populate('usageHistory.order', 'orderNumber total createdAt');

    if (!giftCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }

    // Verify ownership
    const isOwner = giftCard.purchasedBy?.toString() === req.user._id.toString();
    const isRecipient = giftCard.recipientEmail?.toLowerCase() === req.user.email.toLowerCase();
    if (!isOwner && !isRecipient) {
      return res.status(403).json({ success: false, message: 'You do not own this gift card' });
    }

    res.json({
      success: true,
      data: {
        code: giftCard.code,
        initialBalance: giftCard.initialBalance,
        currentBalance: giftCard.currentBalance,
        usageHistory: giftCard.usageHistory
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== ADMIN GIFT CARDS ====================

// GET all gift cards
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const isActive = req.query.isActive;
    
    const query = {};
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { recipientEmail: { $regex: search, $options: 'i' } },
        { recipientName: { $regex: search, $options: 'i' } }
      ];
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    const giftCards = await GiftCard.find(query)
      .populate('purchasedBy', 'name email')
      .populate('purchaseOrder', 'orderNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await GiftCard.countDocuments(query);
    
    res.json({
      success: true,
      data: giftCards,
      total,
      page,
      pages: Math.ceil(total / limit),
      limit
    });
  } catch (error) {
    next(error);
  }
});

// GET single gift card
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const giftCard = await GiftCard.findById(req.params.id)
      .populate('purchasedBy', 'name email')
      .populate('purchaseOrder', 'orderNumber')
      .populate('usageHistory.order', 'orderNumber');
    
    if (!giftCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }
    
    res.json({ success: true, data: giftCard });
  } catch (error) {
    next(error);
  }
});

// POST create gift card
router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    // Generate unique code
    const code = await GiftCard.generateCode();
    
    // Create gift card
    const giftCardData = {
      ...req.body,
      code,
      initialBalance: parseFloat(req.body.initialBalance) || parseFloat(req.body.currentBalance) || 0,
      currentBalance: parseFloat(req.body.currentBalance) || parseFloat(req.body.initialBalance) || 0,
      purchasedBy: req.user._id, // Admin creating it
      activationDate: req.body.activationDate ? new Date(req.body.activationDate) : new Date(),
      expiryDate: req.body.expiryDate ? new Date(req.body.expiryDate) : undefined
    };
    
    const giftCard = await GiftCard.create(giftCardData);

    // Admin-issued cards are active immediately (no payment step) — send now.
    if (giftCard.isActive && giftCard.paymentStatus !== 'pending_payment' && giftCard.recipientEmail) {
      try {
        await emailService.sendGiftCard(giftCard);
      } catch (emailErr) {
        console.error('Failed to send gift card email:', emailErr);
      }
    }

    res.status(201).json({
      success: true,
      data: giftCard,
      message: 'Gift card created successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Gift card code already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    next(error);
  }
});

// PUT update gift card
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const updateData = { ...req.body };
    
    // Handle date fields
    if (updateData.activationDate) {
      updateData.activationDate = new Date(updateData.activationDate);
    }
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate);
    }
    
    // Handle balance updates
    if (updateData.initialBalance !== undefined) {
      updateData.initialBalance = parseFloat(updateData.initialBalance);
    }
    if (updateData.currentBalance !== undefined) {
      updateData.currentBalance = parseFloat(updateData.currentBalance);
    }
    
    const giftCard = await GiftCard.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!giftCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }
    
    res.json({ 
      success: true, 
      data: giftCard, 
      message: 'Gift card updated successfully' 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    next(error);
  }
});

// PUT confirm gift card payment (admin activates a pending gift card)
router.put('/:id/confirm-payment', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const giftCard = await GiftCard.findById(req.params.id);
    if (!giftCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }

    if (giftCard.paymentStatus === 'confirmed') {
      return res.status(400).json({ success: false, message: 'Gift card payment is already confirmed' });
    }

    giftCard.paymentStatus = 'confirmed';
    giftCard.isActive = true;
    giftCard.activationDate = new Date();
    giftCard.paymentConfirmedAt = new Date();
    giftCard.paymentConfirmedBy = req.user._id;
    await giftCard.save();

    if (giftCard.recipientEmail) {
      try {
        await emailService.sendGiftCard(giftCard);
      } catch (emailErr) {
        console.error('Failed to send gift card email:', emailErr);
      }
    }

    res.json({
      success: true,
      data: giftCard,
      message: 'Gift card payment confirmed and activated'
    });
  } catch (error) {
    next(error);
  }
});

// DELETE gift card
router.delete('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const giftCard = await GiftCard.findByIdAndDelete(req.params.id);
    
    if (!giftCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }
    
    res.json({ 
      success: true, 
      message: 'Gift card deleted successfully' 
    });
  } catch (error) {
    next(error);
  }
});

// GET validate gift card code
router.get('/validate/:code', protect, async (req, res, next) => {
  try {
    const code = req.params.code.toUpperCase().replace(/-/g, '');
    const formattedCode = code.match(/.{1,4}/g)?.join('-') || code;
    
    const giftCard = await GiftCard.findOne({ code: formattedCode });
    
    if (!giftCard) {
      return res.status(404).json({ success: false, message: 'Gift card not found' });
    }
    
    const validation = giftCard.isValid();
    
    if (!validation.valid) {
      return res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
    }
    
    res.json({
      success: true,
      data: {
        giftCard: {
          _id: giftCard._id,
          code: giftCard.code,
          currentBalance: giftCard.currentBalance,
          currency: giftCard.currency
        },
        balance: validation.balance,
        message: 'Gift card is valid'
      }
    });
  } catch (error) {
    next(error);
  }
});

// ==================== GIFT CARD PRESETS ====================
// These are preset amounts that customers can purchase

// GET gift card presets (for frontend shop)
router.get('/presets/list', async (req, res, next) => {
  try {
    // Get presets from settings or return default presets
    // For now, return common preset amounts
    const presets = [
      { amount: 50 },
      { amount: 100 },
      { amount: 200 },
      { amount: 500 },
      { amount: 1000 },
    ];
    
    res.json({
      success: true,
      data: presets,
      allowCustom: true, // Allow customers to set custom amounts
      minAmount: 10,
      maxAmount: 10000
    });
  } catch (error) {
    next(error);
  }
});

// POST purchase gift card (customer purchase)
router.post('/purchase', protect, async (req, res, next) => {
  try {
    const { amount, recipientEmail, recipientName, senderName, senderMessage, expiryDays } = req.body;
    
    if (!amount || amount < 10) {
      return res.status(400).json({ success: false, message: 'Minimum gift card amount is 10' });
    }
    
    if (amount > 10000) {
      return res.status(400).json({ success: false, message: 'Maximum gift card amount is 10,000' });
    }
    
    // Generate unique code
    const code = await GiftCard.generateCode();
    
    // Calculate expiry date (default 1 year if not specified)
    const expiryDate = expiryDays 
      ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
      : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year default
    
    // Create gift card as pending (inactive until admin confirms payment)
    const giftCard = await GiftCard.create({
      code,
      initialBalance: parseFloat(amount),
      currentBalance: parseFloat(amount),
      recipientEmail: recipientEmail || req.user.email,
      recipientName: recipientName || req.user.name,
      senderName: senderName || req.user.name,
      senderMessage,
      purchasedBy: req.user._id,
      activationDate: null,
      expiryDate,
      isActive: false,
      isRedeemed: false,
      paymentStatus: 'pending_payment',
    });
    
    res.status(201).json({
      success: true,
      data: {
        _id: giftCard._id,
        initialBalance: giftCard.initialBalance,
        recipientEmail: giftCard.recipientEmail,
        recipientName: giftCard.recipientName,
        paymentStatus: giftCard.paymentStatus,
        createdAt: giftCard.createdAt,
      },
      message: 'Gift card purchase submitted! It will be activated once payment is confirmed by the store.'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Gift card code already exists' });
    }
    next(error);
  }
});

module.exports = router;
