const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const woocommerceImporter = require('../services/woocommerceImporter');
const Product = require('../models/Product');

// Use disk storage with 1GB limit for large CSV files (100k+ products)
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 1024 * 1024 * 1024 }
});

// ─── Validate ────────────────────────────────────────────────────

router.post('/validate', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  req.setTimeout(10800000); // 3 hours for large file validation (100K+)
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    const { type } = req.body;
    if (!type) return res.status(400).json({ success: false, message: 'Import type is required' });

    const validation = await woocommerceImporter.validateImport(req.file.path, type);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({ success: true, data: validation });
  } catch (error) {
    console.error('Error validating import:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Error validating import', error: error.message });
  }
});

// ─── Import Products (job-based for 100K+) ──────────────────────
// Uploads file, starts background job, returns jobId immediately.
// Frontend polls GET /job/:jobId for progress.

router.post('/products', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  req.setTimeout(10800000); // 3 hours — covers large file upload via multer
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });

    const {
      processImages = 'true',
      imageProcessingType = 'all',
      duplicateResolution = '{}',
      stripHtml = 'true',
      updateExisting = 'false',
      replaceAll = 'false',
      useJob = 'true' // default to job-based for all imports
    } = req.body;

    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    // Handle "Replace All" mode — delete all existing products first
    if (replaceAll === 'true') {
      const deletedCount = await Product.countDocuments({});
      await Product.deleteMany({});
      console.log(`[Import] Replace All: deleted ${deletedCount} existing products`);
    }

    const options = {
      processImages: processImages === 'true',
      imageProcessingType: processImages === 'true' ? imageProcessingType : undefined,
      duplicateResolution: resolutionMap,
      updateExisting: updateExisting === 'true' || replaceAll === 'true',
      stripHtml: stripHtml === 'true'
    };

    if (useJob === 'true') {
      // Job-based: return immediately, frontend polls for status
      const jobId = woocommerceImporter.startImportJob(req.file.path, 'products', options);
      return res.json({
        success: true,
        message: 'Import job started. Poll /api/import/job/' + jobId + ' for progress.',
        data: { jobId }
      });
    }

    // Legacy sync mode (for very small files if needed)
    req.setTimeout(10800000); // 3 hours for legacy sync mode
    const results = await woocommerceImporter.importProducts(req.file.path, options);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Import completed: ${results.created.length} created, ${results.updated.length} updated, ${results.merged.length} merged, ${results.skipped.length} skipped`,
      data: results
    });
  } catch (error) {
    console.error('Error importing products:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Error importing products', error: error.message });
  }
});

// ─── Job status polling endpoint ─────────────────────────────────

router.get('/job/:jobId', protect, authorize('admin'), (req, res) => {
  const job = woocommerceImporter.getJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found or expired' });
  }
  res.json({
    success: true,
    data: {
      id: job.id,
      type: job.type,
      status: job.status,
      phase: job.phase,
      progress: job.progress,
      results: job.results,
      imageStats: job.imageStats,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      error: job.error,
      // Only include detailed results (first 50/200) when job is done
      resultDetails: job.status === 'completed' ? job.resultDetails : undefined
    }
  });
});

// ─── Deduplicate Products ────────────────────────────────────────
// Finds duplicate products by SKU and name, keeps the best one (most images/data), deletes the rest.

router.post('/deduplicate-products', protect, authorize('admin'), async (req, res) => {
  req.setTimeout(10800000); // 3 hours
  try {
    const { dryRun = 'true' } = req.body;
    const isDryRun = dryRun === 'true' || dryRun === true;

    // Find duplicates by SKU
    const skuDuplicates = await Product.aggregate([
      { $match: { sku: { $ne: null, $ne: '' } } },
      { $group: { _id: { $toUpper: '$sku' }, count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    // Find duplicates by name (for products without SKU or different SKUs but same name)
    const nameDuplicates = await Product.aggregate([
      { $match: { name: { $ne: null, $ne: '' } } },
      { $group: { _id: '$name', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]);

    // Merge duplicate groups, dedup the IDs
    const allDupGroups = new Map();
    for (const group of skuDuplicates) {
      const key = `sku:${group._id}`;
      allDupGroups.set(key, { type: 'sku', value: group._id, ids: group.ids });
    }
    for (const group of nameDuplicates) {
      const key = `name:${group._id}`;
      if (!allDupGroups.has(key)) {
        allDupGroups.set(key, { type: 'name', value: group._id, ids: group.ids });
      }
    }

    let totalDuplicateGroups = allDupGroups.size;
    let totalToDelete = 0;
    let totalKept = 0;
    const deleteIds = [];
    const details = [];

    for (const [key, group] of allDupGroups) {
      // Fetch full docs for this group
      const products = await Product.find({ _id: { $in: group.ids } }).lean();

      // Score each product — keep the one with the most data
      const scored = products.map(p => {
        let score = 0;
        if (p.images && p.images.length > 0) score += p.images.length * 10;
        if (p.featuredImage && !p.featuredImage.startsWith('http')) score += 20; // local = processed
        if (p.description && p.description.length > 10) score += 5;
        if (p.shortDescription) score += 2;
        if (p.categories && p.categories.length > 0) score += 3;
        if (p.regularPrice > 0 || p.backendPrice > 0) score += 5;
        if (p.isActive) score += 1;
        return { id: p._id, sku: p.sku, name: p.name, score, imageCount: (p.images || []).length };
      }).sort((a, b) => b.score - a.score);

      const kept = scored[0];
      const toRemove = scored.slice(1);
      totalKept++;
      totalToDelete += toRemove.length;

      for (const r of toRemove) deleteIds.push(r.id);

      if (details.length < 100) {
        details.push({
          group: key,
          kept: { id: kept.id, sku: kept.sku, name: kept.name, score: kept.score, images: kept.imageCount },
          removed: toRemove.map(r => ({ id: r.id, sku: r.sku, name: r.name, score: r.score, images: r.imageCount }))
        });
      }
    }

    if (!isDryRun && deleteIds.length > 0) {
      // Delete in batches of 500
      for (let i = 0; i < deleteIds.length; i += 500) {
        const batch = deleteIds.slice(i, i + 500);
        await Product.deleteMany({ _id: { $in: batch } });
      }
    }

    res.json({
      success: true,
      dryRun: isDryRun,
      message: isDryRun
        ? `Found ${totalToDelete} duplicate products across ${totalDuplicateGroups} groups. Run again with dryRun=false to delete them.`
        : `Deleted ${totalToDelete} duplicate products. Kept ${totalKept} best versions.`,
      data: {
        duplicateGroups: totalDuplicateGroups,
        toDelete: totalToDelete,
        kept: totalKept,
        deleted: isDryRun ? 0 : totalToDelete,
        details: details.slice(0, 50)
      }
    });
  } catch (error) {
    console.error('Error deduplicating products:', error);
    res.status(500).json({ success: false, message: 'Error deduplicating products', error: error.message });
  }
});

// ─── Import Categories ───────────────────────────────────────────

router.post('/categories', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    const { duplicateResolution = '{}', updateExisting = 'false', replaceAll = 'false' } = req.body;
    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    if (replaceAll === 'true') {
      const Category = require('../models/Category');
      const count = await Category.countDocuments({});
      await Category.deleteMany({});
      console.log(`[Import] Replace All: deleted ${count} existing categories`);
    }

    const results = await woocommerceImporter.importCategories(req.file.path, { duplicateResolution: resolutionMap, updateExisting: updateExisting === 'true' || replaceAll === 'true' });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Import completed: ${results.created.length} created, ${results.updated.length} updated, ${results.merged.length} merged`,
      data: results
    });
  } catch (error) {
    console.error('Error importing categories:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Error importing categories', error: error.message });
  }
});

