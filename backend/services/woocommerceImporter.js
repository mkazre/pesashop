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
const ImportBatch = require('../models/ImportBatch');
const slugify = require('slugify');
const imageProcessor = require('./imageProcessor');
const fsPromises = fs.promises;
const { uploadToCloudinary } = require('../config/cloudinary');

const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

const { buildLookupMaps, checkDuplicateFast } = require('./validationHelper');
const { parsePriceString, parseQuantityString } = require('./numberParser');

// ─── Tuning constants for 100K+ imports ─────────────────────────
const BATCH_SIZE = 100;
const DB_BATCH_SIZE = 200;
const IMAGE_CONCURRENCY = 5;
const IMAGE_DOWNLOAD_TIMEOUT = 45000;
const MAX_IMAGE_RETRIES = 2;

class WooCommerceImporter extends EventEmitter {
  constructor() {
    super();
    this.supportedTypes = ['products', 'categories', 'customers', 'orders', 'tags'];
    this.tempImageDir = path.join(__dirname, '../uploads/temp/images');
    this.processedImageDir = path.join(__dirname, '../uploads/products');
    this._categoryCache = new Map();
    this._jobs = new Map(); // jobId → job state for background imports

    [this.tempImageDir, this.processedImageDir].forEach(dir => {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });
  }

  // ─── Job management (background imports for 100K+) ─────────────

  getJob(jobId) {
    return this._jobs.get(jobId) || null;
  }

  _createJob(jobId, type) {
    const job = {
      id: jobId, type,
      status: 'running',
      phase: 'starting',
      progress: { current: 0, total: 0 },
      results: { created: 0, updated: 0, merged: 0, skipped: 0, errors: 0 },
      resultDetails: { created: [], updated: [], merged: [], skipped: [], errors: [] },
      startedAt: new Date(), completedAt: null, error: null,
      imageStats: { total: 0, processed: 0, failed: 0, pending: 0 }
    };
    this._jobs.set(jobId, job);
    return job;
  }

  _updateJobProgress(jobId, phase, current, total, extras = {}) {
    const job = this._jobs.get(jobId);
    if (!job) return;
    job.phase = phase;
    job.progress = { current, total };
    Object.assign(job, extras);
    this.emit('progress', { jobId, phase, current, total, type: job.type, results: job.results, imageStats: job.imageStats, status: job.status });
  }

  _completeJob(jobId) {
    const job = this._jobs.get(jobId);
    if (!job) return;
    job.status = 'completed'; job.phase = 'done'; job.completedAt = new Date();
    this.emit('progress', { jobId, phase: 'done', current: job.progress.total, total: job.progress.total, type: job.type, results: job.results, imageStats: job.imageStats, status: 'completed' });
    setTimeout(() => this._jobs.delete(jobId), 30 * 60 * 1000);
  }

  _failJob(jobId, error) {
    const job = this._jobs.get(jobId);
    if (!job) return;
    job.status = 'failed'; job.error = error.message || String(error); job.completedAt = new Date();
    this.emit('progress', { jobId, phase: 'failed', current: job.progress.current, total: job.progress.total, type: job.type, results: job.results, status: 'failed', error: job.error });
    setTimeout(() => this._jobs.delete(jobId), 30 * 60 * 1000);
  }

  // ─── Concurrent image queue (non-blocking) ───────────────────

  _createImageQueue(concurrency = IMAGE_CONCURRENCY) {
    const queue = [];
    let running = 0;
    let resolveIdle = null;
    let idlePromise = null;

    const run = async () => {
      while (queue.length > 0 && running < concurrency) {
        const task = queue.shift();
        running++;
        task().finally(() => {
          running--;
          if (queue.length > 0) run();
          if (running === 0 && resolveIdle) { resolveIdle(); resolveIdle = null; idlePromise = null; }
        });
      }
    };

    return {
      push(fn) { queue.push(fn); run(); },
      get pending() { return queue.length + running; },
      waitIdle() {
        if (running === 0 && queue.length === 0) return Promise.resolve();
        if (!idlePromise) idlePromise = new Promise(r => { resolveIdle = r; });
        return idlePromise;
      }
    };
  }

  // ─── Count CSV rows without loading into memory ──────────────

  countCSVRows(filePath) {
    return new Promise((resolve, reject) => {
      let count = 0;
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', () => { count++; })
        .on('end', () => resolve(count))
        .on('error', reject);
    });
  }

