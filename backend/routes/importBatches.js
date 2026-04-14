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

// ── GET /api/import-batches/reconstruct/preview — dry run, no DB writes ──────
// Same logic as /reconstruct but only returns session summary without saving.
router.get('/reconstruct/preview', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const gapMinutes = parseInt(req.query.gapMinutes) || 30;
    const gapMs = gapMinutes * 60 * 1000;

    const existingBatches = await ImportBatch.find({ type: 'products' }).select('createdProductIds');
    const alreadyTracked = new Set(
      existingBatches.flatMap(b => b.createdProductIds.map(id => id.toString()))
    );

    const allProducts = await Product.find({})
      .select('_id createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const untracked = allProducts.filter(p => !alreadyTracked.has(p._id.toString()));

    if (untracked.length === 0) {
      return res.json({ success: true, sessions: [], totalUntracked: 0, message: 'All products are already tracked.' });
    }

    const sessions = [];
    let current = [untracked[0]];
    for (let i = 1; i < untracked.length; i++) {
      const gap = new Date(untracked[i].createdAt) - new Date(untracked[i - 1].createdAt);
      if (gap > gapMs) { sessions.push(current); current = [untracked[i]]; }
      else current.push(untracked[i]);
    }
    sessions.push(current);

    const preview = sessions.map((s, idx) => ({
      index: idx + 1,
      productCount: s.length,
      startedAt: s[0].createdAt,
      completedAt: s[s.length - 1].createdAt,
      durationMinutes: Math.round((new Date(s[s.length - 1].createdAt) - new Date(s[0].createdAt)) / 60000),
    }));

    res.json({ success: true, sessions: preview, totalUntracked: untracked.length, gapMinutes });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Preview failed: ' + err.message });
  }
});

// ── POST /api/import-batches/reconstruct — scan all products, group by time ──
// Groups products into import sessions based on createdAt clustering.
// Products already tracked in an existing batch are skipped.
// Gap threshold: if two consecutive products (sorted by createdAt) were created
// more than `gapMinutes` apart, they belong to different import sessions.
router.post('/reconstruct', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const gapMinutes = parseInt(req.body.gapMinutes) || 30;
    const gapMs = gapMinutes * 60 * 1000;

    // Get all product IDs already tracked in a batch so we don't double-count
    const existingBatches = await ImportBatch.find({ type: 'products' }).select('createdProductIds');
    const alreadyTracked = new Set(
      existingBatches.flatMap(b => b.createdProductIds.map(id => id.toString()))
    );

    // Fetch all products sorted by createdAt (only _id, createdAt, categories)
    // Use lean() + streaming for memory efficiency on large DBs
    const allProducts = await Product.find({})
      .select('_id createdAt categories')
      .sort({ createdAt: 1 })
      .lean();

    // Filter out already-tracked products
    const untracked = allProducts.filter(p => !alreadyTracked.has(p._id.toString()));

    if (untracked.length === 0) {
      return res.json({ success: true, batchesCreated: 0, message: 'All products are already tracked in existing batches.' });
    }

    // Cluster into sessions based on time gap
    const sessions = [];
    let currentSession = [untracked[0]];

    for (let i = 1; i < untracked.length; i++) {
      const prev = untracked[i - 1];
      const curr = untracked[i];
      const gap = new Date(curr.createdAt) - new Date(prev.createdAt);
      if (gap > gapMs) {
        sessions.push(currentSession);
        currentSession = [curr];
      } else {
        currentSession.push(curr);
      }
    }
    sessions.push(currentSession);

    // Create ImportBatch records for each session
    let batchesCreated = 0;
    const createdBatches = [];

    for (const session of sessions) {
      const startedAt = session[0].createdAt;
      const completedAt = session[session.length - 1].createdAt;
      const productIds = session.map(p => p._id);

      // Derive category names from a sample of the products
      const sample = await Product.find({ _id: { $in: productIds.slice(0, 50) } })
        .select('categories')
        .populate('categories', 'name')
        .lean();
      const catSet = new Set();
      sample.forEach(p => (p.categories || []).forEach(c => {
        if (c && c.name) catSet.add(c.name);
      }));

      const jobId = `reconstructed-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const batch = await ImportBatch.create({
        jobId,
        type: 'products',
        originalFilename: `Reconstructed session (${session.length} products)`,
        importMode: 'add',
        status: 'completed',
        results: { created: session.length, updated: 0, merged: 0, skipped: 0, errors: 0 },
        createdProductIds: productIds,
        categories: [...catSet],
        startedAt,
        completedAt,
        importedBy: req.user?._id || null,
      });

      createdBatches.push(batch);
      batchesCreated++;
    }

    res.json({
      success: true,
      batchesCreated,
      totalProducts: untracked.length,
      message: `Found ${batchesCreated} import session${batchesCreated !== 1 ? 's' : ''} covering ${untracked.length.toLocaleString()} products.`,
    });
  } catch (err) {
    console.error('Reconstruct error:', err);
    res.status(500).json({ success: false, message: 'Reconstruction failed: ' + err.message });
  }
});

module.exports = router;
