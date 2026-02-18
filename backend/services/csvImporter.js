const csv = require('csv-parser');
const fs = require('fs');
const { createObjectCsvWriter } = require('csv-writer');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const slugify = require('slugify');

class CSVImporter {
  constructor() {
    this.supportedTypes = ['products', 'categories', 'customers', 'orders'];
  }

  /**
   * Validate CSV file before import
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
                data: row, 
                existing: duplicate 
              });
            }

            // Validate row data
            const validation = this.validateRow(row, type);
            if (!validation.valid) {
              errors.push({
                row: totalRows,
                errors: validation.errors
              });
            }
          } catch (error) {
            errors.push({
              row: totalRows,
              error: error.message
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
   * Import products from CSV
   */
  async importProducts(filePath, options = {}) {
    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    return new Promise((resolve, reject) => {
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          rowNumber++;

          try {
            const existing = await Product.findOne({ sku: row.SKU || row.sku });

            if (existing && !options.allowDuplicates && !options.updateExisting) {
              results.skipped.push({
                row: rowNumber,
                sku: row.SKU || row.sku,
                reason: 'Duplicate SKU'
              });
              return;
            }

            const productData = await this.mapProductData(row);

            if (existing && options.updateExisting) {
              await Product.findByIdAndUpdate(existing._id, productData);
              results.updated.push({ 
                row: rowNumber, 
                sku: productData.sku,
                id: existing._id 
              });
            } else {
              const product = await Product.create(productData);
              results.created.push({ 
                row: rowNumber, 
                sku: productData.sku,
                id: product._id 
              });
            }
          } catch (error) {
            results.errors.push({ 
              row: rowNumber, 
              error: error.message,
              data: row
            });
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', reject);
    });
  }

  /**
   * Import categories from CSV
   */
  async importCategories(filePath, options = {}) {
    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    return new Promise((resolve, reject) => {
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          rowNumber++;

          try {
            const slug = slugify(row.Name || row.name, { lower: true, strict: true });
            const existing = await Category.findOne({ slug });

            if (existing && !options.allowDuplicates && !options.updateExisting) {
              results.skipped.push({
                row: rowNumber,
                name: row.Name || row.name,
                reason: 'Duplicate category'
              });
              return;
            }

            const categoryData = await this.mapCategoryData(row);

            if (existing && options.updateExisting) {
              await Category.findByIdAndUpdate(existing._id, categoryData);
              results.updated.push({ 
                row: rowNumber, 
                name: categoryData.name,
                id: existing._id 
              });
            } else {
              const category = await Category.create(categoryData);
              results.created.push({ 
                row: rowNumber, 
                name: categoryData.name,
                id: category._id 
              });
            }
          } catch (error) {
            results.errors.push({ 
              row: rowNumber, 
              error: error.message,
              data: row 
            });
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', reject);
    });
  }

  /**
   * Import customers from CSV
   */
  async importCustomers(filePath, options = {}) {
    const results = {
      created: [],
      updated: [],
      skipped: [],
      errors: []
    };

    return new Promise((resolve, reject) => {
      let rowNumber = 0;

      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', async (row) => {
          rowNumber++;

          try {
            const email = (row.Email || row.email || '').toLowerCase();
            const existing = await User.findOne({ email });

            if (existing && !options.allowDuplicates && !options.updateExisting) {
              results.skipped.push({
                row: rowNumber,
                email,
                reason: 'Duplicate email'
              });
              return;
            }

            const customerData = await this.mapCustomerData(row);

            if (existing && options.updateExisting) {
              await User.findByIdAndUpdate(existing._id, customerData);
              results.updated.push({ 
                row: rowNumber, 
                email,
                id: existing._id 
              });
            } else {
              const customer = await User.create(customerData);
              results.created.push({ 
                row: rowNumber, 
                email,
                id: customer._id 
              });
            }
          } catch (error) {
            results.errors.push({ 
              row: rowNumber, 
              error: error.message,
              data: row 
            });
          }
        })
        .on('end', () => {
          resolve(results);
        })
        .on('error', reject);
    });
  }

