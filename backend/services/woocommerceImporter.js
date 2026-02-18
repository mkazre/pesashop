const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { EventEmitter } = require('events');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const slugify = require('slugify');
const imageProcessor = require('./imageProcessor');
const fsPromises = fs.promises;

const { buildLookupMaps, checkDuplicateFast } = require('./validationHelper');

const BATCH_SIZE = 100;
const IMAGE_CONCURRENCY = 3;

class WooCommerceImporter extends EventEmitter {
  constructor() {
    super();
    this.supportedTypes = ['products', 'categories', 'customers', 'orders', 'tags'];
    this.tempImageDir = path.join(__dirname, '../uploads/temp/images');
    this.processedImageDir = path.join(__dirname, '../uploads/products');
    this._categoryCache = new Map();

    [this.tempImageDir, this.processedImageDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  // ─── HTML stripping ─────────────────────────────────────────────

  stripHtml(text) {
    if (!text || typeof text !== 'string') return text || '';
    return text
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&quot;/gi, '"')
      .replace(/&#039;/gi, "'")
      .replace(/&rsquo;/gi, "'")
      .replace(/&lsquo;/gi, "'")
      .replace(/&rdquo;/gi, '"')
      .replace(/&ldquo;/gi, '"')
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/  +/g, ' ')
      .trim();
  }

  // ─── Image helpers ───────────────────────────────────────────────

  parseWooCommerceImages(imagesString) {
    if (!imagesString || !imagesString.trim()) return [];
    const images = [];
    // WooCommerce CSV separates multiple images with pipe (|)
    const parts = imagesString.split('|').map(p => p.trim());
    for (const part of parts) {
      if (!part) continue;
      const imageData = { url: '', alt: '', title: '', description: '', caption: '' };
      const segments = part.split('!').map(s => s.trim());
      if (segments.length > 0) {
        imageData.url = segments[0].trim();
        for (let i = 1; i < segments.length; i++) {
          const segment = segments[i];
          if (segment.includes(':')) {
            const [key, ...valueParts] = segment.split(':');
            const value = valueParts.join(':').trim();
            const keyLower = key.trim().toLowerCase();
            if (keyLower === 'alt') imageData.alt = value;
            else if (keyLower === 'title') imageData.title = value;
            else if (keyLower === 'desc') imageData.description = value;
            else if (keyLower === 'caption') imageData.caption = value;
          }
        }
      }
      if (imageData.url && imageData.url.startsWith('http')) images.push(imageData);
    }
    return images;
  }

  async downloadImage(imageUrl, filename) {
    const protocol = imageUrl.startsWith('https') ? https : http;
    const tempPath = path.join(this.tempImageDir, filename);
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempPath);
      const req = protocol.get(imageUrl, { timeout: 30000 }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          fs.unlinkSync(tempPath);
          return this.downloadImage(response.headers.location, filename).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          return reject(new Error(`HTTP ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(tempPath); });
      });
      req.on('error', (err) => {
        file.close();
        if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        reject(err);
      });
      req.on('timeout', () => { req.destroy(); reject(new Error('Download timeout')); });
    });
  }

  async processImage(imagePath, productSlug, index = 0) {
    try {
      const config = await imageProcessor.getConfig();
      const options = {
        trimWhitespace: config.trimWhitespace,
        backgroundColor: config.backgroundColor,
        targetWidth: config.targetWidth,
        targetHeight: config.targetHeight,
        targetRatio: config.targetRatio,
        outputFormat: config.outputFormat || 'webp',
        imageQuality: config.imageQuality || 90
      };
      const ext = options.outputFormat === 'webp' ? 'webp' : (options.outputFormat === 'png' ? 'png' : 'jpg');
      const filename = `${productSlug}-${index}-${Date.now()}.${ext}`;
      const outputPath = path.join(this.processedImageDir, filename);
      await imageProcessor.processProductImage(imagePath, outputPath, options);
      try { if (fs.existsSync(imagePath)) await fsPromises.unlink(imagePath); } catch (_) {}
      return `/uploads/products/${filename}`;
    } catch (error) {
      try {
        const ext2 = path.extname(imagePath) || '.jpg';
        const filename = `${productSlug}-${index}-${Date.now()}${ext2}`;
        const outputPath = path.join(this.processedImageDir, filename);
        fs.copyFileSync(imagePath, outputPath);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        return `/uploads/products/${filename}`;
      } catch (_) {
        throw new Error(`Failed to process image: ${error.message}`);
      }
    }
  }

  async processProductImages(imageDataArray, productSlug) {
    const processedImages = [];
    for (let i = 0; i < imageDataArray.length; i++) {
      try {
        const filename = `temp-${Date.now()}-${i}-${Math.random().toString(36).substr(2,6)}`;
        const tempPath = await this.downloadImage(imageDataArray[i].url, filename);
        const processedUrl = await this.processImage(tempPath, productSlug, i);
        processedImages.push(processedUrl);
      } catch (error) {
        console.error(`Failed to process image ${i + 1} for ${productSlug}:`, error.message);
      }
    }
    return processedImages;
  }

  // ─── Category cache (avoids repeated DB lookups for 30k rows) ──

  async getOrCreateCategory(name) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const key = trimmed.toLowerCase();
    if (this._categoryCache.has(key)) return this._categoryCache.get(key);

    const slug = slugify(trimmed, { lower: true, strict: true });
    let cat = await Category.findOne({ $or: [{ name: trimmed }, { slug }] });
    if (!cat) {
      cat = await Category.create({ name: trimmed, slug });
    }
    this._categoryCache.set(key, cat._id);
    return cat._id;
  }

  // ─── Streaming CSV reader (memory-efficient for 30k+) ─────────

  readCSVStream(filePath) {
    return new Promise((resolve, reject) => {
      const rows = [];
      let rowNumber = 0;
      const stream = fs.createReadStream(filePath)
        .pipe(csv());

      stream.on('data', (row) => {
        rowNumber++;
        // Strip meta: columns from WooCommerce exports to save memory
        const cleaned = {};
        for (const key of Object.keys(row)) {
          if (!key.startsWith('meta:')) cleaned[key] = row[key];
        }
        rows.push({ rowNumber, data: cleaned });
      });
      stream.on('end', () => resolve(rows));
      stream.on('error', reject);
    });
  }

  // For very large files, read in chunks to avoid memory issues
  async *readCSVChunked(filePath, chunkSize = BATCH_SIZE) {
    let chunk = [];
    let rowNumber = 0;

    const rows = await new Promise((resolve, reject) => {
      const allRows = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => { rowNumber++; allRows.push({ rowNumber, data: row }); })
        .on('end', () => resolve(allRows))
        .on('error', reject);
    });

    for (let i = 0; i < rows.length; i += chunkSize) {
      yield rows.slice(i, i + chunkSize);
    }
  }

  // ─── Validation ────────────────────────────────────────────────

  async validateImport(filePath, type) {
    if (!this.supportedTypes.includes(type)) {
      throw new Error(`Unsupported import type: ${type}`);
    }
    const duplicates = [];
    const errors = [];
    let totalRows = 0;

    const rows = await this.readCSVStream(filePath);
    totalRows = rows.length;

    // Pre-load all existing records into memory for fast duplicate checking
    const lookupMaps = await buildLookupMaps(type);
    this.emit('progress', { phase: 'validate', current: 0, total: totalRows });

    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      for (const { rowNumber, data: row } of batch) {
        try {
          const duplicate = checkDuplicateFast(row, type, lookupMaps);
          if (duplicate) {
            duplicates.push({
              row: rowNumber,
              data: this.extractKeyFields(row, type),
              existing: this.extractKeyFields(duplicate, type),
              existingId: duplicate._id ? duplicate._id.toString() : undefined
            });
          }
          const validation = this.validateRow(row, type);
          if (!validation.valid) {
            errors.push({ row: rowNumber, errors: validation.errors, data: this.extractKeyFields(row, type) });
          }
        } catch (error) {
          errors.push({ row: rowNumber, error: error.message, data: this.extractKeyFields(row, type) });
        }
      }
      this.emit('progress', { phase: 'validate', current: Math.min(i + BATCH_SIZE, totalRows), total: totalRows });
    }

    return { totalRows, duplicates: duplicates.length, duplicatesList: duplicates, errors: errors.length, errorsList: errors, valid: errors.length === 0 };
  }

  extractKeyFields(item, type) {
    switch (type) {
      case 'products': {
        if (item.toObject) item = item.toObject();
        return { sku: item.sku || item.SKU, name: item.name || item.post_title || item.Name, slug: item.slug || item.post_name };
      }
      case 'categories': {
        if (item.toObject) item = item.toObject();
        return { name: item.name || item.Name, slug: item.slug || slugify(item.name || item.Name || '', { lower: true, strict: true }) };
      }
      case 'customers': {
        if (item.toObject) item = item.toObject();
        return { email: item.email || item.Email, firstName: item.firstName || item['First Name'] || item.first_name, lastName: item.lastName || item['Last Name'] || item.last_name };
      }
      case 'orders': {
        if (item.toObject) item = item.toObject();
        return { orderNumber: item.orderNumber || item.order_number || item['Order Number'], total: item.total || item.order_total };
      }
      case 'tags':
        return { name: typeof item === 'string' ? item : (item.name || item.Name) };
      default:
        return item;
    }
  }

  async checkDuplicate(row, type) {
    switch (type) {
      case 'products': {
        if (row.sku || row.SKU) {
          const bySku = await Product.findOne({ sku: (row.sku || row.SKU).toUpperCase() });
          if (bySku) return bySku;
        }
        if (row.post_name || row.slug) {
          const bySlug = await Product.findOne({ slug: row.post_name || row.slug });
          if (bySlug) return bySlug;
        }
        if (row.post_title || row.Name || row.name) {
          const byName = await Product.findOne({ name: row.post_title || row.Name || row.name });
          if (byName) return byName;
        }
        return null;
      }
      case 'categories': {
        const catName = row.Name || row.name;
        if (catName) {
          const slug = slugify(catName, { lower: true, strict: true });
          return await Category.findOne({ $or: [{ slug }, { name: catName }] });
        }
        return null;
      }
      case 'customers': {
        const email = (row.Email || row.email || '').toLowerCase();
        if (email) return await User.findOne({ email });
        return null;
      }
      case 'orders': {
        const orderNum = row.order_number || row['Order Number'] || row.orderNumber;
        if (orderNum) return await Order.findOne({ orderNumber: orderNum });
        return null;
      }
      default:
        return null;
    }
  }

  validateRow(row, type) {
    const errors = [];
    switch (type) {
      case 'products':
        if (!row.post_title && !row.Name && !row.name) errors.push('Product name is required');
        if (!row.regular_price && !row['Regular price'] && !row.price) errors.push('Price is required');
        break;
      case 'categories':
        if (!row.Name && !row.name) errors.push('Category name is required');
        break;
      case 'customers':
        if (!row.Email && !row.email) errors.push('Email is required');
        break;
      case 'orders':
        if (!row.order_number && !row['Order Number'] && !row.orderNumber) errors.push('Order number is required');
        break;
      case 'tags':
        if (!row.Name && !row.name) errors.push('Tag name is required');
        break;
    }
    return { valid: errors.length === 0, errors };
  }

  // ─── Product mapping ──────────────────────────────────────────

  async mapProductData(row, options = {}) {
    let categoryIds = [];
    const categoryString = row['tax:product_cat'] || row.Categories || row.categories;
    if (categoryString) {
      const categoryNames = categoryString.split(',').map(c => c.trim()).filter(c => c);
      for (const name of categoryNames) {
        const catId = await this.getOrCreateCategory(name);
        if (catId) categoryIds.push(catId);
      }
    }

    let tags = [];
    const tagString = row['tax:product_tag'] || row.Tags || row.tags;
    if (tagString) tags = tagString.split(',').map(t => t.trim()).filter(t => t);

    const slug = row.post_name || slugify(row.post_title || row.Name || row.name || 'product', { lower: true, strict: true });

    let sku = row.sku || row.SKU;
    if (!sku) {
      sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    } else {
      sku = sku.toUpperCase();
    }

    // CSV regular_price → backendPrice (cost/purchase price for B2B markup)
    const regularPriceValue = row.regular_price || row['Regular price'] || row.price || 0;
    const backendPriceValue = parseFloat(regularPriceValue);

    const rawName = row.post_title || row.Name || row.name;
    const rawDescription = row.post_content || row.Description || row.description || '';
    const rawShortDescription = row.post_excerpt || row['Short description'] || row.short_description || '';

    const productData = {
      name: options.stripHtml ? this.stripHtml(rawName) : rawName,
      slug,
      sku,
      description: options.stripHtml ? this.stripHtml(rawDescription) : rawDescription,
      shortDescription: options.stripHtml ? this.stripHtml(rawShortDescription) : rawShortDescription,
      regularPrice: 0, // Will be set after pricing rules markup
      salePrice: row.sale_price || row['Sale price'] ? parseFloat(row.sale_price || row['Sale price']) : undefined,
      backendPrice: isNaN(backendPriceValue) ? 0 : backendPriceValue,
      stock: parseInt(row.stock || row.Stock || row.stock_quantity || 0),
      categories: categoryIds,
      tags,
      weight: row.weight || row.Weight ? parseFloat(row.weight || row.Weight) : undefined,
      productType: (row.Type === 'variable' || row.type === 'variable' || row['tax:product_type'] === 'variable') ? 'variable' : 'simple',
      isActive: row.post_status === 'publish' || row.Published === '1' || row.status === 'published',
      isFeatured: row.featured === '1' || row.Featured === '1' || false,
      status: (row.post_status === 'publish' || row.Published === '1') ? 'active' : 'draft'
    };

    // Process images
    if (row.images) {
      const imageDataArray = this.parseWooCommerceImages(row.images);
      if (imageDataArray.length > 0) {
        if (options.processImages) {
          try {
            const processedImages = await this.processProductImages(imageDataArray, slug);
            if (processedImages.length > 0) {
              productData.featuredImage = processedImages[0];
              productData.images = processedImages;
            } else {
              productData.featuredImage = imageDataArray[0].url;
              productData.images = imageDataArray.map(img => img.url);
            }
          } catch (error) {
            console.error('Error processing images:', error);
            productData.featuredImage = imageDataArray[0].url;
            productData.images = imageDataArray.map(img => img.url);
          }
        } else {
          productData.featuredImage = imageDataArray[0].url;
          productData.images = imageDataArray.map(img => img.url);
        }
      }
    }

    return productData;
  }

  // ─── Import Products (30k+ capable, batched for performance) ──

  async importProducts(filePath, options = {}) {
    const { processImages = true, duplicateResolution = {} } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };
    const INSERT_BATCH = 50;

    this._categoryCache.clear();
    const rows = await this.readCSVStream(filePath);
    const totalRows = rows.length;

    // Pre-load existing products for fast duplicate checking
    const lookupMaps = await buildLookupMaps('products');
    this.emit('progress', { phase: 'import', current: 0, total: totalRows, type: 'products' });

    let pendingInserts = []; // { rowNumber, productData }
    const flushInserts = async () => {
      if (pendingInserts.length === 0) return;
      try {
        // Mongoose 8: insertMany returns an array of documents
        const docs = await Product.insertMany(
          pendingInserts.map(p => p.productData),
          { ordered: false }
        );
        for (let j = 0; j < docs.length; j++) {
          const pi = pendingInserts[j];
          results.created.push({
            row: pi.rowNumber,
            sku: pi.productData.sku,
            id: docs[j]?._id?.toString() || 'unknown'
          });
        }
      } catch (bulkError) {
        // insertMany with ordered:false may partially succeed
        if (bulkError.insertedDocs && bulkError.insertedDocs.length > 0) {
          const insertedSkus = new Set(bulkError.insertedDocs.map(d => d.sku));
          for (const pi of pendingInserts) {
            if (insertedSkus.has(pi.productData.sku)) {
              const doc = bulkError.insertedDocs.find(d => d.sku === pi.productData.sku);
              results.created.push({ row: pi.rowNumber, sku: pi.productData.sku, id: doc?._id?.toString() || 'unknown' });
            } else {
              results.errors.push({ row: pi.rowNumber, error: 'Batch insert failed for this row', data: { sku: pi.productData.sku, name: pi.productData.name } });
            }
          }
        } else {
          // Total failure — fall back to individual inserts
          for (const pi of pendingInserts) {
            try {
              const product = await Product.create(pi.productData);
              results.created.push({ row: pi.rowNumber, sku: pi.productData.sku, id: product._id.toString() });
            } catch (err) {
              results.errors.push({ row: pi.rowNumber, error: err.message, data: { sku: pi.productData.sku, name: pi.productData.name } });
            }
          }
        }
      }
      pendingInserts = [];
    };

    // Collect duplicate updates for bulkWrite
    let pendingUpdates = []; // { rowNumber, filter, update, sku, type }
    const flushUpdates = async () => {
      if (pendingUpdates.length === 0) return;
      try {
        const bulkOps = pendingUpdates.map(pu => ({
          updateOne: { filter: pu.filter, update: { $set: pu.update } }
        }));
        await Product.bulkWrite(bulkOps, { ordered: false });
        for (const pu of pendingUpdates) {
          if (pu.type === 'merge') {
            results.merged.push({ row: pu.rowNumber, sku: pu.sku, id: pu.id });
          } else {
            results.updated.push({ row: pu.rowNumber, sku: pu.sku, id: pu.id });
          }
        }
      } catch (err) {
        // Fall back to individual updates
        for (const pu of pendingUpdates) {
          try {
            await Product.findOneAndUpdate(pu.filter, { $set: pu.update });
            if (pu.type === 'merge') {
              results.merged.push({ row: pu.rowNumber, sku: pu.sku, id: pu.id });
            } else {
              results.updated.push({ row: pu.rowNumber, sku: pu.sku, id: pu.id });
            }
          } catch (e) {
            results.errors.push({ row: pu.rowNumber, error: e.message, data: { sku: pu.sku } });
          }
        }
      }
      pendingUpdates = [];
    };

    for (let i = 0; i < rows.length; i++) {
      const { rowNumber, data: row } = rows[i];
      try {
        const duplicate = checkDuplicateFast(row, 'products', lookupMaps);
        const resolution = duplicateResolution[rowNumber];

        if (duplicate) {
          if (resolution === 'ignore' || !resolution) {
            results.skipped.push({ row: rowNumber, sku: row.sku || row.SKU, name: row.post_title || row.Name, reason: resolution ? 'Duplicate - ignored' : 'Duplicate - no resolution specified' });
          } else if (resolution === 'merge') {
            const fullDoc = await Product.findById(duplicate._id);
            const existingData = fullDoc.toObject();
            const newData = await this.mapProductData(row, { processImages });
            const mergedData = { ...existingData, ...newData,
              categories: [...new Set([...(existingData.categories || []).map(String), ...(newData.categories || []).map(String)])],
              tags: [...new Set([...(existingData.tags || []), ...(newData.tags || [])])],
              images: [...new Set([...(existingData.images || []), ...(newData.images || [])])]
            };
            if (!newData.featuredImage && existingData.featuredImage) mergedData.featuredImage = existingData.featuredImage;
            pendingUpdates.push({ rowNumber, filter: { _id: duplicate._id }, update: mergedData, sku: mergedData.sku, id: duplicate._id.toString(), type: 'merge' });
          } else if (resolution === 'update') {
            const productData = await this.mapProductData(row, { processImages });
            pendingUpdates.push({ rowNumber, filter: { _id: duplicate._id }, update: productData, sku: productData.sku, id: duplicate._id.toString(), type: 'update' });
          }
        } else {
          const productData = await this.mapProductData(row, { processImages, stripHtml: options.stripHtml });
          pendingInserts.push({ rowNumber, productData });
        }
      } catch (error) {
        results.errors.push({ row: rowNumber, error: error.message, data: this.extractKeyFields(row, 'products') });
      }

      // Flush batches periodically
      if (pendingInserts.length >= INSERT_BATCH) await flushInserts();
      if (pendingUpdates.length >= INSERT_BATCH) await flushUpdates();

      if ((i + 1) % 50 === 0 || i === rows.length - 1) {
        this.emit('progress', { phase: 'import', current: i + 1, total: totalRows, type: 'products' });
      }
    }

    // Flush remaining
    await flushInserts();
    await flushUpdates();

    return results;
  }

  // ─── Import Categories ────────────────────────────────────────

  async importCategories(filePath, options = {}) {
    const { duplicateResolution = {} } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };
    const rows = await this.readCSVStream(filePath);

    this.emit('progress', { phase: 'import', current: 0, total: rows.length, type: 'categories' });

    for (let i = 0; i < rows.length; i++) {
      const { rowNumber, data: row } = rows[i];
      try {
        const duplicate = await this.checkDuplicate(row, 'categories');
        const resolution = duplicateResolution[rowNumber];

        if (duplicate) {
          if (resolution === 'ignore' || !resolution) {
            results.skipped.push({ row: rowNumber, name: row.Name || row.name, reason: 'Duplicate' });
            continue;
          }
          const categoryData = {
            name: row.Name || row.name,
            slug: slugify(row.Name || row.name, { lower: true, strict: true }),
            description: row.Description || row.description || ''
          };
          if (row.Parent || row.parent) {
            const parent = await Category.findOne({ name: row.Parent || row.parent });
            if (parent) categoryData.parent = parent._id;
          }
          if (resolution === 'update') {
            await Category.findByIdAndUpdate(duplicate._id, categoryData);
            results.updated.push({ row: rowNumber, name: categoryData.name, id: duplicate._id.toString() });
          } else if (resolution === 'merge') {
            const existing = duplicate.toObject();
            const merged = { ...existing, ...categoryData, description: existing.description || categoryData.description };
            await Category.findByIdAndUpdate(duplicate._id, merged);
            results.merged.push({ row: rowNumber, name: merged.name, id: duplicate._id.toString() });
          }
          continue;
        }

        const categoryData = {
          name: row.Name || row.name,
          slug: slugify(row.Name || row.name, { lower: true, strict: true }),
          description: row.Description || row.description || ''
        };
        if (row.Parent || row.parent) {
          const parent = await Category.findOne({ name: row.Parent || row.parent });
          if (parent) categoryData.parent = parent._id;
        }
        const category = await Category.create(categoryData);
        results.created.push({ row: rowNumber, name: categoryData.name, id: category._id.toString() });
      } catch (error) {
        results.errors.push({ row: rowNumber, error: error.message, data: this.extractKeyFields(row, 'categories') });
      }

      if ((i + 1) % 50 === 0 || i === rows.length - 1) {
        this.emit('progress', { phase: 'import', current: i + 1, total: rows.length, type: 'categories' });
      }
    }
    return results;
  }

  // ─── Import Customers ─────────────────────────────────────────

  async importCustomers(filePath, options = {}) {
    const { duplicateResolution = {} } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };
    const rows = await this.readCSVStream(filePath);

    this.emit('progress', { phase: 'import', current: 0, total: rows.length, type: 'customers' });

    for (let i = 0; i < rows.length; i++) {
      const { rowNumber, data: row } = rows[i];
      try {
        const duplicate = await this.checkDuplicate(row, 'customers');
        const resolution = duplicateResolution[rowNumber];

        const email = (row.Email || row.email || row.user_email || '').toLowerCase();
        const firstName = row['First Name'] || row.first_name || row.billing_first_name || '';
        const lastName = row['Last Name'] || row.last_name || row.billing_last_name || '';

        if (duplicate) {
          if (resolution === 'ignore' || !resolution) {
            results.skipped.push({ row: rowNumber, email, reason: 'Duplicate' });
            continue;
          }
          const customerData = {
            email,
            firstName,
            lastName,
            phone: row.Phone || row.phone || row.billing_phone || '',
          };
          if (resolution === 'update') {
            await User.findByIdAndUpdate(duplicate._id, customerData);
            results.updated.push({ row: rowNumber, email, id: duplicate._id.toString() });
          } else if (resolution === 'merge') {
            const existing = duplicate.toObject();
            const merged = { ...existing, ...customerData };
            await User.findByIdAndUpdate(duplicate._id, merged);
            results.merged.push({ row: rowNumber, email, id: duplicate._id.toString() });
          }
          continue;
        }

        const customerData = {
          email,
          firstName: firstName || 'Customer',
          lastName: lastName || email.split('@')[0],
          phone: row.Phone || row.phone || row.billing_phone || '',
          role: 'customer',
          password: row.Password || row.password || 'ChangeMe123!',
        };
        const customer = await User.create(customerData);
        results.created.push({ row: rowNumber, email, id: customer._id.toString() });
      } catch (error) {
        results.errors.push({ row: rowNumber, error: error.message, data: this.extractKeyFields(row, 'customers') });
      }

      if ((i + 1) % 50 === 0 || i === rows.length - 1) {
        this.emit('progress', { phase: 'import', current: i + 1, total: rows.length, type: 'customers' });
      }
    }
    return results;
  }

  // ─── Import Orders ────────────────────────────────────────────

  async importOrders(filePath, options = {}) {
    const { duplicateResolution = {} } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };
    const rows = await this.readCSVStream(filePath);

    this.emit('progress', { phase: 'import', current: 0, total: rows.length, type: 'orders' });

    for (let i = 0; i < rows.length; i++) {
      const { rowNumber, data: row } = rows[i];
      try {
        const duplicate = await this.checkDuplicate(row, 'orders');
        const resolution = duplicateResolution[rowNumber];

        if (duplicate) {
          if (resolution === 'ignore' || !resolution) {
            results.skipped.push({ row: rowNumber, orderNumber: row.order_number || row['Order Number'], reason: 'Duplicate' });
            continue;
          }
          // For orders, update is the only sensible resolution
          if (resolution === 'update' || resolution === 'merge') {
            const orderData = await this.mapOrderData(row);
            await Order.findByIdAndUpdate(duplicate._id, orderData);
            results.updated.push({ row: rowNumber, orderNumber: orderData.orderNumber, id: duplicate._id.toString() });
          }
          continue;
        }

        const orderData = await this.mapOrderData(row);
        const order = await Order.create(orderData);
        results.created.push({ row: rowNumber, orderNumber: orderData.orderNumber, id: order._id.toString() });
      } catch (error) {
        results.errors.push({ row: rowNumber, error: error.message, data: this.extractKeyFields(row, 'orders') });
      }

      if ((i + 1) % 50 === 0 || i === rows.length - 1) {
        this.emit('progress', { phase: 'import', current: i + 1, total: rows.length, type: 'orders' });
      }
    }
    return results;
  }

  async mapOrderData(row) {
    // Find or create customer
    const email = (row.billing_email || row.customer_email || row.Email || '').toLowerCase();
    let customer = null;
    if (email) {
      customer = await User.findOne({ email });
      if (!customer) {
        customer = await User.create({
          email,
          firstName: row.billing_first_name || row['Billing First Name'] || 'Customer',
          lastName: row.billing_last_name || row['Billing Last Name'] || email.split('@')[0],
          password: 'ChangeMe123!',
          role: 'customer'
        });
      }
    }

    const orderNumber = row.order_number || row['Order Number'] || row.orderNumber || `ORD-IMP-${Date.now()}`;

    // Parse items if available
    const items = [];
    if (row.line_items || row['Line Items']) {
      // WooCommerce format: "product_name x quantity"
      const itemsStr = row.line_items || row['Line Items'];
      // Basic parsing - can be enhanced
    }

    const statusMap = {
      'wc-completed': 'delivered', 'wc-processing': 'processing', 'wc-pending': 'pending',
      'wc-on-hold': 'pending', 'wc-cancelled': 'cancelled', 'wc-refunded': 'refunded',
      'completed': 'delivered', 'processing': 'processing', 'pending': 'pending',
      'on-hold': 'pending', 'cancelled': 'cancelled', 'refunded': 'refunded'
    };

    const paymentStatusMap = {
      'wc-completed': 'paid', 'wc-processing': 'paid', 'wc-pending': 'pending',
      'completed': 'paid', 'processing': 'paid', 'pending': 'pending'
    };

    const rawStatus = row.status || row.order_status || row['Order Status'] || 'pending';

    return {
      orderNumber,
      customer: customer ? customer._id : undefined,
      items,
      subtotal: parseFloat(row.order_subtotal || row.subtotal || row['Order Subtotal'] || 0),
      tax: parseFloat(row.order_tax || row.tax || row['Order Tax'] || 0),
      shipping: parseFloat(row.order_shipping || row.shipping || row['Shipping Total'] || 0),
      discount: parseFloat(row.discount_total || row.discount || row['Discount Total'] || 0),
      total: parseFloat(row.order_total || row.total || row['Order Total'] || 0),
      currency: row.currency || row.order_currency || 'ZAR',
      billingAddress: {
        firstName: row.billing_first_name || row['Billing First Name'] || '',
        lastName: row.billing_last_name || row['Billing Last Name'] || '',
        street: row.billing_address_1 || row['Billing Address 1'] || '',
        street2: row.billing_address_2 || row['Billing Address 2'] || '',
        city: row.billing_city || row['Billing City'] || '',
        state: row.billing_state || row['Billing State'] || '',
        country: row.billing_country || row['Billing Country'] || '',
        postalCode: row.billing_postcode || row['Billing Postcode'] || '',
        phone: row.billing_phone || row['Billing Phone'] || '',
        email: email
      },
      shippingAddress: {
        firstName: row.shipping_first_name || row['Shipping First Name'] || '',
        lastName: row.shipping_last_name || row['Shipping Last Name'] || '',
        street: row.shipping_address_1 || row['Shipping Address 1'] || '',
        street2: row.shipping_address_2 || row['Shipping Address 2'] || '',
        city: row.shipping_city || row['Shipping City'] || '',
        state: row.shipping_state || row['Shipping State'] || '',
        country: row.shipping_country || row['Shipping Country'] || '',
        postalCode: row.shipping_postcode || row['Shipping Postcode'] || ''
      },
      paymentMethod: row.payment_method || row['Payment Method'] || 'import',
      paymentMethodTitle: row.payment_method_title || row['Payment Method Title'] || 'Imported',
      status: statusMap[rawStatus] || 'pending',
      paymentStatus: paymentStatusMap[rawStatus] || 'pending',
      customerNote: row.customer_note || row['Customer Note'] || '',
      metadata: { importedFrom: 'woocommerce', originalId: row.ID || row.order_id }
    };
  }

  // ─── Export helpers ───────────────────────────────────────────

  async exportProducts(format = 'woocommerce') {
    const products = await Product.find({ status: { $ne: 'trash' } }).populate('categories', 'name').lean();

    if (format === 'woocommerce') {
      return this.exportProductsWooCommerce(products);
    }
    return this.exportProductsNative(products);
  }

  exportProductsWooCommerce(products) {
    const headers = ['ID', 'Type', 'SKU', 'Name', 'Published', 'Is featured?', 'Short description', 'Description',
      'Regular price', 'Sale price', 'Stock', 'Backorders allowed?', 'Weight', 'Categories', 'Tags', 'Images',
      'post_title', 'post_name', 'post_status', 'regular_price', 'sale_price', 'stock', 'stock_status',
      'tax:product_cat', 'tax:product_tag', 'images', 'sku', 'featured', 'backendPrice'];

    const rows = products.map(p => ({
      'ID': p._id.toString(),
      'Type': p.productType || 'simple',
      'SKU': p.sku || '',
      'Name': p.name || '',
      'Published': p.isActive ? '1' : '0',
      'Is featured?': p.isFeatured ? '1' : '0',
      'Short description': p.shortDescription || '',
      'Description': p.description || '',
      'Regular price': p.backendPrice || p.regularPrice || 0,
      'Sale price': p.salePrice || '',
      'Stock': p.stock || 0,
      'Backorders allowed?': '0',
      'Weight': p.weight || '',
      'Categories': (p.categories || []).map(c => typeof c === 'object' ? c.name : c).join(', '),
      'Tags': (p.tags || []).join(', '),
      'Images': (p.images || []).join(' | '),
      'post_title': p.name || '',
      'post_name': p.slug || '',
      'post_status': p.isActive ? 'publish' : 'draft',
      'regular_price': p.backendPrice || p.regularPrice || 0,
      'sale_price': p.salePrice || '',
      'stock': p.stock || 0,
      'stock_status': p.stock > 0 ? 'instock' : 'outofstock',
      'tax:product_cat': (p.categories || []).map(c => typeof c === 'object' ? c.name : c).join(', '),
      'tax:product_tag': (p.tags || []).join(', '),
      'images': (p.images || []).join(' | '),
      'sku': p.sku || '',
      'featured': p.isFeatured ? '1' : '0',
      'backendPrice': p.backendPrice || 0
    }));

    return { headers, rows };
  }

  exportProductsNative(products) {
    const headers = ['_id', 'name', 'slug', 'sku', 'description', 'shortDescription', 'regularPrice', 'backendPrice',
      'salePrice', 'stock', 'categories', 'tags', 'featuredImage', 'images', 'productType', 'isActive',
      'isFeatured', 'weight', 'brand', 'status'];

    const rows = products.map(p => ({
      '_id': p._id.toString(),
      'name': p.name || '',
      'slug': p.slug || '',
      'sku': p.sku || '',
      'description': p.description || '',
      'shortDescription': p.shortDescription || '',
      'regularPrice': p.regularPrice || 0,
      'backendPrice': p.backendPrice || 0,
      'salePrice': p.salePrice || '',
      'stock': p.stock || 0,
      'categories': (p.categories || []).map(c => typeof c === 'object' ? c.name : c).join(' | '),
      'tags': (p.tags || []).join(' | '),
      'featuredImage': p.featuredImage || '',
      'images': (p.images || []).join(' | '),
      'productType': p.productType || 'simple',
      'isActive': p.isActive ? '1' : '0',
      'isFeatured': p.isFeatured ? '1' : '0',
      'weight': p.weight || '',
      'brand': p.brand || '',
      'status': p.status || 'active'
    }));

    return { headers, rows };
  }

  async exportCategories() {
    const categories = await Category.find().populate('parent', 'name').lean();
    const headers = ['Name', 'Slug', 'Description', 'Parent', 'Image'];
    const rows = categories.map(c => ({
      'Name': c.name || '',
      'Slug': c.slug || '',
      'Description': c.description || '',
      'Parent': c.parent ? (typeof c.parent === 'object' ? c.parent.name : '') : '',
      'Image': c.image || ''
    }));
    return { headers, rows };
  }

  async exportCustomers() {
    const customers = await User.find({ role: 'customer' }).select('-password').lean();
    const headers = ['Email', 'First Name', 'Last Name', 'Phone', 'Role', 'Created'];
    const rows = customers.map(c => ({
      'Email': c.email || '',
      'First Name': c.firstName || '',
      'Last Name': c.lastName || '',
      'Phone': c.phone || '',
      'Role': c.role || 'customer',
      'Created': c.createdAt ? new Date(c.createdAt).toISOString() : ''
    }));
    return { headers, rows };
  }

  async exportOrders() {
    const orders = await Order.find().populate('customer', 'email firstName lastName').populate('items.product', 'name sku').lean();
    const headers = ['Order Number', 'Status', 'Payment Status', 'Customer Email', 'Customer Name',
      'Subtotal', 'Tax', 'Shipping', 'Discount', 'Total', 'Currency', 'Payment Method',
      'Billing First Name', 'Billing Last Name', 'Billing Street', 'Billing City', 'Billing State',
      'Billing Country', 'Billing Postcode', 'Billing Phone',
      'Shipping First Name', 'Shipping Last Name', 'Shipping Street', 'Shipping City', 'Shipping State',
      'Shipping Country', 'Shipping Postcode', 'Customer Note', 'Created'];

    const rows = orders.map(o => ({
      'Order Number': o.orderNumber || '',
      'Status': o.status || '',
      'Payment Status': o.paymentStatus || '',
      'Customer Email': o.customer ? o.customer.email : '',
      'Customer Name': o.customer ? `${o.customer.firstName} ${o.customer.lastName}` : '',
      'Subtotal': o.subtotal || 0,
      'Tax': o.tax || 0,
      'Shipping': o.shipping || 0,
      'Discount': o.discount || 0,
      'Total': o.total || 0,
      'Currency': o.currency || 'ZAR',
      'Payment Method': o.paymentMethod || '',
      'Billing First Name': o.billingAddress?.firstName || '',
      'Billing Last Name': o.billingAddress?.lastName || '',
      'Billing Street': o.billingAddress?.street || '',
      'Billing City': o.billingAddress?.city || '',
      'Billing State': o.billingAddress?.state || '',
      'Billing Country': o.billingAddress?.country || '',
      'Billing Postcode': o.billingAddress?.postalCode || '',
      'Billing Phone': o.billingAddress?.phone || '',
      'Shipping First Name': o.shippingAddress?.firstName || '',
      'Shipping Last Name': o.shippingAddress?.lastName || '',
      'Shipping Street': o.shippingAddress?.street || '',
      'Shipping City': o.shippingAddress?.city || '',
      'Shipping State': o.shippingAddress?.state || '',
      'Shipping Country': o.shippingAddress?.country || '',
      'Shipping Postcode': o.shippingAddress?.postalCode || '',
      'Customer Note': o.customerNote || '',
      'Created': o.createdAt ? new Date(o.createdAt).toISOString() : ''
    }));

    return { headers, rows };
  }

  // ─── CSV generation helper ────────────────────────────────────

  generateCSV(headers, rows) {
    const escape = (val) => {
      const str = String(val == null ? '' : val);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    };
    const lines = [headers.map(escape).join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => escape(row[h])).join(','));
    }
    return lines.join('\n');
  }
}

module.exports = new WooCommerceImporter();
