const express = require('express');
const router = express.Router();
const { protect, authorize, adminOnly } = require('../middleware/auth');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { translateCategoryFields } = require('../services/translationService');

/**
 * @route   GET /api/categories
 * @desc    Get all categories (with optional filters)
 * @access  Public
 */
router.get('/', async (req, res, next) => {
  try {
    const { parent, includeInactive, tree } = req.query;
    
    let query = {};
    if (parent === 'null' || parent === '') {
      query.parent = null;
    } else if (parent) {
      query.parent = parent;
    }
    
    if (includeInactive !== 'true') {
      query.isActive = true;
    }
    
    let categories;
    if (tree === 'true') {
      // Return as tree structure
      const allCategories = await Category.find(query)
        .sort({ displayOrder: 1, name: 1 })
        .lean();
      
      // Build tree
      const categoryMap = new Map();
      const rootCategories = [];
      
      allCategories.forEach(cat => {
        categoryMap.set(cat._id.toString(), { ...cat, children: [] });
      });
      
      allCategories.forEach(cat => {
        const category = categoryMap.get(cat._id.toString());
        if (cat.parent) {
          const parent = categoryMap.get(cat.parent.toString());
          if (parent) {
            parent.children.push(category);
          } else {
            rootCategories.push(category);
          }
        } else {
          rootCategories.push(category);
        }
      });
      
      categories = rootCategories;
    } else {
      categories = await Category.find(query)
        .populate('parent', 'name slug')
        .sort({ displayOrder: 1, name: 1 })
        .lean();
    }

    // Compute real product counts from the products collection
    const countAgg = await Product.aggregate([
      { $match: { status: { $ne: 'trashed' } } },
      { $unwind: '$categories' },
      { $group: { _id: '$categories', count: { $sum: 1 } } }
    ]);
    const countMap = {};
    countAgg.forEach(item => { countMap[item._id.toString()] = item.count; });

    // Attach counts to categories
    const attachCounts = (cats) => {
      for (const cat of cats) {
        cat.productCount = countMap[cat._id.toString()] || 0;
        if (cat.children) attachCounts(cat.children);
      }
    };
    attachCounts(Array.isArray(categories) ? categories : []);

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/categories/slug/:slug
 * @desc    Get single category by slug
 * @access  Public
 */
router.get('/slug/:slug', async (req, res, next) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug })
      .populate('parent', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Attach real product count
    category.productCount = await Product.countDocuments({ categories: category._id, status: { $ne: 'trashed' } });

    // Translate name/description/meta fields for non-English requests.
    const lang = req.query.lang;
    const data = lang && lang !== 'en'
      ? await translateCategoryFields(category, lang)
      : category;

    res.json({
      success: true,
      data
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/categories/:id
 * @desc    Get single category
 * @access  Public
 */
router.get('/:id', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('parent', 'name slug')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/categories
 * @desc    Create new category
 * @access  Private/Admin
 */
router.post('/', protect, adminOnly, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const categoryData = req.body;
    
    // Validate parent if provided
    if (categoryData.parent) {
      const parentExists = await Category.findById(categoryData.parent);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }
    
    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    next(error);
  }
});

/**
 * @route   PUT /api/categories/:id
 * @desc    Update category
 * @access  Private/Admin
 */
router.put('/:id', protect, adminOnly, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Prevent setting self as parent
    if (req.body.parent && req.body.parent === req.params.id) {
      return res.status(400).json({
        success: false,
        message: 'Category cannot be its own parent'
      });
    }
    
    // Validate parent if provided
    if (req.body.parent) {
      const parentExists = await Category.findById(req.body.parent);
      if (!parentExists) {
        return res.status(400).json({
          success: false,
          message: 'Parent category not found'
        });
      }
    }
    
    Object.keys(req.body).forEach(key => {
      if (req.body[key] !== undefined) {
        category[key] = req.body[key];
      }
    });
    
    await category.save();

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Category with this name or slug already exists'
      });
    }
    next(error);
  }
});

/**
 * @route   DELETE /api/categories/:id
 * @desc    Delete category
 * @access  Private/Admin
 */
router.delete('/:id', protect, adminOnly, authorize('admin'), async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Check if category has subcategories
    const subcategories = await Category.countDocuments({ parent: category._id });
    if (subcategories > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with subcategories. Please delete or move subcategories first.'
      });
    }
    
    // Check if category has products
    const productCount = await Product.countDocuments({ categories: category._id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${productCount} product(s) are using this category.`
      });
    }
    
    await category.deleteOne();

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/categories/:id/products
 * @desc    Get products in category
 * @access  Public
 */
router.get('/:id/products', async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const products = await Product.find({ categories: category._id, status: { $ne: 'trashed' } })
      .select('name sku regularPrice salePrice featuredImage status categories')
      .populate('categories', 'name slug')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/categories/:id/products/remove
 * @desc    Remove specific products from this category
 * @access  Private/Admin
 */
router.put('/:id/products/remove', protect, adminOnly, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'productIds array is required' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Pull this category from the products' categories array
    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $pull: { categories: category._id } }
    );

    res.json({
      success: true,
      message: `Removed ${result.modifiedCount} product(s) from category "${category.name}"`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/categories/:id/products/reassign
 * @desc    Move products from this category to another (removes from source, adds to target)
 * @access  Private/Admin
 */
router.put('/:id/products/reassign', protect, adminOnly, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { productIds, targetCategoryId } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'productIds array is required' });
    }
    if (!targetCategoryId) {
      return res.status(400).json({ success: false, message: 'targetCategoryId is required' });
    }

    const sourceCategory = await Category.findById(req.params.id);
    if (!sourceCategory) {
      return res.status(404).json({ success: false, message: 'Source category not found' });
    }

    const targetCategory = await Category.findById(targetCategoryId);
    if (!targetCategory) {
      return res.status(404).json({ success: false, message: 'Target category not found' });
    }

    // Remove source category and add target category
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $pull: { categories: sourceCategory._id } }
    );
    await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { categories: targetCategory._id } }
    );

    res.json({
      success: true,
      message: `Reassigned ${productIds.length} product(s) from "${sourceCategory.name}" to "${targetCategory.name}"`
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/categories/:id/products/add
 * @desc    Add products to a category (without removing from current categories)
 * @access  Private/Admin
 */
router.put('/:id/products/add', protect, adminOnly, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { productIds } = req.body;
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ success: false, message: 'productIds array is required' });
    }

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const result = await Product.updateMany(
      { _id: { $in: productIds } },
      { $addToSet: { categories: category._id } }
    );

    res.json({
      success: true,
      message: `Added ${result.modifiedCount} product(s) to category "${category.name}"`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
