const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const https = require('https');
const http = require('http');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
// Tags are stored as arrays in Product model, no separate Tag model
const slugify = require('slugify');
const imageProcessor = require('./imageProcessor');
const fsPromises = require('fs').promises;

class WooCommerceImporter {
  constructor() {
    this.supportedTypes = ['products', 'categories', 'customers', 'orders', 'tags'];
    this.tempImageDir = path.join(__dirname, '../uploads/temp/images');
    this.processedImageDir = path.join(__dirname, '../uploads/products');
    
    // Ensure directories exist
    [this.tempImageDir, this.processedImageDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Parse WooCommerce image format: "url ! alt : alt_text ! title : title_text ! desc : desc_text ! caption : caption_text"
   */
  parseWooCommerceImages(imagesString) {
    if (!imagesString || !imagesString.trim()) return [];
    
    const images = [];
    // WooCommerce CSV separates multiple images with pipe (|)
    // Format: url ! alt : text ! title : text ! desc : text ! caption : text | url2 ! ...
    const parts = imagesString.split('|').map(p => p.trim());
    
    for (const part of parts) {
      const imageData = {
        url: '',
        alt: '',
        title: '',
        description: '',
        caption: ''
      };
      
      // Parse the format: url ! alt : alt_text ! title : title_text
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
      
      if (imageData.url) {
        images.push(imageData);
      }
    }
    
    return images;
  }

  /**
   * Download image from URL
   */
  async downloadImage(imageUrl, filename) {
    try {
      const protocol = imageUrl.startsWith('https') ? https : http;
      const tempPath = path.join(this.tempImageDir, filename);
      
      return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(tempPath);
        
        protocol.get(imageUrl, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            // Handle redirects
            return this.downloadImage(response.headers.location, filename)
              .then(resolve)
              .catch(reject);
          }
          
          if (response.statusCode !== 200) {
            fs.unlinkSync(tempPath);
            return reject(new Error(`Failed to download image: ${response.statusCode}`));
          }
          
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            resolve(tempPath);
          });
        }).on('error', (err) => {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          reject(err);
        });
      });
    } catch (error) {
      throw new Error(`Error downloading image: ${error.message}`);
    }
  }

  /**
   * Process image through Image Manager (resize + watermark) using current config
   */
  async processImage(imagePath, productSlug, index = 0) {
    try {
      // Get current image processor config
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
      
      // Process image with current settings
      await imageProcessor.processProductImage(imagePath, outputPath, options);
      
      // Clean up temp file
      try {
        if (fs.existsSync(imagePath)) {
          await fsPromises.unlink(imagePath);
        }
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      return `/uploads/products/${filename}`;
    } catch (error) {
      console.error('Error processing image:', error);
      // If processing fails, try to copy the original
      try {
        const ext = path.extname(imagePath);
        const filename = `${productSlug}-${index}-${Date.now()}.${ext}`;
        const outputPath = path.join(this.processedImageDir, filename);
        fs.copyFileSync(imagePath, outputPath);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
        return `/uploads/products/${filename}`;
      } catch (copyError) {
        throw new Error(`Failed to process or copy image: ${error.message}`);
      }
    }
  }

  /**
   * Download and process all images for a product
   */
  async processProductImages(imageDataArray, productSlug) {
    const processedImages = [];
    
    for (let i = 0; i < imageDataArray.length; i++) {
      const imageData = imageDataArray[i];
      try {
        // Download image
        const filename = `temp-${Date.now()}-${i}-${path.basename(imageData.url)}`;
        const tempPath = await this.downloadImage(imageData.url, filename);
        
        // Process image
        const processedUrl = await this.processImage(tempPath, productSlug, i);
        processedImages.push(processedUrl);
      } catch (error) {
        // Continue with other images
        console.error(`Failed to process image ${i + 1} for ${productSlug}:`, error.message);
      }
    }
    
    return processedImages;
  }

  /**
   * Validate CSV and detect duplicates
   */
  async validateImport(filePath, type) {
    if (!this.supportedTypes.includes(type)) {
      throw new Error(`Unsupported import type: ${type}`);
    }

    const duplicates = [];
    const errors = [];
    let totalRows = 0;

    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          totalRows++;
          stream.pause();

          try {
            const duplicate = await this.checkDuplicate(row, type);
            if (duplicate) {
              duplicates.push({ 
                row: totalRows, 
                data: this.extractKeyFields(row, type), 
                existing: this.extractKeyFields(duplicate, type),
                existingId: duplicate._id.toString()
              });
            }

            // Validate row data
            const validation = this.validateRow(row, type);
            if (!validation.valid) {
              errors.push({
                row: totalRows,
                errors: validation.errors,
                data: this.extractKeyFields(row, type)
              });
            }
          } catch (error) {
            errors.push({
              row: totalRows,
              error: error.message,
              data: this.extractKeyFields(row, type)
            });
          }

          stream.resume();
        })
        .on('end', () => {
          resolve({ 
            totalRows, 
            duplicates: duplicates.length,
            duplicatesList: duplicates,
            errors: errors.length,
            errorsList: errors,
            valid: errors.length === 0
          });
        })
        .on('error', reject);
    });
  }

  /**
   * Extract key fields for duplicate comparison
   */
  extractKeyFields(item, type) {
    switch (type) {
      case 'products':
        if (item.toObject) item = item.toObject();
        return {
          sku: item.sku || item.SKU,
          name: item.name || item.post_title || item.Name,
          slug: item.slug || item.post_name
        };
      case 'categories':
        if (item.toObject) item = item.toObject();
        return {
          name: item.name || item.Name,
          slug: item.slug || slugify(item.name || item.Name, { lower: true, strict: true })
        };
      case 'customers':
        if (item.toObject) item = item.toObject();
        return {
          email: item.email || item.Email,
          firstName: item.firstName || item['First Name'] || item.first_name,
          lastName: item.lastName || item['Last Name'] || item.last_name
        };
      case 'tags':
        // Tags are strings, not objects
        return { name: item };
      default:
        return item;
    }
  }

  /**
   * Check for duplicate
   */
  async checkDuplicate(row, type) {
    switch (type) {
      case 'products':
        // Check by SKU first, then by slug, then by name
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
        
      case 'categories':
        const catName = row.Name || row.name;
        if (catName) {
          const slug = slugify(catName, { lower: true, strict: true });
          return await Category.findOne({ slug });
        }
        return null;
        
      case 'customers':
        const email = (row.Email || row.email || '').toLowerCase();
        if (email) {
          return await User.findOne({ email });
        }
        return null;
        
      case 'tags':
        // Tags are stored as strings in products, not as separate entities
        return null;
        
      default:
        return null;
    }
  }

  /**
   * Validate row data
   */
  validateRow(row, type) {
    const errors = [];

    switch (type) {
      case 'products':
        if (!row.post_title && !row.Name && !row.name) {
          errors.push('Product name is required');
        }
        if (!row.regular_price && !row['Regular price'] && !row.price) {
          errors.push('Price is required');
        }
        break;
      case 'categories':
        if (!row.Name && !row.name) {
          errors.push('Category name is required');
        }
        break;
      case 'customers':
        if (!row.Email && !row.email) {
          errors.push('Email is required');
        }
        break;
      case 'tags':
        if (!row.Name && !row.name) {
          errors.push('Tag name is required');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Map WooCommerce product data to our schema
   */
  async mapProductData(row, options = {}) {
    // Handle categories from tax:product_cat
    let categoryIds = [];
    const categoryString = row['tax:product_cat'] || row.Categories || row.categories;
    if (categoryString) {
      const categoryNames = categoryString.split(',').map(c => c.trim()).filter(c => c);
      for (const name of categoryNames) {
        let category = await Category.findOne({ 
          $or: [
            { name: name },
            { slug: slugify(name, { lower: true, strict: true }) }
          ]
        });
        if (!category) {
          category = await Category.create({ 
            name: name.trim(),
            slug: slugify(name.trim(), { lower: true, strict: true })
          });
        }
        categoryIds.push(category._id);
      }
    }

    // Handle tags from tax:product_tag
    let tags = [];
    const tagString = row['tax:product_tag'] || row.Tags || row.tags;
    if (tagString) {
      tags = tagString.split(',').map(t => t.trim()).filter(t => t);
    }

    // Generate slug if not provided
    const slug = row.post_name || slugify(row.post_title || row.Name || row.name, { 
      lower: true, 
      strict: true 
    });

    // Generate SKU if not provided
    let sku = row.sku || row.SKU;
    if (!sku) {
      sku = `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`.toUpperCase();
    } else {
      sku = sku.toUpperCase();
    }

    // Imported regular price is the cost price, so it goes to backendPrice
    // regularPrice will be set later after markup
    const regularPriceValue = row.regular_price || row["Regular price"] || row.price || 0;
    const backendPriceValue = parseFloat(regularPriceValue);

    const productData = {
      name: row.post_title || row.Name || row.name,
      slug: slug,
      sku: sku,
      description: row.post_content || row.Description || row.description || '',
      shortDescription: row.post_excerpt || row['Short description'] || row.short_description || '',
      regularPrice: 0, // Will be set after markup
      salePrice: row.sale_price || row['Sale price'] ? parseFloat(row.sale_price || row['Sale price']) : undefined,
      backendPrice: isNaN(backendPriceValue) ? 0 : backendPriceValue, // Cost price from import
      stock: parseInt(row.stock || row.Stock || row.stock_quantity || 0),
      stockStatus: (row.stock_status === 'instock' || row['In stock?'] === '1') ? 'in_stock' : 'out_of_stock',
      categories: categoryIds,
      tags: tags,
      weight: row.weight || row.Weight ? parseFloat(row.weight || row.Weight) : undefined,
      length: row.length || row.Length ? parseFloat(row.length || row.Length) : undefined,
      width: row.width || row.Width ? parseFloat(row.width || row.Width) : undefined,
      height: row.height || row.Height ? parseFloat(row.height || row.Height) : undefined,
      productType: (row.Type === 'variable' || row.type === 'variable') ? 'variable' : 'simple',
      isActive: row.post_status === 'publish' || row.Published === '1' || row.status === 'published',
      isFeatured: row.featured === '1' || row.Featured === '1' || false
    };

    // Process images if provided and processImages option is true
    if (options.processImages && row.images) {
      try {
        const imageDataArray = this.parseWooCommerceImages(row.images);
        if (imageDataArray.length > 0) {
          const imageProcessingType = options.imageProcessingType || 'all';
          
          // Always process ALL images to ensure watermark is applied
          // First image becomes featured, all images (including first) go to gallery array
          const processedImages = await this.processProductImages(imageDataArray, slug);
          
          if (processedImages.length > 0) {
            // First image is featured, all images go to gallery
            productData.featuredImage = processedImages[0];
            productData.images = processedImages; // All images including featured
          } else {
            // Fallback if processing fails - use original URLs
            productData.featuredImage = imageDataArray[0].url;
            productData.images = imageDataArray.map(img => img.url);
          }
        }
      } catch (error) {
        console.error('Error processing images:', error);
        // Continue without images if processing fails
        const imageDataArray = this.parseWooCommerceImages(row.images);
        if (imageDataArray.length > 0) {
          productData.featuredImage = imageDataArray[0].url;
          productData.images = imageDataArray.map(img => img.url);
        }
      }
    } else if (row.images) {
      // Just parse URLs without processing
      const imageDataArray = this.parseWooCommerceImages(row.images);
      if (imageDataArray.length > 0) {
        productData.featuredImage = imageDataArray[0].url;
        productData.images = imageDataArray.map(img => img.url);
      }
    }

    return productData;
  }

  /**
   * Import products with duplicate resolution
   */
  async importProducts(filePath, options = {}) {
    const {
      processImages = true,
      duplicateResolution = {} // { rowIndex: 'merge' | 'update' | 'ignore' }
    } = options;

    const results = {
      created: [],
      updated: [],
      merged: [],
      skipped: [],
      errors: []
    };

    return new Promise((resolve, reject) => {
      let rowNumber = 0;
      const rows = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push({ rowNumber: ++rowNumber, data: row });
        })
        .on('end', async () => {
          for (const { rowNumber, data: row } of rows) {
            try {
              const duplicate = await this.checkDuplicate(row, 'products');
              const resolution = duplicateResolution[rowNumber];

              if (duplicate) {
                if (resolution === 'ignore') {
                  results.skipped.push({
                    row: rowNumber,
                    sku: row.sku || row.SKU,
                    name: row.post_title || row.Name,
                    reason: 'Duplicate - ignored'
                  });
                  continue;
                }

                if (resolution === 'merge') {
                  // Merge: combine data from both
                  const existingData = duplicate.toObject();
                  const newData = await this.mapProductData(row, { processImages });
                  
                  // Merge arrays (categories, tags, images)
                  const mergedData = {
                    ...existingData,
                    ...newData,
                    categories: [...new Set([...existingData.categories, ...newData.categories])],
                    tags: [...new Set([...existingData.tags || [], ...newData.tags || []])],
                    images: [...new Set([...existingData.images || [], ...newData.images || []])]
                  };
                  
                  // Keep existing featured image if new one is not better
                  if (!newData.featuredImage && existingData.featuredImage) {
                    mergedData.featuredImage = existingData.featuredImage;
                  }
                  
                  await Product.findByIdAndUpdate(duplicate._id, mergedData);
                  results.merged.push({
                    row: rowNumber,
                    sku: mergedData.sku,
                    id: duplicate._id.toString()
                  });
                  continue;
                }

                if (resolution === 'update') {
                  // Update: replace existing with new data
                  const productData = await this.mapProductData(row, { processImages });
                  await Product.findByIdAndUpdate(duplicate._id, productData);
                  results.updated.push({
                    row: rowNumber,
                    sku: productData.sku,
                    id: duplicate._id.toString()
                  });
                  continue;
                }

                // No resolution specified - skip
                results.skipped.push({
                  row: rowNumber,
                  sku: row.sku || row.SKU,
                  name: row.post_title || row.Name,
                  reason: 'Duplicate - no resolution specified'
                });
                continue;
              }

              // No duplicate - create new
              const productData = await this.mapProductData(row, { processImages });
              const product = await Product.create(productData);
              results.created.push({
                row: rowNumber,
                sku: productData.sku,
                id: product._id.toString()
              });
            } catch (error) {
              results.errors.push({
                row: rowNumber,
                error: error.message,
                data: this.extractKeyFields(row, 'products')
              });
            }
          }

          // Ensure results are properly formatted with correct counts
          const finalResults = {
            created: results.created || [],
            updated: results.updated || [],
            merged: results.merged || [],
            skipped: results.skipped || [],
            errors: results.errors || []
          };
          resolve(finalResults);
        })
        .on('error', reject);
    });
  }

  /**
   * Import categories
   */
  async importCategories(filePath, options = {}) {
    const { duplicateResolution = {} } = options;
    const results = { created: [], updated: [], merged: [], skipped: [], errors: [] };

    return new Promise((resolve, reject) => {
      let rowNumber = 0;
      const rows = [];

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          rows.push({ rowNumber: ++rowNumber, data: row });
        })
        .on('end', async () => {
          for (const { rowNumber, data: row } of rows) {
            try {
              const duplicate = await this.checkDuplicate(row, 'categories');
              const resolution = duplicateResolution[rowNumber];

              if (duplicate) {
                if (resolution === 'ignore') {
                  results.skipped.push({ row: rowNumber, name: row.Name || row.name, reason: 'Duplicate - ignored' });
                  continue;
                }

                const categoryData = {
                  name: row.Name || row.name,
                  slug: slugify(row.Name || row.name, { lower: true, strict: true }),
                  description: row.Description || row.description || '',
                  parent: null // Handle parent categories if needed
                };

                if (resolution === 'update') {
                  await Category.findByIdAndUpdate(duplicate._id, categoryData);
                  results.updated.push({ row: rowNumber, name: categoryData.name, id: duplicate._id.toString() });
                } else if (resolution === 'merge') {
                  const existing = duplicate.toObject();
                  const merged = { ...existing, ...categoryData, description: existing.description || categoryData.description };
                  await Category.findByIdAndUpdate(duplicate._id, merged);
                  results.merged.push({ row: rowNumber, name: merged.name, id: duplicate._id.toString() });
                } else {
                  results.skipped.push({ row: rowNumber, name: row.Name || row.name, reason: 'Duplicate - no resolution' });
                }
                continue;
              }

              const category = await Category.create(categoryData);
              results.created.push({ row: rowNumber, name: categoryData.name, id: category._id.toString() });
            } catch (error) {
              results.errors.push({ row: rowNumber, error: error.message, data: this.extractKeyFields(row, 'categories') });
            }
          }
          resolve(results);
        })
        .on('error', reject);
    });
  }
}

module.exports = new WooCommerceImporter();
