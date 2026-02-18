const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { LoyaltyPoint, LoyaltySetting } = require('../models/LoyaltyPoint');
const LoyaltyRule = require('../models/LoyaltyRule');
const LoyaltyLevel = require('../models/LoyaltyLevel');
const LoyaltyBanner = require('../models/LoyaltyBanner');
const User = require('../models/User');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Currency = require('../models/Currency');
const loyaltyService = require('../services/loyaltyService');
const { LOYALTY_TYPES } = require('../config/constants');

// ==================== PUBLIC / CUSTOMER ENDPOINTS ====================

// GET public loyalty settings (for frontend widgets)
router.get('/public/settings', async (req, res, next) => {
  try {
    let settings = await LoyaltySetting.findOne();
    if (!settings) {
      settings = await LoyaltySetting.create({});
    }
    // Return only public-facing fields
    res.json({
      success: true,
      data: {
        enabled: settings.enabled,
        pointsPerCurrency: settings.pointsPerCurrency,
        priceBase: settings.priceBase,
        redemptionRate: settings.redemptionRate,
        redemptionType: settings.redemptionType,
        minRedemptionPoints: settings.minRedemptionPoints,
        maxRedemptionPercentage: settings.maxRedemptionPercentage,
        labels: settings.labels,
        signupBonus: settings.signupBonus,
        reviewBonus: settings.reviewBonus,
        referralRegistrationBonus: settings.referralRegistrationBonus,
        excludeOnSale: settings.excludeOnSale
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST calculate points for a single product (public - for product detail widget)
router.post('/public/calculate-product-points', async (req, res, next) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const settings = await LoyaltySetting.findOne();
    if (!settings || !settings.enabled) {
      return res.json({ success: true, data: { points: 0, cashValue: 0 } });
    }

    const product = await Product.findById(productId).populate('categories');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Check global exclusions
    if (settings.excludeProducts.some(id => id.toString() === product._id.toString())) {
      return res.json({ success: true, data: { points: 0, cashValue: 0 } });
    }
    if (product.categories && settings.excludeCategories.some(catId =>
      product.categories.some(c => (c._id ? c._id.toString() : c.toString()) === catId.toString())
    )) {
      return res.json({ success: true, data: { points: 0, cashValue: 0 } });
    }
    if (settings.excludeOnSale && product.salePrice && product.salePrice < product.regularPrice) {
      return res.json({ success: true, data: { points: 0, cashValue: 0 } });
    }

    // Always use backend price (ZAR) for calculation
    const priceBase = settings.priceBase || 'regular';
    let itemPrice = product.regularPrice;
    if (priceBase === 'backend') {
      itemPrice = product.backendPrice || product.regularPrice;
    } else if (priceBase === 'sale') {
      itemPrice = product.salePrice || product.regularPrice;
    }

    const itemTotal = itemPrice * quantity;

    // Check for matching earning rules
    const rules = await LoyaltyRule.find({ ruleType: 'earning', isActive: true }).sort({ priority: -1 });
    let points = 0;
    let ruleApplied = false;

    for (const rule of rules) {
      // Simplified product-level check (no user context for public endpoint)
      if (rule.excludeProducts.length > 0 && rule.excludeProducts.some(id => id.toString() === product._id.toString())) continue;
      if (rule.applyToProducts.length > 0 && !rule.applyToProducts.some(id => id.toString() === product._id.toString())) continue;
      if (rule.excludeOnSale && product.salePrice && product.salePrice < product.regularPrice) continue;

      const rulePrice = rule.priceBase === 'backend' ? (product.backendPrice || product.regularPrice) :
        rule.priceBase === 'sale' ? (product.salePrice || product.regularPrice) : product.regularPrice;
      if (rule.minPrice && rulePrice < rule.minPrice) continue;
      if (rule.maxPrice && rulePrice > rule.maxPrice) continue;

      if (rule.fixedPoints) {
        points = rule.fixedPoints * quantity;
      } else if (rule.pointsPerCurrency) {
        points = itemTotal * rule.pointsPerCurrency;
      } else if (rule.pointsPerCurrencyPercentage) {
        points = (itemTotal * rule.pointsPerCurrencyPercentage) / 100;
      }
      ruleApplied = true;
      break;
    }

    if (!ruleApplied) {
      points = itemTotal * settings.pointsPerCurrency;
    }

    points = Math.floor(points);
    // Cash value in ZAR (base currency)
    const cashValueZAR = points * settings.redemptionRate;

    res.json({
      success: true,
      data: {
        points,
        cashValueZAR,
        redemptionRate: settings.redemptionRate,
        labels: settings.labels
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST calculate points for cart items (public - for cart/checkout widgets)
router.post('/public/calculate-cart-points', async (req, res, next) => {
  try {
    const { items } = req.body; // [{ productId, quantity }]
    const settings = await LoyaltySetting.findOne();
    if (!settings || !settings.enabled || !items || items.length === 0) {
      return res.json({ success: true, data: { points: 0, cashValueZAR: 0 } });
    }

    let totalPoints = 0;
    const rules = await LoyaltyRule.find({ ruleType: 'earning', isActive: true }).sort({ priority: -1 });

    for (const item of items) {
      const product = await Product.findById(item.productId).populate('categories');
      if (!product) continue;

      // Check global exclusions
      if (settings.excludeProducts.some(id => id.toString() === product._id.toString())) continue;
      if (product.categories && settings.excludeCategories.some(catId =>
        product.categories.some(c => (c._id ? c._id.toString() : c.toString()) === catId.toString())
      )) continue;
      if (settings.excludeOnSale && product.salePrice && product.salePrice < product.regularPrice) continue;

      const priceBase = settings.priceBase || 'regular';
      let itemPrice = product.regularPrice;
      if (priceBase === 'backend') {
        itemPrice = product.backendPrice || product.regularPrice;
      } else if (priceBase === 'sale') {
        itemPrice = product.salePrice || product.regularPrice;
      }

      const itemTotal = itemPrice * (item.quantity || 1);
      let ruleApplied = false;

      for (const rule of rules) {
        if (rule.excludeProducts.length > 0 && rule.excludeProducts.some(id => id.toString() === product._id.toString())) continue;
        if (rule.applyToProducts.length > 0 && !rule.applyToProducts.some(id => id.toString() === product._id.toString())) continue;
        if (rule.excludeOnSale && product.salePrice && product.salePrice < product.regularPrice) continue;

        let pts = 0;
        if (rule.fixedPoints) {
          pts = rule.fixedPoints * (item.quantity || 1);
        } else if (rule.pointsPerCurrency) {
          pts = itemTotal * rule.pointsPerCurrency;
        } else if (rule.pointsPerCurrencyPercentage) {
          pts = (itemTotal * rule.pointsPerCurrencyPercentage) / 100;
        }
        totalPoints += Math.floor(pts);
        ruleApplied = true;
        break;
      }

      if (!ruleApplied) {
        totalPoints += Math.floor(itemTotal * settings.pointsPerCurrency);
      }
    }

    const cashValueZAR = totalPoints * settings.redemptionRate;

    res.json({
      success: true,
      data: {
        points: totalPoints,
        cashValueZAR,
        redemptionRate: settings.redemptionRate,
        labels: settings.labels
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET my loyalty overview (authenticated customer)
router.get('/my-overview', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const settings = await LoyaltySetting.findOne();
    if (!settings || !settings.enabled) {
      return res.json({ success: true, data: { enabled: false } });
    }

    const balance = await LoyaltyPoint.getUserBalance(req.user._id);
    const cashValueZAR = balance * (settings.redemptionRate || 0);

    const level = user.currentLoyaltyLevel
      ? await LoyaltyLevel.findById(user.currentLoyaltyLevel)
      : await LoyaltyLevel.getLevelByPoints(balance);
    const nextLevel = level ? await LoyaltyLevel.getNextLevel(level) : await LoyaltyLevel.findOne({ isActive: true }).sort({ minPoints: 1 });

    // Recent transactions
    const recentTransactions = await LoyaltyPoint.find({ user: req.user._id })
      .populate('order', 'orderNumber total')
      .sort({ createdAt: -1 })
      .limit(10);

    // Points expiring soon (next 30 days)
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const expiringPoints = await LoyaltyPoint.aggregate([
      {
        $match: {
          user: user._id,
          isExpired: false,
          points: { $gt: 0 },
          expiryDate: { $ne: null, $lte: thirtyDaysFromNow, $gt: new Date() }
        }
      },
      { $group: { _id: null, total: { $sum: '$points' } } }
    ]);

    res.json({
      success: true,
      data: {
        enabled: true,
        balance,
        cashValueZAR,
        redemptionRate: settings.redemptionRate,
        labels: settings.labels,
        currentLevel: level,
        nextLevel,
        pointsToNextLevel: nextLevel ? Math.max(0, nextLevel.minPoints - balance) : 0,
        expiringPoints: expiringPoints.length > 0 ? expiringPoints[0].total : 0,
        recentTransactions
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST share points with another customer
router.post('/share', protect, async (req, res, next) => {
  try {
    const { recipientEmail, points, message } = req.body;
    const settings = await LoyaltySetting.findOne();
    if (!settings || !settings.enabled) {
      return res.status(400).json({ success: false, message: 'Loyalty program is not active' });
    }

    if (!recipientEmail || !points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Recipient email and a positive points amount are required' });
    }

    if (recipientEmail.toLowerCase() === req.user.email.toLowerCase()) {
      return res.status(400).json({ success: false, message: 'You cannot share points with yourself' });
    }

    const sender = await User.findById(req.user._id);
    const recipient = await User.findOne({ email: recipientEmail.toLowerCase(), role: 'customer' });

    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found. They must have an account on this platform.' });
    }

    if (recipient.loyaltyPointsBanned) {
      return res.status(400).json({ success: false, message: 'Recipient is not eligible for PESA Coins' });
    }

    const senderBalance = await LoyaltyPoint.getUserBalance(sender._id);
    if (senderBalance < points) {
      return res.status(400).json({ success: false, message: `Insufficient points. Your balance is ${senderBalance}.` });
    }

    // Deduct from sender
    await LoyaltyPoint.addPoints(
      sender._id,
      -points,
      LOYALTY_TYPES.SHARED_OUT,
      `Shared ${points} points with ${recipient.firstName} ${recipient.lastName} (${recipientEmail})${message ? ': ' + message : ''}`
    );

    // Add to recipient
    await LoyaltyPoint.addPoints(
      recipient._id,
      points,
      LOYALTY_TYPES.SHARED_IN,
      `Received ${points} points from ${sender.firstName} ${sender.lastName} (${sender.email})${message ? ': ' + message : ''}`
    );

    res.json({
      success: true,
      message: `Successfully shared ${points} points with ${recipient.firstName} ${recipient.lastName}`,
      data: {
        pointsShared: points,
        newBalance: await LoyaltyPoint.getUserBalance(sender._id)
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST convert points to store credit (money)
router.post('/convert', protect, async (req, res, next) => {
  try {
    const { points } = req.body;
    const settings = await LoyaltySetting.findOne();
    if (!settings || !settings.enabled) {
      return res.status(400).json({ success: false, message: 'Loyalty program is not active' });
    }

    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'A positive points amount is required' });
    }

    if (points < (settings.minRedemptionPoints || 100)) {
      return res.status(400).json({ success: false, message: `Minimum ${settings.minRedemptionPoints || 100} points required for conversion` });
    }

    const user = await User.findById(req.user._id);
    const balance = await LoyaltyPoint.getUserBalance(user._id);

    if (balance < points) {
      return res.status(400).json({ success: false, message: `Insufficient points. Your balance is ${balance}.` });
    }

    // Calculate ZAR value
    const cashValueZAR = points * settings.redemptionRate;

    // Deduct points
    await LoyaltyPoint.addPoints(
      user._id,
      -points,
      LOYALTY_TYPES.CONVERTED,
      `Converted ${points} points to R${cashValueZAR.toFixed(2)} store credit`
    );

    // Add store credit to user
    await User.findByIdAndUpdate(user._id, {
      $inc: { storeCredit: cashValueZAR }
    });

    res.json({
      success: true,
      message: `Successfully converted ${points} points to R${cashValueZAR.toFixed(2)} store credit`,
      data: {
        pointsConverted: points,
        cashValueZAR,
        newBalance: await LoyaltyPoint.getUserBalance(user._id),
        newStoreCredit: (user.storeCredit || 0) + cashValueZAR
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET all currencies (for frontend currency conversion of cash values)
router.get('/public/currencies', async (req, res, next) => {
  try {
    const currencies = await Currency.find({ isActive: true, showInFrontend: true }).sort({ code: 1 });
    res.json({ success: true, data: currencies });
  } catch (error) {
    next(error);
  }
});

// ==================== SETTINGS ====================

// GET loyalty settings
router.get('/settings', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    let settings = await LoyaltySetting.findOne();
    if (!settings) {
      settings = await LoyaltySetting.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

// PUT update loyalty settings
router.put('/settings', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    let settings = await LoyaltySetting.findOne();
    if (!settings) {
      settings = await LoyaltySetting.create(req.body);
    } else {
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          settings[key] = req.body[key];
        }
      });
      await settings.save();
    }
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== POINTS ====================

// GET user points balance
router.get('/balance', protect, async (req, res, next) => {
  try {
    const balance = await LoyaltyPoint.getUserBalance(req.user._id);
    res.json({ success: true, data: { balance } });
  } catch (error) {
    next(error);
  }
});

// GET user points history
router.get('/history', protect, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const points = await LoyaltyPoint.find({ user: req.user._id })
      .populate('order', 'orderNumber total')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await LoyaltyPoint.countDocuments({ user: req.user._id });
    
    res.json({
      success: true,
      data: points,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST manually assign/remove points
router.post('/points/manual', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { userId, points, reason, type } = req.body;
    
    if (!userId || !points || !reason) {
      return res.status(400).json({ success: false, message: 'userId, points, and reason are required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.loyaltyPointsBanned) {
      return res.status(400).json({ success: false, message: 'User is banned from earning points' });
    }
    
    await LoyaltyPoint.addPoints(
      userId,
      points,
      type || LOYALTY_TYPES.ADJUSTED,
      reason
    );
    
    await loyaltyService.checkLevelUp(userId);
    
    res.json({ success: true, message: 'Points assigned successfully' });
  } catch (error) {
    next(error);
  }
});

// POST bulk assign/remove points
router.post('/points/bulk', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { userIds, points, reason, type, conditions } = req.body;
    
    let query = { role: 'customer', loyaltyPointsBanned: false };
    
    if (userIds && userIds.length > 0) {
      query._id = { $in: userIds };
    } else if (conditions) {
      if (conditions.roles) query.role = { $in: conditions.roles };
      if (conditions.groups) query.customerGroup = { $in: conditions.groups };
      if (conditions.minPoints) query.loyaltyPoints = { $gte: conditions.minPoints };
      if (conditions.maxPoints) {
        query.loyaltyPoints = { ...query.loyaltyPoints, $lte: conditions.maxPoints };
      }
    }
    
    const users = await User.find(query);
    let assigned = 0;
    
    for (const user of users) {
      try {
        await LoyaltyPoint.addPoints(
          user._id,
          points,
          type || LOYALTY_TYPES.ADJUSTED,
          reason || 'Bulk points assignment'
        );
        await loyaltyService.checkLevelUp(user._id);
        assigned++;
      } catch (err) {
        console.error(`Error assigning points to user ${user._id}:`, err);
      }
    }
    
    res.json({ success: true, message: `Points assigned to ${assigned} users` });
  } catch (error) {
    next(error);
  }
});

// ==================== RULES ====================

// GET all loyalty rules
router.get('/rules', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const query = {};
    if (req.query.ruleType) query.ruleType = req.query.ruleType;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    
    const rules = await LoyaltyRule.find(query)
      .populate('applyToProducts', 'name')
      .populate('excludeProducts', 'name')
      .populate('applyToCategories', 'name')
      .populate('excludeCategories', 'name')
      .populate('applyToLevels', 'name')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
});

// GET single rule
router.get('/rules/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const rule = await LoyaltyRule.findById(req.params.id)
      .populate('applyToProducts', 'name')
      .populate('excludeProducts', 'name')
      .populate('applyToCategories', 'name')
      .populate('excludeCategories', 'name')
      .populate('applyToLevels', 'name');
    
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
});

// POST create rule
router.post('/rules', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const rule = await LoyaltyRule.create(req.body);
    res.status(201).json({ success: true, data: rule, message: 'Rule created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT update rule
router.put('/rules/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const rule = await LoyaltyRule.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    
    res.json({ success: true, data: rule, message: 'Rule updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE rule
router.delete('/rules/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const rule = await LoyaltyRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Rule not found' });
    }
    res.json({ success: true, message: 'Rule deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== LEVELS ====================

// GET all levels
router.get('/levels', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const query = {};
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    
    const levels = await LoyaltyLevel.find(query).sort({ minPoints: 1 });
    res.json({ success: true, data: levels });
  } catch (error) {
    next(error);
  }
});

// GET single level
router.get('/levels/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const level = await LoyaltyLevel.findById(req.params.id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    res.json({ success: true, data: level });
  } catch (error) {
    next(error);
  }
});

// POST create level
router.post('/levels', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const level = await LoyaltyLevel.create(req.body);
    res.status(201).json({ success: true, data: level, message: 'Level created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT update level
router.put('/levels/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const level = await LoyaltyLevel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    
    res.json({ success: true, data: level, message: 'Level updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE level
router.delete('/levels/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const level = await LoyaltyLevel.findByIdAndDelete(req.params.id);
    if (!level) {
      return res.status(404).json({ success: false, message: 'Level not found' });
    }
    res.json({ success: true, message: 'Level deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== BANNERS ====================

// GET all banners
router.get('/banners', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const query = {};
    if (req.query.type) query.type = req.query.type;
    if (req.query.isActive !== undefined) query.isActive = req.query.isActive === 'true';
    
    const banners = await LoyaltyBanner.find(query).sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
});

// GET single banner
router.get('/banners/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const banner = await LoyaltyBanner.findById(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.json({ success: true, data: banner });
  } catch (error) {
    next(error);
  }
});

// POST create banner
router.post('/banners', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const banner = await LoyaltyBanner.create(req.body);
    res.status(201).json({ success: true, data: banner, message: 'Banner created successfully' });
  } catch (error) {
    next(error);
  }
});

// PUT update banner
router.put('/banners/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const banner = await LoyaltyBanner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    
    res.json({ success: true, data: banner, message: 'Banner updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE banner
router.delete('/banners/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const banner = await LoyaltyBanner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== RANKING ====================

// GET top customers ranking
router.get('/ranking', protect, async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const period = req.query.period || 'all'; // 'all', 'week', 'month'
    
    const ranking = await loyaltyService.getTopCustomers(limit, period);
    
    res.json({ success: true, data: ranking });
  } catch (error) {
    next(error);
  }
});

// POST award top customer bonus
router.post('/ranking/top-customer-bonus', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const settings = await LoyaltySetting.findOne();
    if (!settings || !settings.topCustomerBonus <= 0) {
      return res.status(400).json({ success: false, message: 'Top customer bonus not configured' });
    }
    
    const period = settings.topCustomerPeriod || 'monthly';
    const ranking = await loyaltyService.getTopCustomers(1, period === 'monthly' ? 'month' : 'week');
    
    if (ranking.length > 0) {
      const topCustomer = ranking[0];
      await loyaltyService.awardExtraPoints(
        topCustomer._id,
        'top_customer',
        { period }
      );
      
      res.json({ success: true, message: `Top customer bonus awarded to ${topCustomer.firstName} ${topCustomer.lastName}` });
    } else {
      res.json({ success: true, message: 'No customers found for ranking' });
    }
  } catch (error) {
    next(error);
  }
});

// ==================== REDEMPTION ====================

// POST calculate redemption value
router.post('/redemption/calculate', protect, async (req, res, next) => {
  try {
    const { points, orderTotal } = req.body;
    const user = await User.findById(req.user._id);
    
    const result = await loyaltyService.calculateRedemptionValue(points, user, orderTotal);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST redeem points
router.post('/redemption/redeem', protect, async (req, res, next) => {
  try {
    const { points, orderId, reason } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!points || points <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid points amount' });
    }
    
    const balance = await LoyaltyPoint.getUserBalance(user._id);
    if (balance < points) {
      return res.status(400).json({ success: false, message: 'Insufficient points' });
    }
    
    const order = orderId ? await Order.findById(orderId) : null;
    const orderTotal = order ? order.total : 0;
    
    const redemption = await loyaltyService.calculateRedemptionValue(points, user, orderTotal);
    if (redemption.error) {
      return res.status(400).json({ success: false, message: redemption.error });
    }
    
    await LoyaltyPoint.redeemPoints(
      user._id,
      redemption.points,
      orderId,
      reason || 'Points redemption'
    );
    
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, {
        loyaltyPointsUsed: redemption.points,
        discount: (order.discount || 0) + redemption.value
      });
    }
    
    res.json({
      success: true,
      data: {
        pointsRedeemed: redemption.points,
        discountValue: redemption.value
      },
      message: 'Points redeemed successfully'
    });
  } catch (error) {
    next(error);
  }
});

// ==================== USER MANAGEMENT ====================

// PUT ban/unban user from earning points
router.put('/users/:id/ban', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { banned } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { loyaltyPointsBanned: banned !== false },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user,
      message: `User ${banned !== false ? 'banned' : 'unbanned'} from earning points`
    });
  } catch (error) {
    next(error);
  }
});

// GET user's current level
router.get('/users/:id/level', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const level = user.currentLoyaltyLevel
      ? await LoyaltyLevel.findById(user.currentLoyaltyLevel)
      : await LoyaltyLevel.getLevelByPoints(user.loyaltyPoints || 0);
    
    const nextLevel = level ? await LoyaltyLevel.getNextLevel(level) : null;
    
    res.json({
      success: true,
      data: {
        currentLevel: level,
        nextLevel,
        points: user.loyaltyPoints || 0,
        pointsToNextLevel: nextLevel ? Math.max(0, nextLevel.minPoints - (user.loyaltyPoints || 0)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
