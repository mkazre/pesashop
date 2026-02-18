const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const CodeSnippet = require('../models/CodeSnippet');
const codeSnippetValidator = require('../services/codeSnippetValidator');

// GET all snippets (admin)
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { environment, location, type, isActive, pageTarget, search } = req.query;
    const query = {};
    
    if (environment) query.environment = environment;
    if (location) query.location = location;
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (pageTarget) query.pageTarget = pageTarget;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }
    
    const snippets = await CodeSnippet.find(query)
      .populate('lastModifiedBy', 'firstName lastName email')
      .sort({ priority: -1, createdAt: -1 });
    
    res.json({
      success: true,
      data: snippets,
      count: snippets.length
    });
  } catch (error) {
    next(error);
  }
});

// GET active snippets for injection (public endpoint for frontend/admin)
router.get('/active/:environment/:location', async (req, res, next) => {
  try {
    const { environment, location } = req.params;
    const { pagePath, pageType, isLoggedIn, userRole } = req.query;
    
    const userContext = {
      isLoggedIn: isLoggedIn === 'true',
      role: userRole || null
    };
    
    const snippets = await CodeSnippet.getActiveSnippets(
      environment,
      location,
      pagePath || '/',
      pageType || 'homepage',
      userContext
    );
    
    res.json({
      success: true,
      data: snippets.map(snippet => ({
        _id: snippet._id,
        name: snippet.name,
        type: snippet.type,
        code: snippet.getSafeCode(),
        async: snippet.async,
        defer: snippet.defer,
        deviceTarget: snippet.deviceTarget,
        minify: snippet.minify,
        externalStylesheet: snippet.externalStylesheet,
        shortcode: snippet.shortcode
      }))
    });
  } catch (error) {
    next(error);
  }
});

