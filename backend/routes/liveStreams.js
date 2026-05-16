const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const LiveStream = require('../models/LiveStream');

// ─── Public ────────────────────────────────────────────────────

// GET /api/live-streams — list scheduled + live streams
router.get('/', async (req, res) => {
  try {
    const status = req.query.status || { $in: ['scheduled', 'live'] };
    const streams = await LiveStream.find({ status })
      .populate('products', 'name slug price salePrice images stock')
      .sort({ scheduledStart: 1 })
      .limit(parseInt(req.query.limit) || 12);
    res.json({ success: true, data: streams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/live-streams/current — anything currently live
router.get('/current', async (req, res) => {
  try {
    const stream = await LiveStream.findOne({ status: 'live' })
      .populate('products', 'name slug price salePrice images stock')
      .populate('currentPin', 'name slug price salePrice images stock')
      .sort({ actualStart: -1 });
    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/live-streams/:id
router.get('/:id', async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id)
      .populate('products', 'name slug price salePrice images stock')
      .populate('currentPin', 'name slug price salePrice images stock')
      .populate('pinEvents.product', 'name slug price salePrice images');
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });
    LiveStream.findByIdAndUpdate(stream._id, { $inc: { 'stats.totalViewers': 1 } }).catch(() => {});
    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/live-streams/:id/tap — track viewer tap on pin
router.post('/:id/tap', async (req, res) => {
  try {
    const { productId, action } = req.body;
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });
    const event = stream.pinEvents.find(p => String(p.product) === String(productId) && !p.unpinnedAt);
    if (event) {
      if (action === 'cart') event.addToCarts += 1;
      else event.taps += 1;
      await stream.save();
    }
    if (action === 'cart') {
      LiveStream.findByIdAndUpdate(stream._id, { $inc: { 'stats.cartAdds': 1 } }).catch(() => {});
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── Admin ─────────────────────────────────────────────────────

router.get('/admin/all', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const streams = await LiveStream.find()
      .populate('products', 'name slug')
      .sort({ scheduledStart: -1 });
    res.json({ success: true, data: streams });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const stream = await LiveStream.create({ ...req.body, hostUserId: req.user.id });
    res.status(201).json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/admin/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const stream = await LiveStream.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });
    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/admin/:id', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    await LiveStream.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/admin/:id/start', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const stream = await LiveStream.findByIdAndUpdate(req.params.id, { status: 'live', actualStart: new Date() }, { new: true });
    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/admin/:id/end', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const stream = await LiveStream.findByIdAndUpdate(req.params.id, { status: 'ended', actualEnd: new Date(), currentPin: null, currentPinExpiresAt: null, vodPlaybackUrl: req.body.vodPlaybackUrl }, { new: true });
    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/live-streams/admin/:id/pin — pin a product for N seconds
router.post('/admin/:id/pin', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { productId, durationSec = 60 } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId required' });
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });

    // close any previous open pin
    const open = stream.pinEvents.find(p => !p.unpinnedAt);
    if (open) open.unpinnedAt = new Date();

    stream.pinEvents.push({ product: productId, durationSec, pinnedAt: new Date(), videoTimestamp: stream.actualStart ? Math.floor((Date.now() - new Date(stream.actualStart).getTime()) / 1000) : null });
    stream.currentPin = productId;
    stream.currentPinExpiresAt = new Date(Date.now() + durationSec * 1000);
    await stream.save();
    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/admin/:id/unpin', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const stream = await LiveStream.findById(req.params.id);
    if (!stream) return res.status(404).json({ success: false, message: 'Stream not found' });
    const open = stream.pinEvents.find(p => !p.unpinnedAt);
    if (open) open.unpinnedAt = new Date();
    stream.currentPin = null;
    stream.currentPinExpiresAt = null;
    await stream.save();
    res.json({ success: true, data: stream });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
