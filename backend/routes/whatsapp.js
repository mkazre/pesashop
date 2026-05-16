const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const whatsappService = require('../services/whatsappService');

// ─── Webhook (Meta Cloud API) ──────────────────────────────────

// GET /api/whatsapp/webhook — verification handshake
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === (process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'pesa-whatsapp-verify')) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// POST /api/whatsapp/webhook — incoming messages
router.post('/webhook', async (req, res) => {
  res.sendStatus(200);
  whatsappService.handleInboundMessage(req.body).catch(e => console.error('WhatsApp webhook error:', e.message));
});

// ─── Admin ─────────────────────────────────────────────────────

// GET /api/whatsapp/admin/status
router.get('/admin/status', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), (req, res) => {
  res.json({
    success: true,
    data: {
      configured: whatsappService.isConfigured(),
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ? 'set' : 'missing',
      token: process.env.WHATSAPP_CLOUD_API_TOKEN ? 'set' : 'missing',
      verifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? 'set' : 'using-default',
      webhookUrl: `${req.protocol}://${req.get('host')}/api/whatsapp/webhook`
    }
  });
});

// GET /api/whatsapp/admin/templates
router.get('/admin/templates', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const templates = await WhatsAppTemplate.find().sort({ createdAt: -1 });
    res.json({ success: true, data: templates });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/admin/templates
router.post('/admin/templates', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const tpl = await WhatsAppTemplate.create(req.body);
    res.status(201).json({ success: true, data: tpl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/whatsapp/admin/templates/:id
router.put('/admin/templates/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const tpl = await WhatsAppTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!tpl) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, data: tpl });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/whatsapp/admin/templates/:id
router.delete('/admin/templates/:id', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    await WhatsAppTemplate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/whatsapp/admin/test-send — send a test text message
router.post('/admin/test-send', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { phone, body } = req.body;
    if (!phone || !body) return res.status(400).json({ success: false, message: 'phone and body required' });
    const result = await whatsappService.sendText(phone, body);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

// POST /api/whatsapp/admin/test-event — trigger a templated event send
router.post('/admin/test-event', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { phone, triggerEvent, variables } = req.body;
    if (!phone || !triggerEvent) return res.status(400).json({ success: false, message: 'phone and triggerEvent required' });
    const result = await whatsappService.sendByEvent(triggerEvent, phone, variables || {});
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message });
  }
});

module.exports = router;