// ─── Import Customers ────────────────────────────────────────────

router.post('/customers', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    const { duplicateResolution = '{}', updateExisting = 'false', replaceAll = 'false' } = req.body;
    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    if (replaceAll === 'true') {
      const User = require('../models/User');
      const count = await User.countDocuments({ role: 'customer' });
      await User.deleteMany({ role: 'customer' });
      console.log(`[Import] Replace All: deleted ${count} existing customers (admins preserved)`);
    }

    const results = await woocommerceImporter.importCustomers(req.file.path, { duplicateResolution: resolutionMap, updateExisting: updateExisting === 'true' || replaceAll === 'true' });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Import completed: ${results.created.length} created, ${results.updated.length} updated`,
      data: results
    });
  } catch (error) {
    console.error('Error importing customers:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Error importing customers', error: error.message });
  }
});

// ─── Import Orders ───────────────────────────────────────────────

router.post('/orders', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    const { duplicateResolution = '{}', updateExisting = 'false', replaceAll = 'false' } = req.body;
    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    if (replaceAll === 'true') {
      const Order = require('../models/Order');
      const count = await Order.countDocuments({});
      await Order.deleteMany({});
      console.log(`[Import] Replace All: deleted ${count} existing orders`);
    }

    const results = await woocommerceImporter.importOrders(req.file.path, { duplicateResolution: resolutionMap, updateExisting: updateExisting === 'true' || replaceAll === 'true' });
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Import completed: ${results.created.length} created, ${results.updated.length} updated`,
      data: results
    });
  } catch (error) {
    console.error('Error importing orders:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Error importing orders', error: error.message });
  }
});

