const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Popup = require('../models/Popup');

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// ─── PUBLIC ROUTES — must be before /:id to avoid Express swallowing them ────

// GET active popups for frontend rendering
router.get('/public/active', async (req, res, next) => {
  try {
    const { pagePath, pageType, isWeb, isApp } = req.query;
    const popups = await Popup.getActiveForContext({
      pagePath: pagePath || '/',
      pageType: pageType || 'homepage',
      isWeb: isWeb !== 'false',
      isApp: isApp === 'true',
    });
    res.json({ success: true, data: popups });
  } catch (err) { next(err); }
});

// POST track analytics event (public — no auth needed)
router.post('/track/:id', async (req, res, next) => {
  try {
    const { event } = req.body;
    const validEvents = { impression: 'analytics.impressions', click: 'analytics.clicks', conversion: 'analytics.conversions', dismissal: 'analytics.dismissals' };
    if (!validEvents[event]) return res.status(400).json({ success: false, message: 'Invalid event' });
    await Popup.findByIdAndUpdate(req.params.id, { $inc: { [validEvents[event]]: 1 } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET all popups
router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { status, search, pageTarget } = req.query;
    const query = {};
    if (status) query.status = status;
    if (pageTarget) query['display.pageTarget'] = pageTarget;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }
    const popups = await Popup.find(query)
      .select('-layouts.desktop.blocks -layouts.tablet.blocks -layouts.mobile.blocks')
      .sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, data: popups, count: popups.length });
  } catch (err) { next(err); }
});

// GET single popup (full data including blocks)
router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const popup = await Popup.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    res.json({ success: true, data: popup });
  } catch (err) { next(err); }
});

// POST create popup
router.post('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const popup = await Popup.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: popup, message: 'Popup created' });
  } catch (err) { next(err); }
});

// PUT update popup
router.put('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const popup = await Popup.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    res.json({ success: true, data: popup, message: 'Popup updated' });
  } catch (err) { next(err); }
});

// DELETE popup
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const popup = await Popup.findByIdAndDelete(req.params.id);
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    res.json({ success: true, message: 'Popup deleted' });
  } catch (err) { next(err); }
});

// PUT toggle status
router.put('/:id/status', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'active', 'paused'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const popup = await Popup.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!popup) return res.status(404).json({ success: false, message: 'Popup not found' });
    res.json({ success: true, data: popup, message: `Popup ${status}` });
  } catch (err) { next(err); }
});

// POST duplicate popup
router.post('/:id/duplicate', protect, authorize('admin'), async (req, res, next) => {
  try {
    const original = await Popup.findById(req.params.id);
    if (!original) return res.status(404).json({ success: false, message: 'Popup not found' });
    const data = original.toObject();
    delete data._id;
    delete data.createdAt;
    delete data.updatedAt;
    data.name = `${data.name} (Copy)`;
    data.status = 'draft';
    data.analytics = { impressions: 0, clicks: 0, conversions: 0, dismissals: 0 };
    data.createdBy = req.user._id;
    const copy = await Popup.create(data);
    res.status(201).json({ success: true, data: copy, message: 'Popup duplicated' });
  } catch (err) { next(err); }
});

// POST bulk operations
router.post('/bulk', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { action, ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No IDs provided' });
    }
    let result;
    switch (action) {
      case 'activate':
        result = await Popup.updateMany({ _id: { $in: ids } }, { status: 'active' });
        break;
      case 'pause':
        result = await Popup.updateMany({ _id: { $in: ids } }, { status: 'paused' });
        break;
      case 'draft':
        result = await Popup.updateMany({ _id: { $in: ids } }, { status: 'draft' });
        break;
      case 'delete':
        result = await Popup.deleteMany({ _id: { $in: ids } });
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid action' });
    }
    res.json({ success: true, message: `Bulk ${action} applied to ${ids.length} popup(s)`, data: result });
  } catch (err) { next(err); }
});


module.exports = router;