  // ─── True streaming CSV with backpressure (100K+ safe) ───────

  streamCSVChunked(filePath, chunkSize = DB_BATCH_SIZE) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      let currentChunk = [];
      let rowNumber = 0;
      let resolveNext = null;
      let done = false;

      const readable = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 }).pipe(csv());

      const iterator = {
        [Symbol.asyncIterator]() { return this; },
        next() {
          if (chunks.length > 0) return Promise.resolve({ value: chunks.shift(), done: false });
          if (done && currentChunk.length > 0) { const last = currentChunk; currentChunk = []; return Promise.resolve({ value: last, done: false }); }
          if (done) return Promise.resolve({ value: undefined, done: true });
          return new Promise(r => { resolveNext = r; readable.resume(); });
        }
      };

      let metaColumnsWarned = false;
      readable.on('data', (row) => {
        rowNumber++;
        const cleaned = {};
        const droppedMetaKeys = [];
        for (const key of Object.keys(row)) {
          if (key.startsWith('meta:')) droppedMetaKeys.push(key);
          else cleaned[key] = row[key];
        }
        if (droppedMetaKeys.length > 0 && !metaColumnsWarned) {
          metaColumnsWarned = true;
          console.warn(`[Import] Dropping meta: columns (not mapped to any field): ${droppedMetaKeys.join(', ')}`);
        }
        currentChunk.push({ rowNumber, data: cleaned });

        if (currentChunk.length >= chunkSize) {
          const chunk = currentChunk; currentChunk = [];
          if (resolveNext) { const rn = resolveNext; resolveNext = null; readable.pause(); rn({ value: chunk, done: false }); }
          else { chunks.push(chunk); if (chunks.length > 2) readable.pause(); }
        }
      });

      readable.on('end', () => {
        done = true;
        if (resolveNext) {
          const rn = resolveNext; resolveNext = null;
          if (currentChunk.length > 0) { const last = currentChunk; currentChunk = []; rn({ value: last, done: false }); }
          else rn({ value: undefined, done: true });
        }
      });

      readable.on('error', (err) => { done = true; reject(err); });
      readable.pause();
      resolve({ iterator, getTotalRead: () => rowNumber });
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

  async downloadImage(imageUrl, filename, retries = MAX_IMAGE_RETRIES) {
    const protocol = imageUrl.startsWith('https') ? https : http;
    const tempPath = path.join(this.tempImageDir, filename);
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(tempPath);
      const req = protocol.get(imageUrl, { timeout: IMAGE_DOWNLOAD_TIMEOUT }, (response) => {
        if (response.statusCode === 301 || response.statusCode === 302) {
          file.close();
          try { fs.unlinkSync(tempPath); } catch (_) {}
          return this.downloadImage(response.headers.location, filename, retries).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
          return reject(new Error(`HTTP ${response.statusCode}`));
        }
        response.pipe(file);
        file.on('finish', () => { file.close(); resolve(tempPath); });
      });
      req.on('error', async (err) => {
        file.close();
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 1000));
          return this.downloadImage(imageUrl, filename, retries - 1).then(resolve).catch(reject);
        }
        reject(err);
      });
      req.on('timeout', () => {
        req.destroy();
        file.close();
        try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch (_) {}
        if (retries > 0) {
          setTimeout(() => {
            this.downloadImage(imageUrl, filename, retries - 1).then(resolve).catch(reject);
          }, 1000);
        } else {
          reject(new Error('Download timeout'));
        }
      });
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

      // Upload to Cloudinary if configured
      if (useCloudinary) {
        try {
          const cloudResult = await uploadToCloudinary(outputPath, { folder: 'products' });
          // Clean up local processed file
          try { if (fs.existsSync(outputPath)) await fsPromises.unlink(outputPath); } catch (_) {}
          return cloudResult.url;
        } catch (cloudErr) {
          console.error('Cloudinary upload failed during import, keeping local file:', cloudErr.message);
        }
      }

      return `/uploads/products/${filename}`;
    } catch (error) {
      try {
        const ext2 = path.extname(imagePath) || '.jpg';
        const filename = `${productSlug}-${index}-${Date.now()}${ext2}`;
        const outputPath = path.join(this.processedImageDir, filename);
        fs.copyFileSync(imagePath, outputPath);
        if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);

        // Upload fallback to Cloudinary too
        if (useCloudinary) {
          try {
            const cloudResult = await uploadToCloudinary(outputPath, { folder: 'products' });
            try { if (fs.existsSync(outputPath)) await fsPromises.unlink(outputPath); } catch (_) {}
            return cloudResult.url;
          } catch (cloudErr) {
            console.error('Cloudinary fallback upload failed:', cloudErr.message);
          }
        }

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

      let metaColumnsWarned = false;
      stream.on('data', (row) => {
        rowNumber++;
        // Strip meta: columns from WooCommerce exports to save memory
        const cleaned = {};
        const droppedMetaKeys = [];
        for (const key of Object.keys(row)) {
          if (key.startsWith('meta:')) droppedMetaKeys.push(key);
          else cleaned[key] = row[key];
        }
        if (droppedMetaKeys.length > 0 && !metaColumnsWarned) {
          metaColumnsWarned = true;
          console.warn(`[Import] Dropping meta: columns (not mapped to any field): ${droppedMetaKeys.join(', ')}`);
        }
        rows.push({ rowNumber, data: cleaned });
      });
      stream.on('end', () => resolve(rows));
      stream.on('error', reject);
    });
  }

  // ─── Validation (streaming for 100K+) ─────────────────────────

  async validateImport(filePath, type) {
    if (!this.supportedTypes.includes(type)) {
      throw new Error(`Unsupported import type: ${type}`);
    }
    const duplicates = [];
    const errors = [];
    let totalRows = 0;

    // Count rows first (quick pass)
    const countedTotal = await this.countCSVRows(filePath);
    this.emit('progress', { phase: 'validate', current: 0, total: countedTotal });

    // Pre-load all existing records into memory for fast duplicate checking
    const lookupMaps = await buildLookupMaps(type);

    // Stream through CSV in chunks — never loads all rows into memory
    const { iterator } = await this.streamCSVChunked(filePath, DB_BATCH_SIZE);

    for await (const chunk of iterator) {
      for (const { rowNumber, data: row } of chunk) {
        totalRows++;
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
      this.emit('progress', { phase: 'validate', current: totalRows, total: countedTotal });
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

    let slug = row.post_name || row.slug;
    if (!slug) {
      const baseSlug = slugify(row.post_title || row.Name || row.name || 'product', { lower: true, strict: true });
      slug = `${baseSlug}-${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
    }

    let sku = row.sku || row.SKU;
    if (!sku) {
      sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    } else {
      sku = sku.toUpperCase();
    }

    // CSV regular_price → backendPrice (cost/purchase price for B2B markup)
    // Use locale-aware parser so "1.000,00" / "1000,00" / "$1,234.56" all parse correctly.
    const regularPriceValue = row.regular_price || row['Regular price'] || row.price || 0;
    const backendPriceValue = parsePriceString(regularPriceValue);

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
      salePrice: (row.sale_price || row['Sale price']) ? parsePriceString(row.sale_price || row['Sale price']) : undefined,
      backendPrice: backendPriceValue,
      stock: parseQuantityString(row.stock || row.Stock || row.stock_quantity || 0),
      categories: categoryIds,
      tags,
      weight: (row.weight || row.Weight) ? parsePriceString(row.weight || row.Weight) : undefined,
      productType: (row.Type === 'variable' || row.type === 'variable' || row['tax:product_type'] === 'variable') ? 'variable' : 'simple',
      isActive: row.post_status === 'publish' || row.Published === '1' || row.status === 'published',
      isFeatured: row.featured === '1' || row.Featured === '1' || false,
      status: (row.post_status === 'publish' || row.Published === '1') ? 'active' : 'draft'
    };

    // Process images (handle both lowercase and WooCommerce standard capital-I column)
    const imagesRawSync = row.images || row.Images || row.image || row.Image || '';
    if (imagesRawSync) {
      const imageDataArray = this.parseWooCommerceImages(imagesRawSync);
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

  // ─── Fast product mapping (no inline image processing) ────────
  // Stores raw image URLs; actual download/processing happens in background queue

  async mapProductDataFast(row, options = {}) {
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

    let slug = row.post_name || row.slug;
    if (!slug) {
      const baseSlug = slugify(row.post_title || row.Name || row.name || 'product', { lower: true, strict: true });
      slug = `${baseSlug}-${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
    }

    let sku = row.sku || row.SKU;
    if (!sku) {
      sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();
    } else {
      sku = sku.toUpperCase();
    }

    const regularPriceValue = row.regular_price || row['Regular price'] || row.price || 0;
    const backendPriceValue = parsePriceString(regularPriceValue);

    const rawName = row.post_title || row.Name || row.name;
    const rawDescription = row.post_content || row.Description || row.description || '';
    const rawShortDescription = row.post_excerpt || row['Short description'] || row.short_description || '';

    const productData = {
      name: options.stripHtml ? this.stripHtml(rawName) : rawName,
      slug,
      sku,
      description: options.stripHtml ? this.stripHtml(rawDescription) : rawDescription,
      shortDescription: options.stripHtml ? this.stripHtml(rawShortDescription) : rawShortDescription,
      regularPrice: 0,
      salePrice: (row.sale_price || row['Sale price']) ? parsePriceString(row.sale_price || row['Sale price']) : undefined,
      backendPrice: backendPriceValue,
      stock: parseQuantityString(row.stock || row.Stock || row.stock_quantity || 0),
      categories: categoryIds,
      tags,
      weight: (row.weight || row.Weight) ? parsePriceString(row.weight || row.Weight) : undefined,
      productType: (row.Type === 'variable' || row.type === 'variable' || row['tax:product_type'] === 'variable') ? 'variable' : 'simple',
      isActive: row.post_status === 'publish' || row.Published === '1' || row.status === 'published',
      isFeatured: row.featured === '1' || row.Featured === '1' || false,
      status: (row.post_status === 'publish' || row.Published === '1') ? 'active' : 'draft'
    };

    // Store raw image URLs — actual processing happens in image queue
    const imagesRaw = row.images || row.Images || row.image || row.Image || '';
    if (imagesRaw) {
      const imageDataArray = this.parseWooCommerceImages(imagesRaw);
      if (imageDataArray.length > 0) {
        productData.featuredImage = imageDataArray[0].url;
        productData.images = imageDataArray.map(img => img.url);
        productData._rawImageData = imageDataArray; // saved for queue processing
      }
    }

    return productData;
  }

  // Helper: queue image processing for a successfully inserted/upserted product
  _queueImageProcessing(imageQueue, imageStats, processImages, pi, doc) {
    if (!processImages || !imageQueue || !pi.rawImageData || pi.rawImageData.length === 0) return;
    const slug = pi.productData.slug;
    const productId = doc?._id;
    if (!productId) return;
    const imgData = pi.rawImageData;
    imageStats.total += imgData.length;
    imageQueue.push(async () => {
      try {
        const processedImages = await this.processProductImages(imgData, slug);
        if (processedImages.length > 0) {
          await Product.findByIdAndUpdate(productId, {
            $set: { featuredImage: processedImages[0], images: processedImages }
          });
          imageStats.processed += processedImages.length;
          imageStats.failed += (imgData.length - processedImages.length);
        } else {
          imageStats.failed += imgData.length;
        }
      } catch (err) {
        console.error(`[Import] Image processing failed for ${slug}:`, err.message);
        imageStats.failed += imgData.length;
      }
    });
  }

  // ─── Import Products (100K+ capable, streaming + batched) ──────

  async importProducts(filePath, options = {}) {
    const { processImages = true, duplicateResolution = {}, updateExisting = false } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };

    this._categoryCache.clear();

    // Phase 1: Count rows (quick scan, no memory)
    const totalRows = await this.countCSVRows(filePath);
    console.log(`[Import] Starting import of ${totalRows} product rows`);
    this.emit('progress', { phase: 'import', current: 0, total: totalRows, type: 'products' });

    // Pre-load existing products for fast duplicate checking
    const lookupMaps = await buildLookupMaps('products');

    // Image queue for background processing
    const imageQueue = processImages ? this._createImageQueue(IMAGE_CONCURRENCY) : null;
    let imageStats = { total: 0, processed: 0, failed: 0 };

    // Phase 2: Stream through CSV in chunks, never loading all rows
    const { iterator } = await this.streamCSVChunked(filePath, DB_BATCH_SIZE);
    let processed = 0;

    for await (const chunk of iterator) {
      const pendingInserts = [];
      const pendingUpdates = [];

      // Map all rows in this chunk
      for (const { rowNumber, data: row } of chunk) {
        try {
          const duplicate = checkDuplicateFast(row, 'products', lookupMaps);
          const resolution = duplicateResolution[rowNumber];

          if (duplicate && !duplicate._id) {
            // Matched an in-memory lookupMaps entry added a few lines below for a row
            // earlier in THIS SAME chunk/file — not an existing DB product. That entry
            // is still pending insert and has no _id yet, so routing it through the
            // genuine-duplicate branches below (findById(undefined) / undefined.toString())
            // throws a TypeError/CastError that the generic catch turns into an opaque
            // "Cannot read properties of undefined" error. Report it plainly instead.
            const rowSku = (row.sku || row.SKU || '').toUpperCase();
            const matchedBy = rowSku && duplicate.sku && duplicate.sku.toUpperCase() === rowSku
              ? `sku "${rowSku}"`
              : `slug "${row.post_name || row.slug}"`;
            results.errors.push({
              row: rowNumber,
              error: `Duplicate ${matchedBy} within this file — also used by row ${duplicate.__pendingRow}`,
              data: this.extractKeyFields(row, 'products')
            });
          } else if (duplicate) {
            // If updateExisting mode is on, always update; otherwise use per-row resolution or default to 'update'
            const effectiveResolution = updateExisting ? 'update' : (resolution || 'update');
            if (effectiveResolution === 'ignore') {
              results.skipped.push({ row: rowNumber, sku: row.sku || row.SKU, name: row.post_title || row.Name, reason: 'Duplicate - ignored' });
            } else if (effectiveResolution === 'merge') {
              const fullDoc = await Product.findById(duplicate._id);
              if (fullDoc) {
                const existingData = fullDoc.toObject();
                const newData = await this.mapProductDataFast(row, { stripHtml: options.stripHtml });
                delete newData._rawImageData;
                const mergedData = { ...existingData, ...newData,
                  categories: [...new Set([...(existingData.categories || []).map(String), ...(newData.categories || []).map(String)])],
                  tags: [...new Set([...(existingData.tags || []), ...(newData.tags || [])])],
                  images: [...new Set([...(existingData.images || []), ...(newData.images || [])])]
                };
                if (!newData.featuredImage && existingData.featuredImage) mergedData.featuredImage = existingData.featuredImage;
                pendingUpdates.push({ rowNumber, filter: { _id: duplicate._id }, update: mergedData, sku: mergedData.sku, id: duplicate._id.toString(), type: 'merge' });
              } else {
                // Existing doc vanished between building lookupMaps and now (e.g. deleted
                // concurrently) — don't drop the row silently.
                results.errors.push({ row: rowNumber, error: `Duplicate matched product ${duplicate._id} but it no longer exists`, data: this.extractKeyFields(row, 'products') });
              }
            } else if (effectiveResolution === 'update') {
              const productData = await this.mapProductDataFast(row, { stripHtml: options.stripHtml });
              const rawImageData = productData._rawImageData;
              delete productData._rawImageData;
              pendingUpdates.push({ rowNumber, filter: { _id: duplicate._id }, update: productData, sku: productData.sku, id: duplicate._id.toString(), type: 'update', rawImageData });
            }
          } else {
            const productData = await this.mapProductDataFast(row, { stripHtml: options.stripHtml });
            const rawImageData = productData._rawImageData;
            delete productData._rawImageData;
            pendingInserts.push({ rowNumber, productData, rawImageData });

            // Update lookup maps to prevent duplicates within the same import.
            // __pendingRow tags this entry so a later row's collision message can
            // name which row it collided with; Mongoose (strict:true, the default)
            // silently strips unknown paths like this before insertMany writes it.
            productData.__pendingRow = rowNumber;
            if (productData.sku && lookupMaps.bySku) lookupMaps.bySku.set(productData.sku.toUpperCase(), productData);
            if (productData.slug && lookupMaps.bySlug) lookupMaps.bySlug.set(productData.slug, productData);
          }
        } catch (error) {
          results.errors.push({ row: rowNumber, error: error.message, data: this.extractKeyFields(row, 'products') });
        }
      }

      // Flush inserts for this chunk
      if (pendingInserts.length > 0) {
        try {
          // rawResult:true is required here — without it, insertMany({ordered:false})
          // silently drops any doc that fails Mongoose schema validation (e.g. a blank
          // required field) with no error and no trace in the result. rawResult exposes
          // result.mongoose.validationErrors (each tagged with .index into the input
          // array) and result.mongoose.results (per-index: the inserted doc, or the
          // validation error), so dropped rows can be reported instead of vanishing.
          const insertResult = await Product.insertMany(
            pendingInserts.map(p => p.productData),
            { ordered: false, rawResult: true }
          );
          const validationErrors = insertResult.mongoose?.validationErrors || [];
          const perIndexResults = insertResult.mongoose?.results || [];

          for (const ve of validationErrors) {
            const pi = pendingInserts[ve.index];
            const message = ve.errors
              ? Object.values(ve.errors).map(e => e.message).join('; ')
              : ve.message;
            results.errors.push({ row: pi.rowNumber, error: message, data: this.extractKeyFields(pi.productData, 'products') });
          }

          // Build a SKU→{doc,pi} map so we match by identity, not by positional index.
          // insertMany with ordered:false may internally reorder operations; relying on
          // docs[j] === pendingInserts[j] causes images from product A to be saved on product B.
          const skuToInsert = new Map();
          const slugToInsert = new Map();
          for (const pi of pendingInserts) {
            if (pi.productData.sku)  skuToInsert.set(pi.productData.sku.toUpperCase(), pi);
            if (pi.productData.slug) slugToInsert.set(pi.productData.slug, pi);
          }

          let matchedCount = 0;
          for (const doc of perIndexResults) {
            if (!doc || doc.errors || doc.name === 'ValidationError') continue; // already recorded above
            const key = doc.sku ? doc.sku.toUpperCase() : null;
            const pi = (key && skuToInsert.get(key)) || (doc.slug && slugToInsert.get(doc.slug));
            const docId = doc._id?.toString() || 'unknown';
            matchedCount++;
            if (pi) {
              results.created.push({ row: pi.rowNumber, sku: pi.productData.sku, id: docId });
              this._queueImageProcessing(imageQueue, imageStats, processImages, pi, doc);
            } else {
              results.created.push({ row: 0, sku: doc.sku, id: docId });
            }
          }

          // Belt-and-suspenders: anything not accounted for by a created row or a
          // validation error is unexplained — surface it instead of losing it silently.
          const unaccountedFor = pendingInserts.length - matchedCount - validationErrors.length;
          if (unaccountedFor > 0) {
            console.error(`[Import] ${unaccountedFor} row(s) in this chunk were neither inserted nor reported as validation errors — investigate.`);
          }
        } catch (bulkError) {
          // insertMany({ordered:false}) throws BulkWriteError but still inserts non-conflicting docs.
          // Use writeErrors to identify which rows failed, then fall back to individual inserts for those.
          const failedIndexes = new Set();
          if (bulkError.writeErrors) {
            for (const we of bulkError.writeErrors) {
              failedIndexes.add(we.index);
            }
          } else if (bulkError.code === 11000) {
            // Single duplicate key error — entire batch failed on one doc
            // Fall back to individual inserts for all
            for (let j = 0; j < pendingInserts.length; j++) failedIndexes.add(j);
          }

          // Rows that DID succeed (not in failedIndexes) — find them in DB by SKU
          for (let j = 0; j < pendingInserts.length; j++) {
            const pi = pendingInserts[j];
            if (!failedIndexes.has(j)) {
              // This row was inserted successfully — find the doc
              const doc = await Product.findOne({ sku: pi.productData.sku }).select('_id').lean();
              results.created.push({ row: pi.rowNumber, sku: pi.productData.sku, id: doc?._id?.toString() || 'unknown' });
              this._queueImageProcessing(imageQueue, imageStats, processImages, pi, doc);
            } else {
              // This row failed batch insert — try individual upsert
              try {
                const product = await Product.findOneAndUpdate(
                  { $or: [{ sku: pi.productData.sku }, { slug: pi.productData.slug }] },
                  { $set: pi.productData },
                  { upsert: true, new: true, setDefaultsOnInsert: true }
                );
                results.created.push({ row: pi.rowNumber, sku: pi.productData.sku, id: product._id.toString() });
                this._queueImageProcessing(imageQueue, imageStats, processImages, pi, product);
              } catch (err) {
                results.errors.push({ row: pi.rowNumber, error: err.message, data: { sku: pi.productData.sku, name: pi.productData.name } });
              }
            }
          }
        }
      }

      // Flush updates for this chunk
      if (pendingUpdates.length > 0) {
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
            // Queue image processing for updated products too
            if (pu.rawImageData) {
              this._queueImageProcessing(imageQueue, imageStats, processImages, { productData: pu.update, rawImageData: pu.rawImageData }, { _id: pu.filter._id || pu.id });
            }
          }
        } catch (err) {
          for (const pu of pendingUpdates) {
            try {
              await Product.findOneAndUpdate(pu.filter, { $set: pu.update });
              if (pu.type === 'merge') {
                results.merged.push({ row: pu.rowNumber, sku: pu.sku, id: pu.id });
              } else {
                results.updated.push({ row: pu.rowNumber, sku: pu.sku, id: pu.id });
              }
              if (pu.rawImageData) {
                this._queueImageProcessing(imageQueue, imageStats, processImages, { productData: pu.update, rawImageData: pu.rawImageData }, { _id: pu.filter._id || pu.id });
              }
            } catch (e) {
              results.errors.push({ row: pu.rowNumber, error: e.message, data: { sku: pu.sku } });
            }
          }
        }
      }

      processed += chunk.length;
      this.emit('progress', {
        phase: 'import',
        current: processed,
        total: totalRows,
        type: 'products',
        imageStats: processImages ? { ...imageStats, pending: imageQueue ? imageQueue.pending : 0 } : undefined
      });

      // Allow event loop to breathe on large imports
      if (processed % 1000 === 0) await new Promise(r => setImmediate(r));
    }

    // Wait for background image processing to complete
    if (imageQueue && imageQueue.pending > 0) {
      this.emit('progress', { phase: 'images', current: processed, total: totalRows, type: 'products', imageStats: { ...imageStats, pending: imageQueue.pending } });
      await imageQueue.waitIdle();
    }

    console.log(`[Import] Completed: ${results.created.length} created, ${results.updated.length} updated, ${results.merged.length} merged, ${results.skipped.length} skipped, ${results.errors.length} errors`);
    return { ...results, imageStats };
  }

  // ─── Background job wrapper (fire-and-forget, frontend polls) ──

  startImportJob(filePath, type, options = {}) {
    const jobId = `import-${type}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    this._createJob(jobId, type);

    // Create a persistent batch record immediately
    const batchData = {
      jobId,
      type,
      originalFilename: options.originalFilename || path.basename(filePath),
      importMode: options.importMode || 'add',
      status: 'running',
      importedBy: options.importedBy || null,
      startedAt: new Date(),
    };
    ImportBatch.create(batchData).catch(err => console.error('[ImportBatch] Failed to create batch record:', err.message));

    // Run in background — DO NOT await
    (async () => {
      try {
        const totalRows = await this.countCSVRows(filePath);
        this._updateJobProgress(jobId, 'counting', 0, totalRows);

        // Attach progress listener to update job state
        const progressHandler = (data) => {
          if (!data.jobId) { // only forward internal progress events
            const j = this._jobs.get(jobId);
            if (j && (data.phase === 'import' || data.phase === 'images')) {
              j.progress = { current: data.current, total: data.total };
              j.phase = data.phase;
              if (data.imageStats) j.imageStats = data.imageStats;
            }
          }
        };
        this.on('progress', progressHandler);

        this._updateJobProgress(jobId, 'importing', 0, totalRows);

        let results;
        if (type === 'products') {
          results = await this.importProducts(filePath, options);
        } else if (type === 'categories') {
          results = await this.importCategories(filePath, options);
        } else if (type === 'customers') {
          results = await this.importCustomers(filePath, options);
        } else if (type === 'orders') {
          results = await this.importOrders(filePath, options);
        } else {
          throw new Error(`Unsupported import type: ${type}`);
        }

        this.removeListener('progress', progressHandler);

        // Finalize job
        const job = this._jobs.get(jobId);
        if (job) {
          job.results = {
            created: results.created?.length || 0,
            updated: results.updated?.length || 0,
            merged: results.merged?.length || 0,
            skipped: results.skipped?.length || 0,
            errors: results.errors?.length || 0
          };
          // Only keep summary in resultDetails to avoid memory bloat on 100K imports
          job.resultDetails = {
            created: results.created?.slice(0, 50) || [],
            updated: results.updated?.slice(0, 50) || [],
            merged: results.merged?.slice(0, 50) || [],
            skipped: results.skipped?.slice(0, 50) || [],
            errors: results.errors?.slice(0, 200) || []
          };
          if (results.imageStats) job.imageStats = results.imageStats;
        }
        this._completeJob(jobId);

        // Persist batch results to DB (including product IDs for rollback)
        try {
          const createdIds = (results.created || [])
            .map(r => r.id)
            .filter(Boolean);

          // Derive category names from imported products (sample first 100)
          let categoryNames = [];
          if (type === 'products' && createdIds.length > 0) {
            const sample = await Product.find({ _id: { $in: createdIds.slice(0, 100) } })
              .select('categories')
              .populate('categories', 'name');
            const catSet = new Set();
            sample.forEach(p => (p.categories || []).forEach(c => catSet.add(c.name || c)));
            categoryNames = [...catSet];
          }

          await ImportBatch.findOneAndUpdate(
            { jobId },
            {
              status: 'completed',
              completedAt: new Date(),
              results: {
                created: results.created?.length || 0,
                updated: results.updated?.length || 0,
                merged:  results.merged?.length || 0,
                skipped: results.skipped?.length || 0,
                errors:  results.errors?.length || 0,
                errorDetails: results.errors?.slice(0, 200) || [],
              },
              createdProductIds: type === 'products' ? createdIds : [],
              categories: categoryNames,
            }
          );
        } catch (dbErr) {
          console.error('[ImportBatch] Failed to update batch record:', dbErr.message);
        }

        // Clean up temp file
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}

      } catch (error) {
        console.error(`[Import] Job ${jobId} failed:`, error);
        this._failJob(jobId, error);

        // Mark batch as failed
        ImportBatch.findOneAndUpdate({ jobId }, { status: 'failed', errorMessage: error.message, completedAt: new Date() })
          .catch(() => {});

        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
      }
    })();

    return jobId;
  }

  // ─── Import Categories ────────────────────────────────────────

  async importCategories(filePath, options = {}) {
    const { duplicateResolution = {}, updateExisting = false } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };
    const rows = await this.readCSVStream(filePath);

    this.emit('progress', { phase: 'import', current: 0, total: rows.length, type: 'categories' });

    for (let i = 0; i < rows.length; i++) {
      const { rowNumber, data: row } = rows[i];
      try {
        const duplicate = await this.checkDuplicate(row, 'categories');
        const resolution = duplicateResolution[rowNumber];

        if (duplicate) {
          const effectiveResolution = updateExisting ? 'update' : (resolution || null);
          if (effectiveResolution === 'ignore' || !effectiveResolution) {
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
          if (effectiveResolution === 'update') {
            await Category.findByIdAndUpdate(duplicate._id, categoryData);
            results.updated.push({ row: rowNumber, name: categoryData.name, id: duplicate._id.toString() });
          } else if (effectiveResolution === 'merge') {
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
    const { duplicateResolution = {}, updateExisting = false } = options;
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
          const effectiveResolution = updateExisting ? 'update' : (resolution || null);
          if (effectiveResolution === 'ignore' || !effectiveResolution) {
            results.skipped.push({ row: rowNumber, email, reason: 'Duplicate' });
            continue;
          }
          const customerData = {
            email,
            firstName,
            lastName,
            phone: row.Phone || row.phone || row.billing_phone || '',
          };
          if (effectiveResolution === 'update') {
            await User.findByIdAndUpdate(duplicate._id, customerData);
            results.updated.push({ row: rowNumber, email, id: duplicate._id.toString() });
          } else if (effectiveResolution === 'merge') {
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
    const { duplicateResolution = {}, updateExisting = false } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };
    const rows = await this.readCSVStream(filePath);

    this.emit('progress', { phase: 'import', current: 0, total: rows.length, type: 'orders' });

    for (let i = 0; i < rows.length; i++) {
      const { rowNumber, data: row } = rows[i];
      try {
        const duplicate = await this.checkDuplicate(row, 'orders');
        const resolution = duplicateResolution[rowNumber];

        if (duplicate) {
          const effectiveResolution = updateExisting ? 'update' : (resolution || null);
          if (effectiveResolution === 'ignore' || !effectiveResolution) {
            results.skipped.push({ row: rowNumber, orderNumber: row.order_number || row['Order Number'], reason: 'Duplicate' });
            continue;
          }
          // For orders, update is the only sensible resolution
          if (effectiveResolution === 'update' || effectiveResolution === 'merge') {
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
      subtotal: parsePriceString(row.order_subtotal || row.subtotal || row['Order Subtotal'] || 0),
      tax: parsePriceString(row.order_tax || row.tax || row['Order Tax'] || 0),
      shipping: parsePriceString(row.order_shipping || row.shipping || row['Shipping Total'] || 0),
      discount: parsePriceString(row.discount_total || row.discount || row['Discount Total'] || 0),
      total: parsePriceString(row.order_total || row.total || row['Order Total'] || 0),
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
