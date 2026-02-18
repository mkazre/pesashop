const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Category = require('../models/Category');
const Product = require('../models/Product');

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
router.post('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
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
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
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
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
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
    
    const products = await Product.find({ categories: category._id })
      .select('name sku regularPrice featuredImage')
      .limit(10);
    
    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
