const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const LaybyPlan = require('../models/LaybyPlan');
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
