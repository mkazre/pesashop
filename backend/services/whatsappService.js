const axios = require('axios');
const WhatsAppTemplate = require('../models/WhatsAppTemplate');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

const GRAPH_BASE = 'https://graph.facebook.com/v19.0';

class WhatsAppService {
  isConfigured() {
    return !!(process.env.WHATSAPP_CLOUD_API_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
  }

  normalizePhone(phone) {
    if (!phone) return null;
    let p = String(phone).replace(/\D/g, '');
    if (p.startsWith('0')) p = '27' + p.slice(1); // South Africa default
    return p;
  }

  async sendText(toPhone, body) {
    if (!this.isConfigured()) {
      console.warn('[WhatsApp] not configured — message dropped:', { toPhone, body });
      return { skipped: true };
    }
    const to = this.normalizePhone(toPhone);
    if (!to) throw new Error('Invalid phone number');

    const url = `${GRAPH_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  }

  async sendTemplate(toPhone, metaTemplateName, language = 'en', components = []) {
    if (!this.isConfigured()) return { skipped: true };
    const to = this.normalizePhone(toPhone);
    if (!to) throw new Error('Invalid phone number');

    const url = `${GRAPH_BASE}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const res = await axios.post(url, {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: { name: metaTemplateName, language: { code: language }, components }
    }, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_CLOUD_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    return res.data;
  }

  async sendByEvent(triggerEvent, toPhone, variables = {}) {
    try {
      const tpl = await WhatsAppTemplate.findOne({ triggerEvent, isActive: true, status: 'approved' });
      if (!tpl) {
        console.warn(`[WhatsApp] no active template for trigger=${triggerEvent}`);
        return { skipped: true };
      }
      let body = tpl.bodyTemplate;
      Object.entries(variables).forEach(([key, value]) => {
        body = body.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value ?? '');
      });

      const result = await this.sendText(toPhone, body);

      try {
        WhatsAppTemplate.findByIdAndUpdate(tpl._id, { $inc: { 'stats.sent': 1 } }).catch(() => {});
      } catch {}
      return result;
    } catch (e) {
      console.error('WhatsApp sendByEvent error:', e.response?.data || e.message);
      try {
        const tpl = await WhatsAppTemplate.findOne({ triggerEvent, isActive: true });
        if (tpl) await WhatsAppTemplate.findByIdAndUpdate(tpl._id, { $inc: { 'stats.failed': 1 } });
      } catch {}
      throw e;
    }
  }

  async handleInboundMessage(payload) {
    try {
      const entry = payload?.entry?.[0];
      const change = entry?.changes?.[0];
      const value = change?.value;
      const message = value?.messages?.[0];
      if (!message) return;

      const fromPhone = message.from;
      const text = message.text?.body || message.button?.text || '';

      // Find or create a conversation by phone number
      let conversation = await Conversation.findOne({ 'guest.phone': fromPhone, channel: 'whatsapp' });
      if (!conversation) {
        const contact = value?.contacts?.[0];
        conversation = await Conversation.create({
          channel: 'whatsapp',
          status: 'open',
          guest: { name: contact?.profile?.name || 'WhatsApp user', phone: fromPhone }
        });
      }

      await Message.create({
        conversation: conversation._id,
        sender: 'guest',
        content: text,
        metadata: { whatsappMessageId: message.id }
      });

      // Auto-reply for 'support' keyword
      if (/support|help|hi|hello/i.test(text)) {
        await this.sendText(fromPhone, "Hi! Thanks for reaching out to PesaShop. An agent will be with you shortly. Reply with 'order <number>' to check an order.").catch(() => {});
      }
    } catch (e) {
      console.error('WhatsApp inbound error:', e.message);
    }
  }
}

module.exports = new WhatsAppService();
