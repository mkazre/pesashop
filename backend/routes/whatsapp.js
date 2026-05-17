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
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp Cloud API is not configured. Set WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Railway env vars and redeploy.'
      });
    }
    const result = await whatsappService.sendText(phone, body);
    if (result?.skipped) {
      return res.status(400).json({ success: false, message: 'Send skipped — Cloud API not configured.' });
    }
    const messageId = result?.messages?.[0]?.id;
    const recipient = result?.contacts?.[0]?.wa_id;
    res.json({
      success: true,
      data: result,
      messageId,
      recipient,
      message: messageId ? `Meta accepted the message (id ${messageId}). If your phone didn't receive it, the recipient may not be on the test number's allowed list.` : 'Meta returned an unexpected response.'
    });
  } catch (err) {
    const metaError = err.response?.data?.error;
    let hint = '';
    if (metaError?.code === 131030) hint = ' Add this phone to your test number\'s allowed recipient list in Meta API Setup.';
    if (metaError?.code === 131026 || metaError?.code === 131047) hint = ' The 24-hour customer service window has expired. Use an approved template instead.';
    if (metaError?.code === 100) hint = ' Check that the phone number format is country code + number with no plus sign (e.g. 27821234567).';
    res.status(500).json({ success: false, message: (metaError?.message || err.message) + hint, code: metaError?.code });
  }
});

// POST /api/whatsapp/admin/test-template — send Meta's pre-approved hello_world (no 24h window needed)
router.post('/admin/test-template', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { phone, templateName = 'hello_world', language = 'en_US' } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'phone required' });
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({ success: false, message: 'WhatsApp Cloud API is not configured.' });
    }
    const result = await whatsappService.sendTemplate(phone, templateName, language, []);
    if (result?.skipped) return res.status(400).json({ success: false, message: 'Send skipped — Cloud API not configured.' });
    const messageId = result?.messages?.[0]?.id;
    res.json({
      success: true,
      data: result,
      messageId,
      message: messageId ? `Meta accepted template ${templateName} (id ${messageId}). Should arrive within seconds.` : 'Meta returned no message id.'
    });
  } catch (err) {
    const metaError = err.response?.data?.error;
    let hint = '';
    if (metaError?.code === 131030) hint = ' Add this phone to the test number\'s allowed recipient list in Meta API Setup.';
    if (metaError?.code === 132001 || /template name does not exist/i.test(metaError?.message || '')) hint = ' That template name doesn\'t exist for this WABA. "hello_world" works on every account by default.';
    res.status(500).json({ success: false, message: (metaError?.message || err.message) + hint, code: metaError?.code });
  }
});

// POST /api/whatsapp/admin/test-event — trigger a templated event send
router.post('/admin/test-event', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const { phone, triggerEvent, variables } = req.body;
    if (!phone || !triggerEvent) return res.status(400).json({ success: false, message: 'phone and triggerEvent required' });
    if (!whatsappService.isConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp Cloud API is not configured. Set WHATSAPP_CLOUD_API_TOKEN and WHATSAPP_PHONE_NUMBER_ID in Railway env vars and redeploy.'
      });
    }
    const result = await whatsappService.sendByEvent(triggerEvent, phone, variables || {});
    if (result?.skipped) {
      return res.status(400).json({ success: false, message: `No active approved template found for event "${triggerEvent}". Create one in the Templates section first.` });
    }
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.error?.message || err.message, code: err.response?.data?.error?.code });
  }
});

module.exports = router;