  /**
   * Export products to CSV
   */
  async exportProducts(outputPath, filters = {}) {
    const products = await Product.find(filters).populate('categories').lean();
    
    const csvWriter = createObjectCsvWriter({
      path: outputPath,
      header: [
        { id: 'sku', title: 'SKU' },
        { id: 'name', title: 'Name' },
        { id: 'description', title: 'Description' },
        { id: 'basePrice', title: 'Price' },
        { id: 'salePrice', title: 'Sale Price' },
        { id: 'stockQuantity', title: 'Stock' },
        { id: 'stockStatus', title: 'Stock Status' },
        { id: 'categories', title: 'Categories' },
        { id: 'tags', title: 'Tags' },
        { id: 'weight', title: 'Weight' }
      ]
    });

    const records = products.map(p => ({
      sku: p.sku,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      salePrice: p.salePrice || '',
      stockQuantity: p.stockQuantity,
      stockStatus: p.stockStatus,
      categories: p.categories.map(c => c.name).join('|'),
      tags: (p.tags || []).join('|'),
      weight: p.weight || ''
    }));

    await csvWriter.writeRecords(records);
    
    return {
      success: true,
      path: outputPath,
      count: records.length
    };
  }

  /**
   * Map WooCommerce product data to our schema
   */
  async mapProductData(row) {
    // Handle categories
    let categoryIds = [];
    if (row.Categories || row.categories) {
      const categoryNames = (row.Categories || row.categories).split('|');
      for (const name of categoryNames) {
        let category = await Category.findOne({ name: name.trim() });
        if (!category) {
          category = await Category.create({ 
            name: name.trim(),
            slug: slugify(name.trim(), { lower: true, strict: true })
          });
        }
        categoryIds.push(category._id);
      }
    }

    return {
      sku: (row.SKU || row.sku || '').toUpperCase(),
      name: row.Name || row.post_title || row.name,
      description: row.Description || row.post_content || row.description || '',
      shortDescription: row['Short description'] || row.post_excerpt || row.short_description || '',
      basePrice: parseFloat(row['Regular price'] || row.regular_price || row.price || 0),
      salePrice: parseFloat(row['Sale price'] || row.sale_price || 0) || undefined,
      stockQuantity: parseInt(row.Stock || row.stock_quantity || row.stock || 0),
      stockStatus: (row['In stock?'] === '1' || row.stock_status === 'instock') ? 'in_stock' : 'out_of_stock',
      categories: categoryIds,
      tags: row.Tags ? row.Tags.split('|').map(t => t.trim()) : [],
      weight: parseFloat(row.Weight || row.weight || 0) || undefined,
      type: row.Type || row.type || 'simple',
      status: row.Published === '1' ? 'published' : 'draft'
    };
  }

  /**
   * Map category data
   */
  async mapCategoryData(row) {
    let parentId = null;
    
    if (row.Parent || row.parent) {
      const parent = await Category.findOne({ name: row.Parent || row.parent });
      if (parent) {
        parentId = parent._id;
      }
    }

    return {
      name: row.Name || row.name,
      slug: slugify(row.Name || row.name, { lower: true, strict: true }),
      description: row.Description || row.description || '',
      parent: parentId,
      displayOrder: parseInt(row['Display Order'] || row.display_order || 0)
    };
  }

  /**
   * Map customer data
   */
  async mapCustomerData(row) {
    return {
      email: (row.Email || row.email).toLowerCase(),
      firstName: row['First Name'] || row.first_name || '',
      lastName: row['Last Name'] || row.last_name || '',
      phone: row.Phone || row.phone || '',
      role: 'customer',
      password: row.Password || row.password || 'ChangeMePassword123!',
      customerGroup: row['Customer Group'] || row.customer_group || 'retail'
    };
  }

  /**
   * Check for duplicate
   */
  async checkDuplicate(row, type) {
    switch (type) {
      case 'products':
        return await Product.findOne({ sku: row.SKU || row.sku });
      case 'categories':
        const slug = slugify(row.Name || row.name, { lower: true, strict: true });
        return await Category.findOne({ slug });
      case 'customers':
        return await User.findOne({ email: (row.Email || row.email).toLowerCase() });
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
        if (!row.SKU && !row.sku) errors.push('SKU is required');
        if (!row.Name && !row.name) errors.push('Name is required');
        if (!row['Regular price'] && !row.regular_price && !row.price) {
          errors.push('Price is required');
        }
        break;
      case 'categories':
        if (!row.Name && !row.name) errors.push('Name is required');
        break;
      case 'customers':
        if (!row.Email && !row.email) errors.push('Email is required');
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = new CSVImporter();
