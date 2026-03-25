const express = require('express');
const router = express.Router();
const Menu = require('../models/Menu');
const PageTemplate = require('../models/PageTemplate');
const Category = require('../models/Category');
const auth = require('../middleware/auth');

// Get all menus
router.get('/', auth.protect, async (req, res) => {
  try {
    const { location } = req.query;
    const query = {};
    
    if (location) {
      query.location = location;
    }

    const menus = await Menu.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get active menu by location (for frontend)
// Supports ?pageId=xxx to check page-specific assignment first, then falls back to global
router.get('/location/:location', async (req, res) => {
  try {
    const { pageId } = req.query;
    let menu = null;

    // 1. If pageId provided, check for page-specific menu assignment
    if (pageId) {
      const page = await PageTemplate.findById(pageId).select('menuAssignments');
      if (page?.menuAssignments?.[req.params.location]) {
        menu = await Menu.findOne({
          _id: page.menuAssignments[req.params.location],
          isActive: true,
        });
      }
    }

    // 2. Fall back to global menu for this location
    if (!menu) {
      menu = await Menu.findOne({
        location: req.params.location,
        isActive: true,
        isGlobal: true,
      }).sort({ updatedAt: -1 });
    }

    // 3. Fall back to any active menu for this location
    if (!menu) {
      menu = await Menu.findOne({
        location: req.params.location,
        isActive: true,
      }).sort({ updatedAt: -1 });
    }

    if (!menu) {
      return res.json({ success: true, data: null });
    }

    // Auto-populate if enabled - merge with existing items
    if (menu.autoPopulatePages || menu.autoPopulateCategories) {
      const populatedMenu = await populateMenuItems(menu);
      return res.json({ success: true, data: populatedMenu });
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to clean menu items by removing invalid _id fields
function cleanMenuItems(items) {
  if (!items || !Array.isArray(items)) return items;
  
  return items.map(item => {
    const cleaned = { ...item };
    
    // Remove _id if it's not a valid MongoDB ObjectId (24 hex characters)
    if (cleaned._id && !/^[0-9a-fA-F]{24}$/.test(cleaned._id.toString())) {
      delete cleaned._id;
    }
    
    // Recursively clean children
    if (cleaned.children && Array.isArray(cleaned.children)) {
      cleaned.children = cleanMenuItems(cleaned.children);
    }
    
    return cleaned;
  });
}

// Helper function to populate menu items
async function populateMenuItems(menu) {
  // Start with existing items
  const items = menu.items ? JSON.parse(JSON.stringify(menu.items)) : [];

  if (menu.autoPopulatePages) {
    const pages = await PageTemplate.find({ isPublished: true })
      .select('name slug isHomepage')
      .sort({ isHomepage: -1, name: 1 });

    pages.forEach((page) => {
      // Check if page already exists in items
      const exists = items.some(item => 
        item.linkType === 'page' && item.linkId === page._id.toString()
      );
      
      if (!exists) {
        items.push({
          _id: `auto-page-${page._id}`,
          label: page.name,
          link: `/${page.slug}`,
          linkType: 'page',
          linkId: page._id.toString(),
          icon: '',
          badge: '',
          badgeColor: 'red',
          openInNewTab: false,
          children: [],
          order: page.isHomepage ? -1 : 1000 + items.length,
        });
      }
    });
  }

  if (menu.autoPopulateCategories) {
    const categories = await Category.find({ isActive: true })
      .select('name slug')
      .sort({ name: 1 });

    categories.forEach((category) => {
      // Check if category already exists in items
      const exists = items.some(item => 
        item.linkType === 'category' && item.linkId === category._id.toString()
      );
      
      if (!exists) {
        items.push({
          _id: `auto-category-${category._id}`,
          label: category.name,
          link: `/category/${category.slug}`,
          linkType: 'category',
          linkId: category._id.toString(),
          icon: '',
          badge: '',
          badgeColor: 'red',
          openInNewTab: false,
          children: [],
          order: 2000 + items.length,
        });
      }
    });
  }

  // Sort by order
  items.sort((a, b) => (a.order || 0) - (b.order || 0));

  return {
    ...menu.toObject(),
    items,
  };
}

// Get active pages for default menu auto-population (public)
router.get('/default-menu-data', async (req, res) => {
  try {
    const Product = require('../models/Product');
    const pages = await PageTemplate.find({ isPublished: true })
      .select('name slug isHomepage templateType')
      .sort({ isHomepage: -1, name: 1 });

    const categories = await Category.find({ isActive: true })
      .select('name slug iconImage productCount')
      .sort({ productCount: -1, name: 1 })
      .limit(12);

    // Trending: featured first, then newest products
    const trendingProducts = await Product.find({ isActive: true, status: 'active' })
      .select('name slug featuredImage images regularPrice salePrice isFeatured')
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(8);

    // Fetch header menu settings (top bar config etc.)
    const headerMenu = await Menu.findOne({ location: 'header', isActive: true }).select('settings').sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        pages: pages.filter(p => !['single-product', 'product'].includes(p.templateType)),
        categories,
        trendingProducts,
        menuSettings: headerMenu?.settings || {},
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single menu
router.get('/:id', auth.protect, async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!menu) {
      return res.status(404).json({ success: false, error: 'Menu not found' });
    }

    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create menu
router.post('/', auth.protect, async (req, res) => {
  try {
    const {
      name,
      location,
      items,
      autoPopulatePages,
      autoPopulateCategories,
      settings,
      isGlobal,
    } = req.body;

    const menu = new Menu({
      name,
      location,
      items: cleanMenuItems(items || []),
      autoPopulatePages: autoPopulatePages || false,
      autoPopulateCategories: autoPopulateCategories || false,
      settings: settings || {},
      isGlobal: isGlobal || false,
      createdBy: req.user.id,
    });

    await menu.save();

    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update menu
router.put('/:id', auth.protect, async (req, res) => {
  try {
    const {
      name,
      location,
      items,
      autoPopulatePages,
      autoPopulateCategories,
      settings,
      isActive,
      isGlobal,
    } = req.body;

    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, error: 'Menu not found' });
    }

    if (name) menu.name = name;
    if (location) menu.location = location;
    if (items !== undefined) {
      menu.items = cleanMenuItems(items);
    }
    if (autoPopulatePages !== undefined) menu.autoPopulatePages = autoPopulatePages;
    if (autoPopulateCategories !== undefined) menu.autoPopulateCategories = autoPopulateCategories;
    if (settings !== undefined) menu.settings = settings;
    if (isActive !== undefined) menu.isActive = isActive;
    if (isGlobal !== undefined) menu.isGlobal = isGlobal;

    await menu.save();

    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete menu
router.delete('/:id', auth.protect, async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, error: 'Menu not found' });
    }

    await menu.deleteOne();

    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duplicate menu
router.post('/:id/duplicate', auth.protect, async (req, res) => {
  try {
    const original = await Menu.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Menu not found' });
    }

    const duplicate = new Menu({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      createdBy: req.user.id,
      createdAt: undefined,
      updatedAt: undefined,
    });

    await duplicate.save();

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
