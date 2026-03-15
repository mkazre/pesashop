const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Badge = require('../models/Badge');
const Product = require('../models/Product');
const Category = require('../models/Category');

// ─── Get all badges (admin, paginated) ──────────────────────────────────────
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive, sort = '-priority' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const total = await Badge.countDocuments(query);
    const badges = await Badge.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('assignedProducts', 'name slug featuredImage')
      .populate('assignedCategories', 'name slug')
      .populate('createdBy', 'firstName lastName email');

    res.json({
      success: true,
      data: badges,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (error) {
    console.error('Badge list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Get all active badges (for dropdowns / pickers / frontend rendering) ───
// MUST be before /:id to prevent Express matching 'active' as an id
// Public route — no auth required so frontend storefront can fetch badges
router.get('/active/list', async (req, res) => {
  try {
    const badges = await Badge.find({ isActive: true })
      .select('name slug style priority conditions displayOn')
      .sort({ priority: -1 });
    res.json({ success: true, data: badges });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Evaluate badges for a product ─────────────────────────────────────────
router.get('/evaluate/product/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const now = new Date();
    const activeBadges = await Badge.find({
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    }).sort({ priority: -1 });

    const matching = [];
    for (const badge of activeBadges) {
      if (doesBadgeMatchProduct(badge, product)) {
        matching.push(badge);
      }
    }

    res.json({ success: true, data: matching });
  } catch (error) {
    console.error('Badge evaluate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Evaluate badges for multiple products (bulk) ───────────────────────────
router.post('/evaluate/products', async (req, res) => {
  try {
    const { productIds } = req.body;
    if (!productIds?.length) return res.json({ success: true, data: {} });

    const products = await Product.find({ _id: { $in: productIds } });
    const now = new Date();
    const activeBadges = await Badge.find({
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    }).sort({ priority: -1 });

    const result = {};
    for (const product of products) {
      result[product._id.toString()] = [];
      for (const badge of activeBadges) {
        if (doesBadgeMatchProduct(badge, product)) {
          result[product._id.toString()].push(badge);
        }
      }
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Bulk badge evaluate error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Evaluate badges for a category ─────────────────────────────────────────
router.get('/evaluate/category/:categoryId', async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    const now = new Date();
    const activeBadges = await Badge.find({
      isActive: true,
      $or: [
        { startDate: null, endDate: null },
        { startDate: { $lte: now }, endDate: null },
        { startDate: null, endDate: { $gte: now } },
        { startDate: { $lte: now }, endDate: { $gte: now } },
      ],
    }).sort({ priority: -1 });

    const matching = activeBadges.filter((badge) => {
      if (badge.assignedCategories?.some((c) => c.toString() === req.params.categoryId)) return true;
      return badge.conditions?.some((cond) => {
        if (cond.type === 'specific_categories' || cond.type === 'category_sale' || cond.type === 'category_featured') {
          return cond.categoryIds?.some((c) => c.toString() === req.params.categoryId);
        }
        return false;
      });
    });

    res.json({ success: true, data: matching });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Get single badge ───────────────────────────────────────────────────────
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id)
      .populate('assignedProducts', 'name slug featuredImage regularPrice salePrice')
      .populate('assignedCategories', 'name slug')
      .populate('conditions.productIds', 'name slug')
      .populate('conditions.categoryIds', 'name slug')
      .populate('createdBy', 'firstName lastName');
    if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });
    res.json({ success: true, data: badge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Create badge ───────────────────────────────────────────────────────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const badgeData = { ...req.body, createdBy: req.user._id };
    const badge = await Badge.create(badgeData);
    res.status(201).json({ success: true, data: badge });
  } catch (error) {
    console.error('Badge create error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── Update badge ───────────────────────────────────────────────────────────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });
    res.json({ success: true, data: badge });
  } catch (error) {
    console.error('Badge update error:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// ─── Delete badge ───────────────────────────────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });
    res.json({ success: true, message: 'Badge deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Bulk delete ────────────────────────────────────────────────────────────
router.post('/bulk-delete', protect, authorize('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ success: false, message: 'No IDs provided' });
    await Badge.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Deleted ${ids.length} badges` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Duplicate badge ────────────────────────────────────────────────────────
router.post('/:id/duplicate', protect, authorize('admin'), async (req, res) => {
  try {
    const original = await Badge.findById(req.params.id).lean();
    if (!original) return res.status(404).json({ success: false, message: 'Badge not found' });

    delete original._id;
    delete original.__v;
    delete original.slug;
    original.name = `${original.name} (Copy)`;
    original.createdBy = req.user._id;
    original.impressions = 0;
    original.clicks = 0;

    const badge = await Badge.create(original);
    res.status(201).json({ success: true, data: badge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Toggle active state ────────────────────────────────────────────────────
router.patch('/:id/toggle', protect, authorize('admin'), async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    if (!badge) return res.status(404).json({ success: false, message: 'Badge not found' });
    badge.isActive = !badge.isActive;
    await badge.save();
    res.json({ success: true, data: badge });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ═════════════════════════════════════════════════════════════════════════════
// ── Badge evaluation engine ─────────────────────────────────────────────────
// ═════════════════════════════════════════════════════════════════════════════

function doesBadgeMatchProduct(badge, product) {
  // 1. Direct product assignment
  if (badge.assignedProducts?.some((p) => p.toString() === product._id.toString())) {
    return true;
  }

  // 2. Direct category assignment — product is in an assigned category
  if (badge.assignedCategories?.length > 0 && product.categories?.length > 0) {
    const assignedCatIds = badge.assignedCategories.map((c) => c.toString());
    const productCatIds = product.categories.map((c) => c.toString());
    if (assignedCatIds.some((id) => productCatIds.includes(id))) return true;
  }

  // 3. No conditions = static badge (only matches via direct assignments above)
  if (!badge.conditions || badge.conditions.length === 0) return false;

  // 4. Evaluate conditions with AND/OR logic
  const logic = badge.conditionLogic || 'all';
  const results = badge.conditions.map((cond) => evaluateCondition(cond, product));

  if (logic === 'all') return results.every(Boolean);
  return results.some(Boolean); // 'any'
}

function evaluateCondition(cond, product) {
  const now = new Date();

  switch (cond.type) {
    case 'static':
      return true;

    case 'on_sale':
      return product.salePrice != null && product.salePrice > 0 && product.salePrice < product.regularPrice;

    case 'top_selling': {
      // Uses product.salesCount or reviewCount as a proxy
      const salesMetric = product.salesCount || product.reviewCount || 0;
      return salesMetric >= (cond.threshold || 10);
    }

    case 'new_arrival': {
      const days = cond.days || 30;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return product.createdAt >= cutoff;
    }

    case 'low_stock':
      return product.stock > 0 && product.stock <= (cond.threshold || product.lowStockThreshold || 5);

    case 'out_of_stock':
      return product.stock === 0;

    case 'back_in_stock': {
      // Product was updated recently AND has stock > 0
      const days = cond.days || 7;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      return product.stock > 0 && product.updatedAt >= cutoff;
    }

    case 'price_range': {
      const price = product.salePrice || product.regularPrice;
      const min = cond.minValue || 0;
      const max = cond.maxValue || Infinity;
      return price >= min && price <= max;
    }

    case 'high_rated':
      return (product.rating || 0) >= (cond.threshold || 4);

    case 'most_reviewed':
      return (product.reviewCount || 0) >= (cond.threshold || 10);

    case 'featured':
      return product.isFeatured === true;

    case 'free_shipping':
      return product.freeShipping === true || (product.weight && product.weight === 0);

    case 'clearance':
      return product.clearance === true || (product.tags && product.tags.includes('clearance'));

    case 'limited_edition':
      return product.stock > 0 && product.stock <= (cond.threshold || 10) && (product.tags?.includes('limited') || product.isLimited === true);

    case 'percentage_off': {
      if (!product.salePrice || !product.regularPrice) return false;
      const pct = ((product.regularPrice - product.salePrice) / product.regularPrice) * 100;
      return pct >= (cond.threshold || 10);
    }

    case 'bundle_deal':
      return product.productType === 'bundle' || product.tags?.includes('bundle');

    case 'member_only':
      return product.memberOnly === true || product.tags?.includes('members-only');

    case 'pre_order':
      return product.preOrder === true || product.tags?.includes('pre-order');

    case 'seasonal': {
      if (!cond.startDate || !cond.endDate) return false;
      return now >= new Date(cond.startDate) && now <= new Date(cond.endDate);
    }

    case 'specific_products':
      return cond.productIds?.some((pid) => pid.toString() === product._id.toString());

    case 'specific_categories': {
      if (!cond.categoryIds?.length || !product.categories?.length) return false;
      const condCatIds = cond.categoryIds.map((c) => c.toString());
      const prodCatIds = product.categories.map((c) => c.toString());
      return condCatIds.some((id) => prodCatIds.includes(id));
    }

    case 'specific_tags':
      return cond.tags?.some((tag) => product.tags?.includes(tag));

    case 'specific_brands':
      return cond.brands?.some((brand) => product.brand === brand);

    case 'scheduled': {
      if (!cond.startDate || !cond.endDate) return true;
      return now >= new Date(cond.startDate) && now <= new Date(cond.endDate);
    }

    case 'custom_field': {
      const fieldVal = product.customAttributes?.get?.(cond.customFieldKey) ?? product[cond.customFieldKey];
      if (fieldVal === undefined) return false;
      const target = cond.customFieldValue;
      switch (cond.customFieldOperator || 'equals') {
        case 'equals': return String(fieldVal) === String(target);
        case 'not_equals': return String(fieldVal) !== String(target);
        case 'contains': return String(fieldVal).includes(String(target));
        case 'greater_than': return Number(fieldVal) > Number(target);
        case 'less_than': return Number(fieldVal) < Number(target);
        default: return false;
      }
    }

    default:
      return false;
  }
}

module.exports = router;
