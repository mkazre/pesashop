const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { protect, authorize, optionalAuth } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');

// Configure multer for image uploads (store in memory for processing)
const storage = multer.memoryStorage();

// Fast image optimization function
async function optimizeImage(buffer, outputPath) {
  try {
    const metadata = await sharp(buffer).metadata();
    const maxWidth = 1200;
    const maxHeight = 1200;
    
    let pipeline = sharp(buffer);
    
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      pipeline = pipeline.resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      });
    }
    
    await pipeline
      .webp({ quality: 85, effort: 4 })
      .toFile(outputPath);
    
    return true;
  } catch (error) {
    console.error('Image optimization error:', error);
    fs.writeFileSync(outputPath, buffer);
    return false;
  }
}

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

/**
 * @route   POST /api/products/upload-image
 * @desc    Upload and optimize a single product image
 * @access  Private/Admin
 */
router.post('/upload-image', protect, authorize('admin', 'manager'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const uploadPath = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filename = 'product-' + Date.now() + '-' + Math.round(Math.random() * 1E9) + '.webp';
    const filepath = path.join(uploadPath, filename);

    await optimizeImage(req.file.buffer, filepath);

    const imageUrl = '/uploads/products/' + filename;

    res.json({
      success: true,
      url: imageUrl,
      filename: filename
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Get all products with filtering, sorting, pagination
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user && ['admin', 'manager'].includes(req.user.role);
    let query = {};
    
    if (req.query.search) {
      if (req.query.search.length >= 3) {
        query.$text = { $search: req.query.search };
      } else {
        // Fallback to regex for short queries (1-2 chars)
        query.name = { $regex: req.query.search, $options: 'i' };
      }
    }
    
    // Status filter - show all non-trash products by default
    // Note: $text and $or cannot coexist at the top level in MongoDB,
    // so when searching use a simple $ne filter instead of $or.
    if (req.query.status) {
      query.status = req.query.status;
    } else if (query.$text) {
      query.status = { $ne: 'trash' };
    } else {
      query.$or = [
        { status: { $exists: false } },
        { status: { $ne: 'trash' } },
        { status: null }
      ];
    }
    
    if (req.query.category) {
      query.categories = req.query.category;
    }

    // Support plural categories param (array or comma-separated)
    if (req.query.categories) {
      const cats = Array.isArray(req.query.categories)
        ? req.query.categories
        : req.query.categories.split(',').map(c => c.trim());
      if (cats.length === 1) {
        query.categories = cats[0];
      } else if (cats.length > 1) {
        query.categories = { $in: cats };
      }
    }
    
    if (req.query.featured === 'true') {
      query.isFeatured = true;
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }
    
    if (req.query.minPrice || req.query.maxPrice) {
      query.regularPrice = {};
      if (req.query.minPrice) query.regularPrice.$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) query.regularPrice.$lte = Number(req.query.maxPrice);
    }
    
    let sortBy = '-createdAt';
    if (req.query.sort) {
      const sortMap = {
        'price-asc': 'regularPrice',
        'price-desc': '-regularPrice',
        'name-asc': 'name',
        'name-desc': '-name',
        'date-desc': '-createdAt',
        'date-asc': 'createdAt',
        'rating-desc': '-rating'
      };
      sortBy = sortMap[req.query.sort] || sortBy;
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    const productQuery = Product.find(query);
    if (!isAdmin) productQuery.select('-backendPrice');
    const products = await productQuery
      .populate('categories', 'name slug')
      .sort(sortBy)
      .limit(limit)
      .skip(skip);
    
    const total = await Product.countDocuments(query);
    
    res.json({
      success: true,
      count: products.length,
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/filters
 * @desc    Get available filter options (categories, price range, brands, attributes)
 * @access  Public
 */
router.get('/filters', async (req, res) => {
  try {
    const activeQuery = {
      $or: [
        { status: { $exists: false } },
        { status: { $ne: 'trash' } },
        { status: null }
      ]
    };

    // Categories with product counts
    const categoryAgg = await Product.aggregate([
      { $match: activeQuery },
      { $unwind: { path: '$categories', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$categories', count: { $sum: 1 } } }
    ]);
    const categoryIds = categoryAgg.map(c => c._id);
    const categoryDocs = await Category.find({ _id: { $in: categoryIds } }, 'name slug');
    const categoryMap = {};
    categoryDocs.forEach(c => { categoryMap[c._id.toString()] = c; });
    const categories = categoryAgg
      .filter(c => categoryMap[c._id.toString()])
      .map(c => ({
        _id: c._id,
        name: categoryMap[c._id.toString()].name,
        slug: categoryMap[c._id.toString()].slug,
        count: c.count
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    // Price range
    const priceAgg = await Product.aggregate([
      { $match: { ...activeQuery, regularPrice: { $gt: 0 } } },
      { $group: { _id: null, min: { $min: '$regularPrice' }, max: { $max: '$regularPrice' } } }
    ]);
    const priceRange = priceAgg.length > 0
      ? { min: Math.floor(priceAgg[0].min), max: Math.ceil(priceAgg[0].max) }
      : { min: 0, max: 0 };

    // Brands
    const brandAgg = await Product.aggregate([
      { $match: { ...activeQuery, brand: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const brands = brandAgg.map(b => ({ name: b._id, count: b.count }));

    // Attributes (sizes, colors, etc.) from the attributes Map field
    const attrProducts = await Product.find(
      { ...activeQuery, attributes: { $exists: true } },
      'attributes'
    ).lean();

    const attrMap = {};
    attrProducts.forEach(p => {
      if (p.attributes && typeof p.attributes === 'object') {
        const attrs = p.attributes instanceof Map ? Object.fromEntries(p.attributes) : p.attributes;
        Object.entries(attrs).forEach(([key, values]) => {
          if (!attrMap[key]) attrMap[key] = new Set();
          const arr = Array.isArray(values) ? values : [values];
          arr.forEach(v => { if (v) attrMap[key].add(v); });
        });
      }
    });

    const sizes = attrMap.size ? [...attrMap.size].sort() : [];
    const colors = attrMap.color ? [...attrMap.color].sort() : [];

    // Build customFilters from remaining attributes
    const customFilters = {};
    Object.entries(attrMap).forEach(([key, valSet]) => {
      const lk = key.toLowerCase();
      if (lk !== 'size' && lk !== 'color') {
        customFilters[key] = [...valSet].sort();
      }
    });

    res.json({
      success: true,
      data: {
        categories,
        priceRange,
        brands,
        sizes,
        colors,
        customFilters
      }
    });
  } catch (error) {
    console.error('Error fetching filters:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product filters',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get single product by ID or slug
 * @access  Public
 */
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const isAdmin = req.user && ['admin', 'manager'].includes(req.user.role);
    let product;
    
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      const q = Product.findById(req.params.id);
      if (!isAdmin) q.select('-backendPrice');
      product = await q.populate('categories', 'name slug');
    } else {
      const q = Product.findOne({ slug: req.params.id });
      if (!isAdmin) q.select('-backendPrice');
      product = await q.populate('categories', 'name slug');
    }
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create new product
 * @access  Private/Admin
 */
router.post('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const productData = req.body;
    
    // Ensure images is an array
    if (productData.images && !Array.isArray(productData.images)) {
      productData.images = [];
    }
    
    // Set featured image from images array if not set
    if (!productData.featuredImage && productData.images && productData.images.length > 0) {
      productData.featuredImage = productData.images[0];
    }
    
    // Ensure featuredImage is in images array
    if (productData.featuredImage && productData.images && !productData.images.includes(productData.featuredImage)) {
      productData.images.unshift(productData.featuredImage);
    }
    
    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private/Admin
 */
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    const productData = req.body;
    
    // Don't allow SKU changes
    delete productData.sku;
    
    // Validate sale price
    const regularPrice = productData.regularPrice !== undefined ? productData.regularPrice : product.regularPrice;
    if (productData.salePrice && regularPrice && productData.salePrice >= regularPrice) {
      return res.status(400).json({
        success: false,
        message: `Sale price (${productData.salePrice}) must be less than regular price (${regularPrice})`
      });
    }
    
    if (productData.salePrice === '' || productData.salePrice === null) {
      productData.salePrice = undefined;
    }
    
    // Ensure images is an array
    if (productData.images !== undefined) {
      if (!Array.isArray(productData.images)) {
        productData.images = product.images || [];
      }
    } else {
      productData.images = product.images || [];
    }
    
    // Set featured image
    if (!productData.featuredImage && productData.images && productData.images.length > 0) {
      productData.featuredImage = productData.images[0];
    } else if (!productData.featuredImage) {
      productData.featuredImage = product.featuredImage;
    }
    
    // Ensure featuredImage is in images array
    if (productData.featuredImage && productData.images && !productData.images.includes(productData.featuredImage)) {
      productData.images.unshift(productData.featuredImage);
    }
    
    // Update all fields
    Object.keys(productData).forEach(key => {
      if (productData[key] !== undefined && key !== '_id' && key !== '__v') {
        product[key] = productData[key];
      }
    });
    
    // EXPLICITLY set images and featuredImage
    if (productData.images && Array.isArray(productData.images)) {
      product.images = productData.images;
    }
    if (productData.featuredImage && typeof productData.featuredImage === 'string') {
      product.featuredImage = productData.featuredImage;
    }
    
    await product.save();
    
    product = await Product.findById(req.params.id).populate('categories', 'name slug');

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/products/:id
 * @desc    Move product to trash
 * @access  Private/Admin
 */
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.status = 'trash';
    product.trashedAt = new Date();
    await product.save();
    
    res.json({
      success: true,
      message: 'Product moved to trash'
    });
  } catch (error) {
    console.error('Error trashing product:', error);
    res.status(500).json({
      success: false,
      message: 'Error trashing product',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/products/:id/restore
 * @desc    Restore product from trash
 * @access  Private/Admin
 */
router.post('/:id/restore', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    product.status = 'active';
    product.trashedAt = null;
    await product.save();
    
    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error restoring product:', error);
    res.status(500).json({
      success: false,
      message: 'Error restoring product',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/products/:id/permanent
 * @desc    Permanently delete product
 * @access  Private/Admin
 */
router.delete('/:id/permanent', protect, authorize('admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    if (product.featuredImage) {
      const imagePath = path.join(__dirname, '..', product.featuredImage);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    if (product.images && product.images.length > 0) {
      product.images.forEach(image => {
        const imagePath = path.join(__dirname, '..', image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    await product.deleteOne();
    
    res.json({
      success: true,
      message: 'Product permanently deleted'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/products/bulk-edit
 * @desc    Bulk edit products
 * @access  Private/Admin
 */
router.post('/bulk-edit', protect, authorize('admin'), async (req, res) => {
  try {
    const { productIds, updates } = req.body;
    
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products selected'
      });
    }
    
    delete updates.sku;
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: updates }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} products updated`,
      data: result
    });
  } catch (error) {
    console.error('Error bulk editing products:', error);
    res.status(400).json({
      success: false,
      message: 'Error bulk editing products',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/products/bulk-trash
 * @desc    Move multiple products to trash
 * @access  Private/Admin
 */
router.post('/bulk-trash', protect, authorize('admin'), async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!productIds || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No products selected'
      });
    }
    
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $set: { status: 'trash', trashedAt: new Date() } }
    );
    
    res.json({
      success: true,
      message: `${result.modifiedCount} products moved to trash`
    });
  } catch (error) {
    console.error('Error bulk trashing products:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk trashing products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/next-sku
 * @desc    Get next available SKU
 * @access  Private/Admin
 */
router.get('/next-sku', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const nextSKU = await Product.getNextSKU();
    
    res.json({
      success: true,
      sku: nextSKU
    });
  } catch (error) {
    console.error('Error getting next SKU:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting next SKU',
      error: error.message
    });
  }
});

module.exports = router;