// ─── Import Tags (adds tags to existing products) ────────────────

router.post('/tags', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    const results = { created: [], skipped: [], errors: [] };
    const rows = await woocommerceImporter.readCSVStream(req.file.path);

    const allTags = new Set();
    for (const { data: row } of rows) {
      const name = row.Name || row.name;
      if (name) allTags.add(name.trim());
    }

    // Tags are stored on products, so just report them
    results.created = Array.from(allTags).map(t => ({ name: t }));

    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.json({
      success: true,
      message: `Found ${allTags.size} unique tags`,
      data: results
    });
  } catch (error) {
    console.error('Error importing tags:', error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ success: false, message: 'Error importing tags', error: error.message });
  }
});

// ─── SSE Progress endpoint for large imports ─────────────────────

router.get('/progress', protect, authorize('admin'), (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const onProgress = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  woocommerceImporter.on('progress', onProgress);

  req.on('close', () => {
    woocommerceImporter.removeListener('progress', onProgress);
  });
});

// ─── Export ──────────────────────────────────────────────────────

router.get('/export/:type', protect, authorize('admin'), async (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format || 'woocommerce'; // 'woocommerce' or 'native'

    let result;
    switch (type) {
      case 'products':
        result = await woocommerceImporter.exportProducts(format);
        break;
      case 'categories':
        result = await woocommerceImporter.exportCategories();
        break;
      case 'customers':
        result = await woocommerceImporter.exportCustomers();
        break;
      case 'orders':
        result = await woocommerceImporter.exportOrders();
        break;
      default:
        return res.status(400).json({ success: false, message: `Unsupported export type: ${type}` });
    }

    const csvContent = woocommerceImporter.generateCSV(result.headers, result.rows);
    const filename = `${type}-export-${format}-${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting:', error);
    res.status(500).json({ success: false, message: 'Error exporting data', error: error.message });
  }
});

// ─── Bulk Strip HTML from existing products (batched for large DBs) ──

router.post('/strip-html', protect, authorize('admin'), async (req, res) => {
  req.setTimeout(1800000); // 30 minutes for very large product sets
  try {
    const Product = require('../models/Product');
    const BATCH_SIZE = 200;

    const htmlRegex = /<[^>]+>/;
    const query = {
      $or: [
        { name: { $regex: htmlRegex } },
        { description: { $regex: htmlRegex } },
        { shortDescription: { $regex: htmlRegex } }
      ]
    };

    const totalFound = await Product.countDocuments(query);
    if (totalFound === 0) {
      return res.json({
        success: true,
        message: 'No products with HTML tags found',
        data: { found: 0, updated: 0 }
      });
    }

    let updated = 0;
    let processed = 0;

    // Process in batches using skip/limit to avoid loading everything into memory
    while (processed < totalFound) {
      // Always skip 0 because we're modifying matching docs — they drop out of the query
      const batch = await Product.find(query)
        .select('name description shortDescription')
        .limit(BATCH_SIZE)
        .lean();

      if (batch.length === 0) break;

      const bulkOps = [];
      for (const product of batch) {
        const update = {};
        if (product.name && htmlRegex.test(product.name)) {
          update.name = woocommerceImporter.stripHtml(product.name);
        }
        if (product.description && htmlRegex.test(product.description)) {
          update.description = woocommerceImporter.stripHtml(product.description);
        }
        if (product.shortDescription && htmlRegex.test(product.shortDescription)) {
          update.shortDescription = woocommerceImporter.stripHtml(product.shortDescription);
        }
        if (Object.keys(update).length > 0) {
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: { $set: update }
            }
          });
        }
      }

      if (bulkOps.length > 0) {
        const result = await Product.bulkWrite(bulkOps, { ordered: false });
        updated += result.modifiedCount;
      }

      processed += batch.length;
      woocommerceImporter.emit('progress', {
        phase: 'strip-html',
        current: processed,
        total: totalFound,
        type: 'products'
      });
    }

    res.json({
      success: true,
      message: `Stripped HTML from ${updated} products (out of ${totalFound} found with HTML)`,
      data: { found: totalFound, updated }
    });
  } catch (error) {
    console.error('Error stripping HTML:', error);
    res.status(500).json({ success: false, message: 'Error stripping HTML', error: error.message });
  }
});

module.exports = router;
