const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const ImportBatch = require('../models/ImportBatch');
const Product = require('../models/Product');
const { cloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

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
    let cloudinaryDeleted = 0;
    let cloudinaryFailed = 0;
    const deleteCloudinaryImages = req.query.deleteImages !== 'false'; // default: true

    // Process in chunks of 500
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);

      // Step 1: Collect all Cloudinary image URLs from products in this chunk BEFORE deleting
      if (deleteCloudinaryImages) {
        const products = await Product.find({ _id: { $in: chunk } })
          .select('images featuredImage')
          .lean();

        // Extract all unique Cloudinary public IDs across all images of all products
        const publicIds = new Set();
        for (const product of products) {
          const allUrls = [
            ...(product.images || []),
            product.featuredImage ? [product.featuredImage] : [],
          ].flat().filter(Boolean);

          for (const url of allUrls) {
            const pid = getPublicIdFromUrl(url);
            if (pid) publicIds.add(pid);
          }
        }

        // Delete from Cloudinary in sub-batches of 100 (Cloudinary API limit)
        const pidArray = [...publicIds];
        for (let j = 0; j < pidArray.length; j += 100) {
          const pidChunk = pidArray.slice(j, j + 100);
          try {
            const result = await cloudinary.api.delete_resources(pidChunk, { resource_type: 'image' });
            cloudinaryDeleted += Object.keys(result.deleted || {}).length;
            // Count anything not 'deleted' as failed (e.g. 'not_found' means already gone — still fine)
            cloudinaryFailed += Object.values(result.deleted || {}).filter(v => v !== 'deleted').length;
          } catch (cloudErr) {
            console.error('[Rollback] Cloudinary delete error:', cloudErr.message);
            cloudinaryFailed += pidChunk.length;
          }
        }
      }

      // Step 2: Delete the products from MongoDB
      const result = await Product.deleteMany({ _id: { $in: chunk } });
      deleted += result.deletedCount;
    }

    batch.createdProductIds = [];
    batch.status = 'rolled_back';
    await batch.save();

    const msg = deleteCloudinaryImages
      ? `Rolled back: ${deleted} products deleted. Cloudinary: ${cloudinaryDeleted} images removed${cloudinaryFailed > 0 ? `, ${cloudinaryFailed} already gone or failed` : ''}.`
      : `Rolled back: ${deleted} products deleted (Cloudinary images kept).`;

    res.json({ success: true, message: msg, deleted, cloudinaryDeleted, cloudinaryFailed });
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

// ── Shared helper: get the true insertion timestamp from a product ──────────
// ObjectId embeds a Unix timestamp (seconds precision) that is ALWAYS set at
// insertion time and cannot be null — unlike the createdAt field which can be
// missing or identical across a bulk insertMany batch.
function getProductTimestamp(p) {
  // Primary: ObjectId timestamp (guaranteed, second-precision)
  try {
    return p._id.getTimestamp();
  } catch (_) {
    // Fallback: createdAt field
    const d = new Date(p.createdAt);
    return isNaN(d.getTime()) ? new Date(0) : d;
  }
}

