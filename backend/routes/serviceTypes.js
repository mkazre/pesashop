const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const ServiceType = require('../models/ServiceType');
const Category = require('../models/Category');

// ═══════════════════════════════════════════════════════════
//  PUBLIC
// ═══════════════════════════════════════════════════════════

// GET /api/service-types — active service types (public)
// Query params:
//   categoryIds — comma-separated list of the product's category IDs
//                  When provided: returns 'all_products' types PLUS
//                  'linked_categories_only' types whose linkedCategories overlap.
//                  Without: returns all active types.
router.get('/', async (req, res) => {
  try {
    const { categoryIds } = req.query;
    const filter = { isActive: true };

    let types;
    if (categoryIds) {
      const ids = categoryIds.split(',').filter(Boolean);
      // Return types that show on all products OR are linked to one of the provided categories
      types = await ServiceType.find({
        isActive: true,
        $or: [
          { filterBehavior: 'all_products' },
          { filterBehavior: 'linked_categories_only', linkedCategories: { $in: ids } },
          // Legacy: linkedCategories empty = treat as all_products
          { filterBehavior: 'linked_categories_only', linkedCategories: { $size: 0 } },
        ],
      })
        .populate('linkedCategories', 'name slug')
        .sort({ displayOrder: 1, createdAt: -1 });
    } else {
      types = await ServiceType.find(filter)
        .populate('linkedCategories', 'name slug')
        .sort({ displayOrder: 1, createdAt: -1 });
    }

    res.json({ success: true, data: types });
  } catch (err) {
    console.error('serviceTypes GET:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ═══════════════════════════════════════════════════════════
//  ADMIN — must be defined BEFORE /:id to avoid param capture
// ═══════════════════════════════════════════════════════════

// GET /api/service-types/admin/all — all (including inactive)
router.get('/admin/all', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const types = await ServiceType.find({})
      .populate('linkedCategories', 'name slug')
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: types });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/service-types — create
router.post('/', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { title, description, icon, imageUrl, serviceModes, areasServiced, linkedCategories, isActive, displayOrder } = req.body;
    const type = await ServiceType.create({
      title, description, icon, imageUrl, serviceModes, areasServiced, linkedCategories, isActive, displayOrder,
    });
    const populated = await ServiceType.findById(type._id).populate('linkedCategories', 'name slug');
    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    console.error('serviceTypes POST:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// PUT /api/service-types/:id — update
router.put('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const type = await ServiceType.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('linkedCategories', 'name slug');
    if (!type) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
});

// DELETE /api/service-types/:id — delete
router.delete('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    await ServiceType.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/service-types/:id — single service type (public) — defined LAST to avoid capturing /admin/all
router.get('/:id', async (req, res) => {
  try {
    const type = await ServiceType.findById(req.params.id).populate('linkedCategories', 'name slug');
    if (!type) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: type });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
