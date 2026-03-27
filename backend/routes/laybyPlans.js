const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const LaybyPlan = require('../models/LaybyPlan');
const Settings = require('../models/Settings');
const { LAYBYE_FREQUENCY } = require('../config/constants');

// GET all layby plans
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const query = {};
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    const plans = await LaybyPlan.find(query)
      .sort({ displayOrder: 1, createdAt: -1 });
    
    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    next(error);
  }
});

// GET active layby plans (public — for frontend storefront inline display)
router.get('/active/list', async (req, res, next) => {
  try {
    const plans = await LaybyPlan.find({ isActive: true })
      .sort({ displayOrder: 1, createdAt: -1 });

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

// GET check if a product qualifies for any active layby plan (public)
router.get('/check-product/:productId', async (req, res, next) => {
  try {
    // Check global laybye enabled setting
    const settings = await Settings.getSettings();
    if (!settings.layby?.enabled) {
      return res.json({ success: true, eligible: false, plans: [] });
    }

    const Product = require('../models/Product');
    const product = await Product.findById(req.params.productId).populate('categories', '_id');
    if (!product) {
      return res.json({ success: true, eligible: false, plans: [] });
    }

    const activePlans = await LaybyPlan.find({ isActive: true }).sort({ displayOrder: 1 });
    const eligiblePlans = [];

    for (const plan of activePlans) {
      const result = plan.isProductEligible(product);
      if (result.eligible) {
        eligiblePlans.push({
          _id: plan._id,
          name: plan.name,
          depositPercentage: plan.depositPercentage,
          numberOfPayments: plan.numberOfPayments,
          frequency: plan.frequency,
        });
      }
    }

    res.json({ success: true, eligible: eligiblePlans.length > 0, plans: eligiblePlans });
  } catch (error) {
    next(error);
  }
});

// GET batch check layby eligibility for multiple products (public)
router.post('/check-products', async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.json({ success: true, data: {} });
    }

    // Check global laybye enabled setting
    const settings = await Settings.getSettings();
    if (!settings.layby?.enabled) {
      const allFalse = {};
      productIds.forEach(id => { allFalse[id] = false; });
      return res.json({ success: true, data: allFalse });
    }

    const Product = require('../models/Product');
    const products = await Product.find({ _id: { $in: productIds } }).populate('categories', '_id');
    const activePlans = await LaybyPlan.find({ isActive: true }).sort({ displayOrder: 1 });

    const result = {};
    for (const product of products) {
      let eligible = false;
      for (const plan of activePlans) {
        const check = plan.isProductEligible(product);
        if (check.eligible) {
          eligible = true;
          break;
        }
      }
      result[product._id.toString()] = eligible;
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// GET single layby plan
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const plan = await LaybyPlan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Layby plan not found' });
    }
    
    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    next(error);
  }
});

// POST create layby plan
router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const plan = await LaybyPlan.create(req.body);
    
    res.status(201).json({
      success: true,
      data: plan,
      message: 'Layby plan created successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

// PUT update layby plan
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const plan = await LaybyPlan.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Layby plan not found' });
    }
    
    res.json({
      success: true,
      data: plan,
      message: 'Layby plan updated successfully'
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
});

// DELETE layby plan
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const plan = await LaybyPlan.findById(req.params.id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Layby plan not found' });
    }
    
    // Check if plan is in use
    const Laybye = require('../models/Laybye');
    const inUse = await Laybye.countDocuments({ laybyPlan: plan._id });
    
    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete plan. It is being used by ${inUse} laybye(s).`
      });
    }
    
    await LaybyPlan.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Layby plan deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
