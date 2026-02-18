const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');
const woocommerceImporter = require('../services/woocommerceImporter');

// Use disk storage with 500MB limit for large CSV files (30k+ products)
const upload = multer({
  dest: 'uploads/temp/',
  limits: { fileSize: 500 * 1024 * 1024 }
});

// ─── Validate ────────────────────────────────────────────────────

router.post('/validate', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  req.setTimeout(300000); // 5 minutes for large file validation
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

// ─── Import Products ─────────────────────────────────────────────

router.post('/products', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  req.setTimeout(1800000); // 30 minutes for large imports (30k+ products)
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });

    const {
      processImages = 'true',
      imageProcessingType = 'all',
      duplicateResolution = '{}',
      stripHtml = 'true'
    } = req.body;

    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    const options = {
      processImages: processImages === 'true',
      imageProcessingType: processImages === 'true' ? imageProcessingType : undefined,
      duplicateResolution: resolutionMap,
      stripHtml: stripHtml === 'true'
    };

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

// ─── Import Categories ───────────────────────────────────────────

router.post('/categories', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'Please upload a CSV file' });
    const { duplicateResolution = '{}' } = req.body;
    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    const results = await woocommerceImporter.importCategories(req.file.path, { duplicateResolution: resolutionMap });
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
    const { duplicateResolution = '{}' } = req.body;
    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    const results = await woocommerceImporter.importCustomers(req.file.path, { duplicateResolution: resolutionMap });
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
    const { duplicateResolution = '{}' } = req.body;
    let resolutionMap = {};
    try { resolutionMap = JSON.parse(duplicateResolution); } catch (e) {}

    const results = await woocommerceImporter.importOrders(req.file.path, { duplicateResolution: resolutionMap });
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
