const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const ImportBatch = require('../models/ImportBatch');
const Product = require('../models/Product');

const ADMIN = ['admin', 'shop_manager', 'superadmin', 'super_admin'];

// ── GET /api/import-batches — list all batches ──────────────────────────────
router.get('/', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const { type, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;

    const total = await ImportBatch.countDocuments(filter);
    const batches = await ImportBatch.find(filter)
      .populate('importedBy', 'firstName lastName email')
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: batches, total });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── GET /api/import-batches/:id — single batch detail ──────────────────────
router.get('/:id', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const batch = await ImportBatch.findById(req.params.id).populate('importedBy', 'firstName lastName email');
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

    // Get a sample of the products in this batch (first 20 for preview)
    const sampleProducts = await Product.find({ _id: { $in: batch.createdProductIds.slice(0, 20) } })
      .select('name sku status price images categories')
      .populate('categories', 'name');

    res.json({ success: true, data: batch, sampleProducts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── DELETE /api/import-batches/:id/rollback — delete all products in batch ──
router.delete('/:id/rollback', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const batch = await ImportBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.createdProductIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No products to roll back (batch may have been updates only)' });
    }

    const ids = batch.createdProductIds;
    let deleted = 0;
    // Delete in chunks of 500 to avoid timeouts on large batches
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const result = await Product.deleteMany({ _id: { $in: chunk } });
      deleted += result.deletedCount;
    }

    batch.createdProductIds = [];
    batch.status = 'rolled_back';
    await batch.save();

    res.json({ success: true, message: `Rolled back: ${deleted} products deleted`, deleted });
  } catch (err) {
    console.error('Rollback error:', err);
    res.status(500).json({ success: false, message: 'Rollback failed: ' + err.message });
  }
});

// ── PUT /api/import-batches/:id/draft — set all batch products to draft ─────
router.put('/:id/draft', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const batch = await ImportBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.createdProductIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No created products in this batch' });
    }

    let updated = 0;
    for (let i = 0; i < batch.createdProductIds.length; i += 500) {
      const chunk = batch.createdProductIds.slice(i, i + 500);
      const result = await Product.updateMany(
        { _id: { $in: chunk } },
        { $set: { status: 'draft' } }
      );
      updated += result.modifiedCount;
    }

    res.json({ success: true, message: `${updated} products set to draft`, updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to set draft: ' + err.message });
  }
});

// ── PUT /api/import-batches/:id/publish — restore all batch products to publish
router.put('/:id/publish', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const batch = await ImportBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
    if (batch.createdProductIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No created products in this batch' });
    }

    let updated = 0;
    for (let i = 0; i < batch.createdProductIds.length; i += 500) {
      const chunk = batch.createdProductIds.slice(i, i + 500);
      const result = await Product.updateMany(
        { _id: { $in: chunk } },
        { $set: { status: 'publish' } }
      );
      updated += result.modifiedCount;
    }

    res.json({ success: true, message: `${updated} products published`, updated });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to publish: ' + err.message });
  }
});

// ── DELETE /api/import-batches/:id — delete batch record only (not products) ─
router.delete('/:id', protect, authorize(...ADMIN), async (req, res) => {
  try {
    await ImportBatch.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Batch record deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