// GET snippet by shortcode (public — for embedding) — MUST be before /:id
router.get('/shortcode/:name', async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findOne({
      shortcode: req.params.name,
      isActive: true,
      emergencyDisable: false
    });

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Snippet not found' });
    }

    res.json({
      success: true,
      data: {
        _id: snippet._id,
        name: snippet.name,
        type: snippet.type,
        code: snippet.getSafeCode(),
        deviceTarget: snippet.deviceTarget
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST export snippets (download as JSON) — MUST be before /:id
router.post('/export', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    let snippets;
    if (ids && Array.isArray(ids) && ids.length > 0) {
      snippets = await CodeSnippet.find({ _id: { $in: ids } });
    } else {
      snippets = await CodeSnippet.find({});
    }

    const exportData = snippets.map(s => {
      const obj = s.toObject();
      delete obj._id;
      delete obj.__v;
      delete obj.createdAt;
      delete obj.updatedAt;
      delete obj.lastModifiedBy;
      delete obj.versions;
      delete obj.usageCount;
      delete obj.syntaxValid;
      delete obj.syntaxErrors;
      delete obj.lastValidated;
      return obj;
    });

    res.json({
      success: true,
      data: {
        version: '1.0',
        exportedAt: new Date().toISOString(),
        count: exportData.length,
        snippets: exportData
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST import snippets (upload JSON) — MUST be before /:id
router.post('/import', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { snippets, overwrite } = req.body;
    if (!snippets || !Array.isArray(snippets) || snippets.length === 0) {
      return res.status(400).json({ success: false, message: 'No snippets to import' });
    }

    let imported = 0;
    let skipped = 0;
    let updated = 0;
    const errors = [];

    for (const snippetData of snippets) {
      try {
        const existing = await CodeSnippet.findOne({ name: snippetData.name });
        if (existing) {
          if (overwrite) {
            const version = {
              code: existing.code,
              modifiedBy: existing.lastModifiedBy,
              modifiedAt: existing.updatedAt,
              reason: 'Before import overwrite'
            };
            const versions = [...(existing.versions || []), version].slice(-10);
            
            await CodeSnippet.findByIdAndUpdate(existing._id, {
              ...snippetData,
              versions,
              lastModifiedBy: req.user._id,
              isActive: false
            });
            updated++;
          } else {
            skipped++;
          }
        } else {
          await CodeSnippet.create({
            ...snippetData,
            lastModifiedBy: req.user._id,
            isActive: false
          });
          imported++;
        }
      } catch (err) {
        errors.push({ name: snippetData.name, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Import complete: ${imported} created, ${updated} updated, ${skipped} skipped`,
      data: { imported, updated, skipped, errors }
    });
  } catch (error) {
    next(error);
  }
});

// POST bulk operations — MUST be before /:id
router.post('/bulk', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { action, ids } = req.body;
    
    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Action and IDs are required'
      });
    }
    
    let result;
    switch (action) {
      case 'activate':
        result = await CodeSnippet.updateMany(
          { _id: { $in: ids } },
          { isActive: true }
        );
        break;
      case 'deactivate':
        result = await CodeSnippet.updateMany(
          { _id: { $in: ids } },
          { isActive: false }
        );
        break;
      case 'delete':
        result = await CodeSnippet.deleteMany({ _id: { $in: ids } });
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: activate, deactivate, delete'
        });
    }
    
    res.json({
      success: true,
      message: `Bulk ${action} completed for ${ids.length} snippet(s)`,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// GET single snippet
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id)
      .populate('lastModifiedBy', 'firstName lastName email');
    
    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Code snippet not found'
      });
    }
    
    res.json({ success: true, data: snippet });
  } catch (error) {
    next(error);
  }
});

// POST create snippet
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { code, type, name } = req.body;
    
    if (!code || !type || !name) {
      return res.status(400).json({
        success: false,
        message: 'Code, type, and name are required'
      });
    }
    
    // Validate syntax
    const validation = codeSnippetValidator.validate(code, type);
    
    // Save previous version if updating
    let previousVersion = null;
    if (req.body._id) {
      const existing = await CodeSnippet.findById(req.body._id);
      if (existing) {
        previousVersion = {
          code: existing.code,
          modifiedBy: existing.lastModifiedBy,
          modifiedAt: existing.updatedAt,
          reason: 'Version before update'
        };
      }
    }
    
    const snippetData = {
      ...req.body,
      lastModifiedBy: req.user._id,
      syntaxValid: validation.valid,
      syntaxErrors: [...validation.errors, ...validation.warnings],
      lastValidated: new Date()
    };
    
    // Add version history
    if (previousVersion) {
      snippetData.versions = [previousVersion];
    }
    
    const snippet = await CodeSnippet.create(snippetData);
    
    res.status(201).json({
      success: true,
      data: snippet,
      validation,
      message: validation.valid 
        ? 'Code snippet created successfully' 
        : 'Code snippet created with syntax errors. Please review and fix.'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Code snippet with this name already exists'
      });
    }
    next(error);
  }
});

// PUT update snippet
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);
    
    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Code snippet not found'
      });
    }
    
    // Save current version to history
    const currentVersion = {
      code: snippet.code,
      modifiedBy: snippet.lastModifiedBy,
      modifiedAt: snippet.updatedAt,
      reason: req.body.versionReason || 'Version before update'
    };
    
    // Keep last 10 versions
    const versions = [...(snippet.versions || []), currentVersion].slice(-10);
    
    // Validate syntax if code changed
    let validation = { valid: true, errors: [], warnings: [] };
    if (req.body.code && req.body.code !== snippet.code) {
      validation = codeSnippetValidator.validate(req.body.code, req.body.type || snippet.type);
    }
    
    const updateData = {
      ...req.body,
      lastModifiedBy: req.user._id,
      versions,
      syntaxValid: validation.valid,
      syntaxErrors: [...validation.errors, ...validation.warnings],
      lastValidated: new Date()
    };
    
    const updatedSnippet = await CodeSnippet.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('lastModifiedBy', 'firstName lastName email');
    
    res.json({
      success: true,
      data: updatedSnippet,
      validation,
      message: validation.valid 
        ? 'Code snippet updated successfully' 
        : 'Code snippet updated with syntax errors. Please review and fix.'
    });
  } catch (error) {
    next(error);
  }
});

// POST validate code (without saving)
router.post('/validate', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { code, type } = req.body;
    
    if (!code || !type) {
      return res.status(400).json({
        success: false,
        message: 'Code and type are required'
      });
    }
    
    const validation = codeSnippetValidator.validate(code, type);
    
    res.json({
      success: true,
      validation
    });
  } catch (error) {
    next(error);
  }
});

// PUT toggle active status
router.put('/:id/toggle', protect, authorize('admin'), async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);
    
    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Code snippet not found'
      });
    }
    
    snippet.isActive = !snippet.isActive;
    snippet.lastModifiedBy = req.user._id;
    await snippet.save();
    
    res.json({
      success: true,
      data: snippet
    });
  } catch (error) {
    next(error);
  }
});

// PUT emergency disable (accessible even if site breaks)
router.put('/:id/emergency-disable', async (req, res, next) => {
  try {
    // This endpoint should be accessible without auth in case site breaks
    // But we'll use a special token or IP whitelist in production
    const { emergencyToken } = req.body;
    
    // In production, verify emergency token
    if (process.env.EMERGENCY_TOKEN && emergencyToken !== process.env.EMERGENCY_TOKEN) {
      return res.status(401).json({
        success: false,
        message: 'Invalid emergency token'
      });
    }
    
    const snippet = await CodeSnippet.findById(req.params.id);
    
    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Code snippet not found'
      });
    }
    
    snippet.emergencyDisable = true;
    snippet.isActive = false;
    await snippet.save();
    
    res.json({
      success: true,
      message: 'Snippet emergency disabled',
      data: snippet
    });
  } catch (error) {
    next(error);
  }
});

// DELETE snippet
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id);
    
    if (!snippet) {
      return res.status(404).json({
        success: false,
        message: 'Code snippet not found'
      });
    }
    
    await CodeSnippet.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Code snippet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST duplicate snippet
router.post('/:id/duplicate', protect, authorize('admin'), async (req, res, next) => {
  try {
    const original = await CodeSnippet.findById(req.params.id);
    if (!original) {
      return res.status(404).json({ success: false, message: 'Code snippet not found' });
    }

    const obj = original.toObject();
    delete obj._id;
    delete obj.__v;
    delete obj.createdAt;
    delete obj.updatedAt;
    obj.name = `${original.name} (Copy)`;
    obj.isActive = false;
    obj.versions = [];
    obj.lastModifiedBy = req.user._id;
    if (obj.shortcode) obj.shortcode = `${obj.shortcode}_copy`;

    const duplicate = await CodeSnippet.create(obj);

    res.status(201).json({
      success: true,
      data: duplicate,
      message: 'Snippet duplicated successfully'
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A snippet with this name already exists. Please rename.' });
    }
    next(error);
  }
});

// GET snippet version history (for diff view)
router.get('/:id/versions', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const snippet = await CodeSnippet.findById(req.params.id)
      .populate('versions.modifiedBy', 'firstName lastName email');

    if (!snippet) {
      return res.status(404).json({ success: false, message: 'Code snippet not found' });
    }

    res.json({
      success: true,
      data: {
        currentCode: snippet.code,
        versions: snippet.versions || []
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