// ── GET /api/import-batches/reconstruct/preview — dry run, no DB writes ──────
router.get('/reconstruct/preview', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const gapMinutes = parseInt(req.query.gapMinutes) || 60;
    const groupByDate = req.query.groupByDate === 'true';
    const gapMs = gapMinutes * 60 * 1000;

    const existingBatches = await ImportBatch.find({ type: 'products' }).select('createdProductIds');
    const alreadyTracked = new Set(
      existingBatches.flatMap(b => b.createdProductIds.map(id => id.toString()))
    );

    // Sort by _id (ObjectId order = insertion order) — NOT createdAt
    const allProducts = await Product.find({})
      .select('_id')
      .sort({ _id: 1 })
      .lean();

    const untracked = allProducts.filter(p => !alreadyTracked.has(p._id.toString()));

    if (untracked.length === 0) {
      return res.json({ success: true, sessions: [], totalUntracked: 0, message: 'All products are already tracked.' });
    }

    let sessions;
    if (groupByDate) {
      // Group by calendar date (UTC) of ObjectId timestamp
      const byDate = new Map();
      for (const p of untracked) {
        const ts = getProductTimestamp(p);
        const key = ts.toISOString().slice(0, 10); // "YYYY-MM-DD"
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(p);
      }
      sessions = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, prods]) => prods);
    } else {
      // Group by time gap between consecutive products (by ObjectId timestamp)
      sessions = [];
      let current = [untracked[0]];
      for (let i = 1; i < untracked.length; i++) {
        const gap = getProductTimestamp(untracked[i]) - getProductTimestamp(untracked[i - 1]);
        if (gap > gapMs) { sessions.push(current); current = [untracked[i]]; }
        else current.push(untracked[i]);
      }
      sessions.push(current);
    }

    const preview = sessions.map((s, idx) => {
      const startTs = getProductTimestamp(s[0]);
      const endTs   = getProductTimestamp(s[s.length - 1]);
      return {
        index: idx + 1,
        productCount: s.length,
        startedAt: startTs,
        completedAt: endTs,
        durationMinutes: Math.round((endTs - startTs) / 60000),
      };
    });

    res.json({ success: true, sessions: preview, totalUntracked: untracked.length, gapMinutes, groupByDate });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Preview failed: ' + err.message });
  }
});

// ── POST /api/import-batches/reconstruct — scan all products, group by time ──
router.post('/reconstruct', protect, authorize(...ADMIN), async (req, res) => {
  try {
    const gapMinutes = parseInt(req.body.gapMinutes) || 60;
    const groupByDate = req.body.groupByDate === true || req.body.groupByDate === 'true';
    const gapMs = gapMinutes * 60 * 1000;

    const existingBatches = await ImportBatch.find({ type: 'products' }).select('createdProductIds');
    const alreadyTracked = new Set(
      existingBatches.flatMap(b => b.createdProductIds.map(id => id.toString()))
    );

    // Sort by _id (ObjectId = insertion order) — more reliable than createdAt for bulk imports
    const allProducts = await Product.find({})
      .select('_id categories')
      .sort({ _id: 1 })
      .lean();

    const untracked = allProducts.filter(p => !alreadyTracked.has(p._id.toString()));

    if (untracked.length === 0) {
      return res.json({ success: true, batchesCreated: 0, message: 'All products are already tracked in existing batches.' });
    }

    let sessions;
    if (groupByDate) {
      const byDate = new Map();
      for (const p of untracked) {
        const ts = getProductTimestamp(p);
        const key = ts.toISOString().slice(0, 10);
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key).push(p);
      }
      sessions = [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, prods]) => prods);
    } else {
      sessions = [];
      let currentSession = [untracked[0]];
      for (let i = 1; i < untracked.length; i++) {
        const gap = getProductTimestamp(untracked[i]) - getProductTimestamp(untracked[i - 1]);
        if (gap > gapMs) { sessions.push(currentSession); currentSession = [untracked[i]]; }
        else currentSession.push(untracked[i]);
      }
      sessions.push(currentSession);
    }

    // Create ImportBatch records for each session
    let batchesCreated = 0;
    const createdBatches = [];

    for (const session of sessions) {
      // Use ObjectId-embedded timestamps for accurate start/end dates
      const startedAt   = getProductTimestamp(session[0]);
      const completedAt = getProductTimestamp(session[session.length - 1]);
      const productIds  = session.map(p => p._id);

      // Label: include date so the user can identify batches easily
      const dateLabel = startedAt.toISOString().slice(0, 10);
      const label = `Reconstructed — ${dateLabel} (${session.length.toLocaleString()} products)`;

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
        originalFilename: label,
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
