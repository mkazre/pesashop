const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const visualSearchService = require('../services/visualSearchService');
const Bundle = require('../models/Bundle');
const Product = require('../models/Product');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });

// ─── Public ────────────────────────────────────────────────────

// POST /api/visual-search/by-text — semantic text search
router.post('/by-text', optionalAuth, async (req, res) => {
  try {
    const { query, limit } = req.body;
    if (!query) return res.status(400).json({ success: false, message: 'query required' });
    const results = await visualSearchService.searchByText(query, { limit: limit || 12 });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/visual-search/by-image — image upload search
router.post('/by-image', optionalAuth, upload.single('image'), async (req, res) => {
  try {
    let input;
    if (req.file) {
      input = req.file.buffer.toString('base64');
    } else if (req.body.imageUrl) {
      input = req.body.imageUrl;
    } else {
      return res.status(400).json({ success: false, message: 'image file or imageUrl required' });
    }
    const { description, results } = await visualSearchService.searchByImage(input, { limit: 12 });
    res.json({ success: true, data: { description, results } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/visual-search/similar/:productId — "find similar"
router.get('/similar/:productId', async (req, res) => {
  try {
    const results = await visualSearchService.findSimilar(req.params.productId, { limit: parseInt(req.query.limit) || 8 });
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Bundles (public) ──────────────────────────────────────────

// GET /api/bundles/for-product/:productId
router.get('/bundles/for-product/:productId', async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId).select('categories').lean();
    if (!product) return res.json({ success: true, data: null });

    // First try admin-curated bundle that triggers on this product or its category
    let bundle = await Bundle.findOne({
      isActive: true,
      $or: [
        { triggerProducts: req.params.productId },
        { triggerCategories: { $in: product.categories || [] } }
      ],
      displayPages: { $in: ['product_detail'] }
    }).populate('items.product', 'name slug price salePrice images stock');

    if (bundle) {
      Bundle.findByIdAndUpdate(bundle._id, { $inc: { 'stats.impressions': 1 } }).catch(() => {});
      return res.json({ success: true, data: { type: 'curated', bundle: serializeBundle(bundle) } });
    }

    // Otherwise use embedding-based "complete the look"
    const similar = await visualSearchService.findSimilar(req.params.productId, { limit: 3 });
    if (!similar.length) return res.json({ success: true, data: null });

    res.json({
      success: true,
      data: {
        type: 'ai',
        bundle: {
          name: 'Complete the look',
          items: similar,
          discountType: 'percent',
          discountValue: 8
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/bundles/:id/track — track add-to-cart
router.post('/bundles/:id/track', async (req, res) => {
  try {
    const field = req.body.event === 'purchase' ? 'stats.purchases' : 'stats.addToCarts';
    await Bundle.findByIdAndUpdate(req.params.id, { $inc: { [field]: 1 } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin ─────────────────────────────────────────────────────

// GET /api/visual-search/admin/embedding-status
router.get('/admin/embedding-status', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const [withEmbedding, total] = await Promise.all([
      Product.countDocuments({ embedding: { $exists: true } }),
      Product.countDocuments({ isActive: true })
    ]);
    res.json({ success: true, data: { withEmbedding, total, coverage: total ? Math.round((withEmbedding / total) * 100) : 0 } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/visual-search/admin/backfill — generate embeddings for a batch
router.post('/admin/backfill', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const result = await visualSearchService.backfillEmbeddings({
      limit: req.body.limit || 50,
      force: !!req.body.force
    });
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Bundles admin CRUD ────────────────────────────────────────

router.get('/admin/bundles', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const bundles = await Bundle.find()
      .populate('items.product', 'name slug images')
      .populate('triggerProducts', 'name')
      .populate('triggerCategories', 'name')
      .sort({ displayOrder: 1, createdAt: -1 });
    res.json({ success: true, data: bundles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/bundles', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const bundle = await Bundle.create(req.body);
    res.status(201).json({ success: true, data: bundle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/admin/bundles/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const bundle = await Bundle.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bundle) return res.status(404).json({ success: false, message: 'Bundle not found' });
    res.json({ success: true, data: bundle });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/admin/bundles/:id', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    await Bundle.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

function serializeBundle(bundle) {
  const subtotal = bundle.items.reduce((sum, it) => sum + ((it.product?.salePrice || it.product?.price || 0) * (it.quantity || 1)), 0);
  let discountedTotal = subtotal;
  if (bundle.discountType === 'percent') discountedTotal = subtotal * (1 - (bundle.discountValue || 0) / 100);
  else if (bundle.discountType === 'fixed') discountedTotal = Math.max(0, subtotal - (bundle.discountValue || 0));
  else if (bundle.discountType === 'price') discountedTotal = bundle.discountValue || subtotal;

  return {
    _id: bundle._id,
    name: bundle.name,
    description: bundle.description,
    items: bundle.items,
    discountType: bundle.discountType,
    discountValue: bundle.discountValue,
    subtotal,
    discountedTotal,
    youSave: Math.max(0, subtotal - discountedTotal)
  };
}

module.exports = router;
