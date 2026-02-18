const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');

const upload = multer({ dest: 'uploads/temp/' });

/**
 * @route   POST /api/woocommerce-import/products
 * @desc    Import products from WooCommerce CSV
 * @access  Private/Admin
 */
router.post('/products', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a CSV file'
      });
    }
    
    const results = [];
    const duplicates = [];
    const errors = [];
    
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => {
        results.push(row);
      })
      .on('end', async () => {
        let imported = 0;
        
        for (const row of results) {
          try {
            // Check for duplicates by SKU
            const existingProduct = await Product.findOne({ sku: row.SKU });
            
            if (existingProduct) {
              duplicates.push({
                sku: row.SKU,
                name: row.Name,
                existingId: existingProduct._id
              });
              continue;
            }
            
            // Find or create categories
            const categoryNames = row.Categories ? row.Categories.split(',').map(c => c.trim()) : [];
            const categoryIds = [];
            
            for (const catName of categoryNames) {
              let category = await Category.findOne({ name: catName });
              if (!category) {
                category = await Category.create({
                  name: catName,
                  slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                });
              }
              categoryIds.push(category._id);
            }
            
            // Parse attributes for variations
            const attributes = {};
            const variations = [];
            
            if (row.Type === 'variable') {
              // Handle variable products
              // Parse attribute columns
              Object.keys(row).forEach(key => {
                if (key.startsWith('Attribute ')) {
                  const attrName = key.replace('Attribute ', '').split(':')[0];
                  const attrValues = row[key].split(',').map(v => v.trim());
                  attributes[attrName] = attrValues;
                }
              });
            }
            
            // Create product
            const productData = {
              name: row.Name,
              description: row.Description || '',
              shortDescription: row['Short description'] || '',
              regularPrice: parseFloat(row['Regular price']) || 0,
              salePrice: row['Sale price'] ? parseFloat(row['Sale price']) : null,
              categories: categoryIds,
              stock: parseInt(row['Stock']) || 0,
              sku: row.SKU,
              weight: row.Weight ? parseFloat(row.Weight) : null,
              productType: row.Type === 'variable' ? 'variable' : 'simple',
              attributes: attributes,
              isActive: row.Published === '1',
              isFeatured: row.Featured === '1',
              tags: row.Tags ? row.Tags.split(',').map(t => t.trim()) : []
            };
            
            // Handle images
            if (row.Images) {
              const imageUrls = row.Images.split(',').map(url => url.trim());
              productData.featuredImage = imageUrls[0];
              productData.images = imageUrls;
            }
            
            await Product.create(productData);
            imported++;
            
          } catch (error) {
            errors.push({
              row: row.Name || row.SKU,
              error: error.message
            });
          }
        }
        
        // Clean up temp file
        fs.unlinkSync(req.file.path);
        
        res.json({
          success: true,
          message: `Import completed: ${imported} products imported`,
          data: {
            imported,
            duplicates: duplicates.length,
            errors: errors.length,
            duplicatesList: duplicates,
            errorsList: errors
          }
        });
      });
      
  } catch (error) {
    console.error('Error importing products:', error);
    
    // Clean up temp file
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Error importing products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/woocommerce-import/sample
 * @desc    Download sample WooCommerce CSV format
 * @access  Private/Admin
 */
router.get('/sample', protect, authorize('admin'), (req, res) => {
  const sampleCSV = `ID,Type,SKU,Name,Published,Featured,Categories,Tags,Short description,Description,Regular price,Sale price,Stock,Weight,Length,Width,Height,Images,Attribute 1 name,Attribute 1 value(s)
,simple,PS-001,Sample Product,1,0,Electronics,new arrival,This is a short description,This is a long description with features and benefits,99.99,,100,1.5,,,,"https://example.com/image1.jpg,https://example.com/image2.jpg",,
,variable,PS-002,Variable Product,1,1,Clothing,sale,Short description here,Long description here,199.99,149.99,50,0.5,,,,"https://example.com/image.jpg",Size,"Small,Medium,Large"`;
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=woocommerce-import-sample.csv');
  res.send(sampleCSV);
});

module.exports = router;
