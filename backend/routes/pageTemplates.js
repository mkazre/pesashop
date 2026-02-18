const express = require('express');
const router = express.Router();
const PageTemplate = require('../models/PageTemplate');
const PageVersion = require('../models/PageVersion');
const auth = require('../middleware/auth');

// Get all templates/pages
router.get('/', auth.protect, async (req, res) => {
  try {
    const { type, published } = req.query;
    const query = {};
    
    if (type) {
      query.templateType = type;
    }
    
    if (published === 'true') {
      query.isPublished = true;
    }

    const pages = await PageTemplate.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email')
      .select('-components'); // Exclude components for list view

    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get published pages for frontend routing
router.get('/published', async (req, res) => {
  try {
    const pages = await PageTemplate.find({ isPublished: true })
      .select('slug templateType seo')
      .sort({ isHomepage: -1, createdAt: -1 });

    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get homepage (for frontend) - must be before /:id
router.get('/homepage', async (req, res) => {
  try {
    const page = await PageTemplate.findOne({
      isPublished: true,
      $or: [
        { isHomepage: true },
        { slug: 'home' },
        { slug: 'homepage' }
      ]
    }).sort({ isHomepage: -1 }); // Prefer isHomepage: true

    if (!page) {
      return res.status(404).json({ success: false, error: 'Homepage not found' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get page by slug (for frontend) - must be before /:id
router.get('/slug/:slug', async (req, res) => {
  try {
    // Normalize slug: lowercase, trim, spaces → hyphens
    const slug = req.params.slug.toLowerCase().trim().replace(/\s+/g, '-');
    const page = await PageTemplate.findOne({
      slug,
      isPublished: true
    });

    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get published page by template type (e.g. shop) for frontend
router.get('/type/:type', async (req, res) => {
  try {
    const page = await PageTemplate.findOne({
      templateType: req.params.type,
      isPublished: true
    });

    if (!page) {
      return res.status(404).json({ success: false, error: 'No published template for this type' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get single template/page (by id, protected)
router.get('/:id', auth.protect, async (req, res) => {
  try {
    const page = await PageTemplate.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create template/page
router.post('/', auth.protect, async (req, res) => {
  try {
    const {
      templateType,
      name,
      slug,
      components,
      dynamicBindings,
      isHomepage,
      isPublished,
      seo,
      metadata,
    } = req.body;

    // Generate slug if not provided
    const pageSlug = slug || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const page = new PageTemplate({
      templateType,
      name,
      slug: pageSlug,
      components: components || {},
      dynamicBindings: dynamicBindings || {},
      isHomepage: isHomepage || false,
      isPublished: isPublished || false,
      seo: seo || {},
      metadata: metadata || {},
      createdBy: req.user.id,
    });

    await page.save();

    // Save initial version
    const version = new PageVersion({
      pageId: page._id,
      version: 1,
      components: components || {},
      dynamicBindings: dynamicBindings || {},
      savedBy: req.user.id,
    });
    await version.save();

    res.status(201).json({ success: true, data: page });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Slug already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update template/page
router.put('/:id', auth.protect, async (req, res) => {
  try {
    const {
      name,
      slug,
      components,
      dynamicBindings,
      isHomepage,
      isPublished,
      seo,
      metadata,
    } = req.body;

    const page = await PageTemplate.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    // Update fields
    if (name) page.name = name;
    if (slug) page.slug = slug;
    if (components !== undefined) page.components = components;
    if (dynamicBindings !== undefined) page.dynamicBindings = dynamicBindings;
    if (isHomepage !== undefined) page.isHomepage = isHomepage;
    if (isPublished !== undefined) page.isPublished = isPublished;
    if (seo) page.seo = seo;
    if (metadata) page.metadata = metadata;

    // Increment version if components changed
    if (components !== undefined) {
      page.version += 1;
      
      // Save new version (only on manual save, not auto-save)
      // Check if this is a manual save by checking for a flag or checking if components actually changed
      const shouldSaveVersion = req.body.saveVersion !== false; // Default to true unless explicitly false
      
      if (shouldSaveVersion) {
        const version = new PageVersion({
          pageId: page._id,
          version: page.version,
          components: components,
          dynamicBindings: dynamicBindings || page.dynamicBindings,
          savedBy: req.user.id,
          notes: req.body.versionNotes || `Manual save - Version ${page.version}`,
        });
        await version.save();
      }
    }

    await page.save();

    res.json({ success: true, data: page });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, error: 'Slug already exists' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete template/page
router.delete('/:id', auth.protect, async (req, res) => {
  try {
    const page = await PageTemplate.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    // Delete all versions
    await PageVersion.deleteMany({ pageId: page._id });

    await page.deleteOne();

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Duplicate template/page
router.post('/:id/duplicate', auth.protect, async (req, res) => {
  try {
    const original = await PageTemplate.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    const duplicate = new PageTemplate({
      ...original.toObject(),
      _id: undefined,
      name: `${original.name} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      isHomepage: false,
      isPublished: false,
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

// Get version history
router.get('/:id/versions', auth.protect, async (req, res) => {
  try {
    const versions = await PageVersion.find({ pageId: req.params.id })
      .sort({ version: -1 })
      .populate('savedBy', 'name email')
      .limit(50);

    res.json({ success: true, data: versions });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Restore version
router.post('/:id/versions/:versionId/restore', auth.protect, async (req, res) => {
  try {
    const version = await PageVersion.findById(req.params.versionId);
    if (!version || version.pageId.toString() !== req.params.id) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }

    const page = await PageTemplate.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'Page not found' });
    }

    page.components = version.components;
    page.dynamicBindings = version.dynamicBindings;
    page.version += 1;
    await page.save();

    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
