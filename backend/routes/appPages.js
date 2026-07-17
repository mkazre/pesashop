const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const AppPage = require('../models/AppPage');

// ── Public ────────────────────────────────────────────────────────

// GET published pages list (minimal fields — for a future "browse pages" screen)
router.get('/public', async (req, res, next) => {
  try {
    const pages = await AppPage.find({ status: 'published' })
      .select('title slug updatedAt')
      .sort({ updatedAt: -1 });
    res.json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
});

// GET a single published page by slug, full blocks — what the app renders
router.get('/public/:slug', async (req, res, next) => {
  try {
    const page = await AppPage.findOne({ slug: req.params.slug, status: 'published' });
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    const blocks = (page.blocks || [])
      .filter((b) => b.enabled)
      .sort((a, b) => a.order - b.order);
    res.json({ success: true, data: { title: page.title, slug: page.slug, seo: page.seo, blocks } });
  } catch (error) {
    next(error);
  }
});

// ── Admin ─────────────────────────────────────────────────────────

router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const pages = await AppPage.find().select('title slug status updatedAt').sort({ updatedAt: -1 });
    res.json({ success: true, data: pages });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const page = await AppPage.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { title, slug, status, blocks, seo } = req.body;
    const existing = await AppPage.findOne({ slug });
    if (existing) return res.status(409).json({ success: false, message: 'A page with this slug already exists' });

    const page = await AppPage.create({
      title,
      slug,
      status: status || 'draft',
      blocks: blocks || [],
      seo: seo || {},
      createdBy: req.user.id,
    });
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
});

router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const page = await AppPage.findById(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });

    const { title, slug, status, blocks, seo } = req.body;
    if (slug && slug !== page.slug) {
      const existing = await AppPage.findOne({ slug, _id: { $ne: page._id } });
      if (existing) return res.status(409).json({ success: false, message: 'A page with this slug already exists' });
      page.slug = slug;
    }
    if (title !== undefined) page.title = title;
    if (status !== undefined) page.status = status;
    if (blocks !== undefined) page.blocks = blocks;
    if (seo !== undefined) page.seo = seo;

    await page.save();
    res.json({ success: true, data: page, message: 'Page updated successfully' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const page = await AppPage.findByIdAndDelete(req.params.id);
    if (!page) return res.status(404).json({ success: false, message: 'Page not found' });
    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/duplicate', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const original = await AppPage.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Page not found' });

    let slug = `${original.slug}-copy`;
    let n = 1;
    while (await AppPage.findOne({ slug })) {
      n += 1;
      slug = `${original.slug}-copy-${n}`;
    }

    const duplicate = new AppPage({
      ...original.toObject(),
      _id: undefined,
      title: `${original.title} (Copy)`,
      slug,
      status: 'draft',
      createdBy: req.user.id,
      createdAt: undefined,
      updatedAt: undefined,
    });
    await duplicate.save();

    res.status(201).json({ success: true, data: duplicate });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
