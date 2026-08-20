const nodemailer = require('nodemailer');
const axios = require('axios');
const EmailTemplate = require('../models/EmailTemplate');
const Currency = require('../models/Currency');

const BREVO_API_URL = 'https://api.brevo.com/v3';

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@ecommerce.com';
    this._dbInitialized = false;
    this._brevoConfig = null; // { apiKey, fromEmail, fromName }
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter from env vars (startup fallback)
   */
  initializeTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT) || 587;
    if (host) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 60000,
        tls: { rejectUnauthorized: false },
      });
    }
  }

  /**
   * Re-initialize transporter from DB settings (called when admin saves SMTP config)
   */
  reinitialize(settings) {
    this.from = settings.fromEmail
      ? (settings.fromName ? `"${settings.fromName}" <${settings.fromEmail}>` : settings.fromEmail)
      : (process.env.EMAIL_FROM || 'noreply@ecommerce.com');

    const provider = settings.emailProvider || 'smtp';

    const brevoKey = settings.brevoApiKey;
    const brevoKeyValid = brevoKey && brevoKey.length > 20;

    if (provider === 'brevo' && brevoKeyValid) {
      // Brevo HTTP API — uses HTTPS port 443, never blocked by cloud providers
      this._brevoConfig = {
        apiKey: brevoKey,
        fromEmail: settings.fromEmail || settings.smtpUser || 'noreply@ecommerce.com',
        fromName: settings.fromName || 'PesaShop',
      };
      this.transporter = null; // Not using nodemailer for Brevo
      console.log(`[EmailService] Initialized with Brevo HTTP API, from=${this._brevoConfig.fromEmail}, key=${brevoKey.substring(0, 12)}...`);
    } else {
      // Custom SMTP — clear Brevo config
      this._brevoConfig = null;
      const host = settings.smtpHost || process.env.EMAIL_HOST;
      const port = parseInt(settings.smtpPort) || parseInt(process.env.EMAIL_PORT) || 587;
      const user = settings.smtpUser || process.env.EMAIL_USER;
      const pass = settings.smtpPassword || process.env.EMAIL_PASSWORD;
      const useImplicitTLS = port === 465;
      if (host) {
        const transportOpts = {
          host,
          port,
          secure: useImplicitTLS,
          auth: { user, pass },
          connectionTimeout: 30000,
          greetingTimeout: 30000,
          socketTimeout: 60000,
          tls: { rejectUnauthorized: false },
        };
        if (!useImplicitTLS && (settings.smtpSecure === true || port === 587)) {
          transportOpts.requireTLS = true;
        }
        this.transporter = nodemailer.createTransport(transportOpts);
        console.log(`[EmailService] Initialized with custom SMTP: ${host}:${port}`);
      }
    }
    this._dbInitialized = true;
  }

  /**
   * Ensure transporter is initialized from DB settings (lazy, once)
   */
  async ensureInitialized() {
    if (this._dbInitialized) return;
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      if (settings.emailProvider === 'brevo' || settings.smtpHost) {
        this.reinitialize(settings);
      }
      this._dbInitialized = true;
    } catch (e) { /* settings not yet available */ }
  }

  /**
   * Check if a specific notification type is enabled
   */
  async isEnabled(notificationKey) {
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const notifs = settings.emailNotifications || {};
      return notifs[notificationKey] !== false; // default true
    } catch (e) { return true; }
  }

  /**
   * Send email using template
   */
  async sendTemplatedEmail(to, templateIdOrType, variables = {}, attachments = []) {
    try {
      let template;
      
      // If templateIdOrType is an ObjectId, fetch by ID
      if (typeof templateIdOrType === 'object' || (typeof templateIdOrType === 'string' && templateIdOrType.length === 24)) {
        template = await EmailTemplate.findById(templateIdOrType);
      } else {
        // Otherwise, get by type
        template = await EmailTemplate.getDefaultByType(templateIdOrType);
      }
      
      if (!template) {
        throw new Error(`Email template not found: ${templateIdOrType}`);
      }

      // Auto-inject common variables used by all branded templates
      const Settings = require('../models/Settings');
      let settings = {};
      try { settings = await Settings.getSettings() || {}; } catch (_) {}
      const enriched = {
        frontendUrl: process.env.FRONTEND_URL || 'https://pesashop.com',
        logoUrl: settings.storeLogo || `${process.env.FRONTEND_URL || 'https://pesashop.com'}/logo.png`,
        supportEmail: settings.storeEmail || process.env.EMAIL_FROM || 'support@pesashop.com',
        storeName: settings.storeName || 'PesaShop',
        year: new Date().getFullYear().toString(),
        ...variables,
      };

      // Render template with variables
      const { subject, html, text } = template.render(enriched);

      // Send email
      return await this.sendEmail({
        to,
        subject,
        html,
        text,
        attachments
      });
    } catch (error) {
      console.error('Templated email error:', error);
      throw error;
    }
  }

  /**
   * Test email connection (Brevo HTTP API or SMTP)
   */
  async testConnection() {
    try {
      await this.ensureInitialized();

      if (this._brevoConfig) {
        // Test Brevo HTTP API by fetching account info
        const res = await axios.get(`${BREVO_API_URL}/account`, {
          headers: { 'api-key': this._brevoConfig.apiKey },
          timeout: 15000,
        });
        const plan = res.data?.plan?.[0]?.type || 'unknown';
        return { success: true, message: `Brevo API connected (plan: ${plan})` };
      }

      if (!this.transporter) {
        return { success: false, message: 'No email provider configured' };
      }
      await this.transporter.verify();
      return { success: true, message: 'SMTP connection successful' };
    } catch (error) {
      const msg = error.response?.data?.message || error.message;
      return { success: false, message: msg };
    }
  }

  /**
   * Send email via Brevo HTTP API
   */
  async _sendViaBrevo({ to, subject, html, text, cc, bcc }) {
    const toList = Array.isArray(to) ? to.map(e => ({ email: e })) : [{ email: to }];
    const payload = {
      sender: { name: this._brevoConfig.fromName, email: this._brevoConfig.fromEmail },
      to: toList,
      subject,
      htmlContent: html || undefined,
      textContent: text || undefined,
    };
    if (cc) {
      payload.cc = Array.isArray(cc) ? cc.map(e => ({ email: e })) : [{ email: cc }];
    }
    if (bcc) {
      payload.bcc = Array.isArray(bcc) ? bcc.map(e => ({ email: e })) : [{ email: bcc }];
    }

    const res = await axios.post(`${BREVO_API_URL}/smtp/email`, payload, {
      headers: {
        'api-key': this._brevoConfig.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    return {
      success: true,
      messageId: res.data?.messageId || res.data?.messageIds?.[0] || 'brevo-ok',
      response: `Brevo API 201 OK`,
    };
  }

  /**
   * Send plain email
   */
  async sendEmail({ to, subject, html, text, attachments = [], cc = null, bcc = null }) {
    const provider = this._brevoConfig ? 'brevo' : 'smtp';
    try {
      await this.ensureInitialized();

      let result;
      // Use Brevo HTTP API if configured
      if (this._brevoConfig) {
        result = await this._sendViaBrevo({ to, subject, html, text, cc, bcc });
      } else {
        if (!this.transporter) {
          throw new Error('Email transporter not configured. Set SMTP settings in admin Settings or .env');
        }

        const mailOptions = {
          from: this.from,
          to,
          subject,
          html,
          text: text || this.stripHtml(html),
          attachments
        };

        if (cc) mailOptions.cc = cc;
        if (bcc) mailOptions.bcc = bcc;

        const info = await this.transporter.sendMail(mailOptions);

        result = {
          success: true,
          messageId: info.messageId,
          response: info.response
        };
      }

      console.log(`[EmailService] Sent OK via ${provider} — to=${to} subject="${subject}" messageId=${result.messageId}`);
      this._logSend({ provider, to, subject, success: true, messageId: result.messageId, response: result.response });
      return result;
    } catch (error) {
      const errDetail = error.response?.data || error.message;
      console.error(`[EmailService] Send FAILED via ${provider} — to=${to} subject="${subject}":`, errDetail);
      this._logSend({ provider, to, subject, success: false, error: typeof errDetail === 'string' ? errDetail : JSON.stringify(errDetail) });
      throw error;
    }
  }

  /**
   * Persist a send outcome to the EmailLog collection. Best-effort — never
   * lets logging failures mask (or replace) the real send error.
   */
  _logSend({ provider, to, subject, success, messageId, error, response }) {
    try {
      const EmailLog = require('../models/EmailLog');
      EmailLog.create({
        provider,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        success,
        messageId,
        error,
        response,
      }).catch(e => console.error('[EmailService] Failed to persist EmailLog:', e.message));
    } catch (e) {
      console.error('[EmailService] EmailLog logging error:', e.message);
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order) {
    if (!(await this.isEnabled('orderConfirmation'))) return;
    await order.populate('customer');
    const customer = order.customer;
    if (!customer?.email) {
      console.warn('sendOrderConfirmation: No customer email for order', order.orderNumber);
      return;
    }
    
    const frontendUrl = process.env.FRONTEND_URL || 'https://pesashop.com';
    const subtotal = order.subtotal ?? order.items?.reduce((sum, i) => sum + (i.total || i.price * i.quantity || 0), 0) ?? 0;
    const shippingCost = order.shipping ?? 0;
    const discount = order.discount ?? 0;
    const fmt = await this._getOrderCurrencyFormatter(order);

    const isPickup = order.deliveryMethod === 'pickup';
    const hubName = order.pickupAddress?.label || '';
    const hubAddress = order.pickupAddress?.address || '';

    const variables = {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      order_date: order.createdAt.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' }),
      order_total: fmt(order.total),
      subtotal: fmt(subtotal),
      shipping_cost: shippingCost > 0 ? fmt(shippingCost) : 'FREE',
      discount: discount > 0 ? `- ${fmt(discount)}` : '',
      order_items: this.formatOrderItems(order.items, fmt),
      billing_address: this.formatAddress(order.billingAddress),
      shipping_address: this.formatAddress(order.shippingAddress),
      // Delivery vs pickup
      delivery_method: isPickup
        ? `Collection from Hub${hubName ? ` — ${hubName}` : ''}`
        : 'Standard Delivery',
      pickup_hub_name: hubName,
      pickup_hub_address: hubAddress,
      pickup_location: isPickup && (hubName || hubAddress)
        ? [hubName, hubAddress].filter(Boolean).join(' — ')
        : '',
      // Template section helpers — avoid needing conditionals in templates
      fulfillment_heading: isPickup ? 'Collecting From' : 'Delivering To',
      fulfillment_details: isPickup
        ? `${hubName ? `<strong>${hubName}</strong>${hubAddress ? '<br>' : ''}` : ''}${hubAddress}`
        : this.formatAddress(order.shippingAddress),
      tracking_url: order.trackingUrl || `${frontendUrl}/account/orders`,
      order_link: order.trackingUrl || `${frontendUrl}/account/orders`
    };

    return await this.sendTemplatedEmail(
      customer.email,
      'order_confirmation',
      variables
    );
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(order) {
    if (!(await this.isEnabled('orderShipped'))) return;
    await order.populate('customer');
    const customer = order.customer;
    if (!customer?.email) {
      console.warn('sendOrderShipped: No customer email for order', order.orderNumber);
      return;
    }

    const variables = {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      tracking_number: order.trackingNumber,
      tracking_url: order.trackingUrl,
      estimated_delivery: order.estimatedDelivery
    };

    return await this.sendTemplatedEmail(
      customer.email,
      'order_shipped',
      variables
    );
  }

  /**
   * Send order delivered notification
   */
  async sendOrderDelivered(order) {
    if (!(await this.isEnabled('orderDelivered'))) return;
    await order.populate('customer');
    const customer = order.customer;
    if (!customer?.email) return;
    const fmt = await this._getOrderCurrencyFormatter(order);
    return await this.sendTemplatedEmail(customer.email, 'order_delivered', {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      order_total: fmt(order.total),
      delivery_date: new Date().toLocaleDateString('en-ZA'),
    });
  }

  /**
   * Send order cancelled notification
   */
  async sendOrderCancelled(order, reason = '') {
    if (!(await this.isEnabled('orderCancelled'))) return;
    await order.populate('customer');
    const customer = order.customer;
    if (!customer?.email) return;
    const fmt = await this._getOrderCurrencyFormatter(order);
    return await this.sendTemplatedEmail(customer.email, 'order_cancelled', {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      order_total: fmt(order.total),
      cancellation_reason: reason || 'No reason provided',
    });
  }

  /**
   * Send order refunded notification
   */
  async sendOrderRefunded(order, refundAmount) {
    if (!(await this.isEnabled('orderRefunded'))) return;
    await order.populate('customer');
    const customer = order.customer;
    if (!customer?.email) return;
    const fmt = await this._getOrderCurrencyFormatter(order);
    return await this.sendTemplatedEmail(customer.email, 'order_refunded', {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      refund_amount: fmt(refundAmount || order.total),
      order_total: fmt(order.total),
    });
  }

  /**
   * Send order note to customer
   */
  async sendOrderNote(order, note) {
    if (!(await this.isEnabled('orderNote'))) return;
    await order.populate('customer');
    const customer = order.customer;
    if (!customer?.email) return;
    return await this.sendTemplatedEmail(customer.email, 'order_note', {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      note_content: note,
    });
  }

  /**
   * Send a generic admin alert (Social Auto-Poster Phase 13, Spec 17) — a
   * plain-text/HTML notification for an observability threshold breach.
   * Deliberately not gated on the emailNotifications preference toggles
   * (those are customer-lifecycle notifications); only requires a
   * configured store admin email, same lookup as sendAdminNewOrder.
   */
  async sendAdminAlert(subject, message) {
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const adminEmail = settings.storeEmail;
      if (!adminEmail) return { sent: false, reason: 'no admin email configured' };

      await this.sendEmail({
        to: adminEmail,
        subject: `[PesaShop Auto-Poster Alert] ${subject}`,
        html: `<p>${message}</p>`,
        text: message
      });
      return { sent: true };
    } catch (error) {
      return { sent: false, reason: error.message };
    }
  }

  /**
   * Send new order admin notification
   */
  async sendAdminNewOrder(order) {
    if (!(await this.isEnabled('adminNewOrder'))) return;
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const adminEmail = settings.storeEmail;
      if (!adminEmail) return;

      await order.populate('customer');
      const customer = order.customer;
      const customerName = customer?.getFullName?.() || customer?.firstName || 'Guest';
      const customerEmail = customer?.email || 'N/A';
      const frontendUrl = process.env.FRONTEND_URL || 'https://pesashop.com';
      const adminUrl = process.env.ADMIN_URL || `${frontendUrl.replace('www.', 'admin.')}`;
      const logoUrl = settings.storeLogo || `${frontendUrl}/logo.png`;
      const fmtZAR = (v) => `R ${(v || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
      const fmtCust = await this._getOrderCurrencyFormatter(order);
      const isNonZAR = order.currency && order.currency !== 'ZAR' && order.exchangeRate !== 1;
      const itemsHtml = this.formatOrderItems(order.items, fmtZAR);
      const shippingAddr = this.formatAddress(order.shippingAddress);
      const totalDisplay = isNonZAR
        ? `${fmtZAR(order.total)} <span style="font-weight:400;font-size:13px;color:#ccc;">(${fmtCust(order.total)} ${order.currency})</span>`
        : fmtZAR(order.total);

      return await this.sendEmail({
        to: adminEmail,
        subject: `🛒 New Order #${order.orderNumber} — R ${order.total.toFixed(2)}${isNonZAR ? ` (${fmtCust(order.total)} ${order.currency})` : ''}`,
        html: `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:'Public Sans',Arial,sans-serif;background:#e2e2e2;">
<table align="center" border="0" cellpadding="0" cellspacing="0" style="max-width:650px;width:100%;margin:20px auto;background:#fff;box-shadow:0 0 14px -4px rgba(0,0,0,0.17);">
<tr><td>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:16px 32px;">
    <tr>
      <td><a href="${frontendUrl}"><img src="${logoUrl}" alt="PesaShop" style="height:40px;width:auto;" /></a></td>
      <td style="text-align:right;font-size:13px;color:#666;">Admin Notification</td>
    </tr>
  </table>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0F604B 0%,#1a8a6a 100%);padding:36px 40px;text-align:center;">
    <tr><td>
      <div style="font-size:44px;margin-bottom:10px;">🛒</div>
      <h1 style="color:#fff;font-size:24px;font-weight:800;margin:0;">New Order Received!</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:15px;margin:10px 0 0;">Order #${order.orderNumber} — <strong>${fmtZAR(order.total)}</strong>${isNonZAR ? ` <span style="opacity:0.7">(${fmtCust(order.total)} ${order.currency})</span>` : ''}</p>
    </td></tr>
  </table>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:28px 32px;">
    <tr><td>
      <table border="0" cellpadding="10" cellspacing="0" width="100%" style="background:#f7f7f7;margin-bottom:20px;">
        <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Customer</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">${customerName} (${customerEmail})</td></tr>
        <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Payment</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">${order.paymentMethod || 'N/A'} — ${order.paymentStatus || 'pending'}</td></tr>
        ${isNonZAR ? `<tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Currency</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">${order.currency} (rate: ${order.exchangeRate})</td></tr>` : ''}
        <tr><td style="font-size:14px;font-weight:600;border-bottom:1px solid #e9e9e9;">Delivery</td><td style="text-align:right;border-bottom:1px solid #e9e9e9;font-size:14px;">${order.deliveryMethod === 'pickup' ? 'Store Pickup' : 'Delivery'}</td></tr>
        <tr><td style="font-size:14px;font-weight:600;">Ship To</td><td style="text-align:right;font-size:14px;">${shippingAddr}</td></tr>
      </table>
      <h3 style="font-size:16px;font-weight:700;margin:0 0 12px;color:#222;">Order Items (${order.items?.length || 0})</h3>
      ${itemsHtml}
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:#f7f7f7;padding:16px;margin-top:16px;">
        <tr><td style="font-size:16px;font-weight:700;color:#222;">Total</td><td style="text-align:right;font-size:16px;font-weight:700;color:#0F604B;">${totalDisplay}</td></tr>
      </table>
    </td></tr>
  </table>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="padding:0 32px 32px;">
    <tr><td align="center">
      <a href="${adminUrl}/orders/${order._id}" style="display:inline-block;background:#0F604B;color:#fff;padding:14px 36px;font-size:15px;font-weight:700;text-decoration:none;border-radius:6px;">View Order in Admin</a>
    </td></tr>
  </table>
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#282834;padding:20px;text-align:center;">
    <tr><td><p style="font-size:12px;color:#aaa;margin:0;">&copy; ${new Date().getFullYear()} PesaShop. Admin notification.</p></td></tr>
  </table>
</td></tr>
</table>
</body></html>`,
      });
    } catch (e) { console.error('Admin new order email error:', e); }
  }

  /**
   * Send laybye created notification (when order with laybye is placed)
   */
  async sendLaybyeCreated(laybye) {
    if (!(await this.isEnabled('laybyeCreated'))) return;
    try {
      if (!laybye.customer || typeof laybye.customer === 'string') await laybye.populate('customer');
      if (!laybye.order || typeof laybye.order === 'string') await laybye.populate('order');
      const customer = laybye.customer;
      if (!customer?.email) return;
      const fmt = await this._getOrderCurrencyFormatter(laybye.order);
      return await this.sendTemplatedEmail(customer.email, 'laybye_created', {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: laybye.order?.orderNumber || 'N/A',
        plan_name: laybye.installmentPlan?.planName || 'Layby Plan',
        deposit_amount: fmt(laybye.depositAmount || 0),
        installment_amount: fmt(laybye.installmentPlan?.installmentAmount || 0),
        total_amount: fmt(laybye.totalAmount || 0),
        payment_link: `${process.env.FRONTEND_URL}/account/laybyes/${laybye._id}`,
      });
    } catch (e) { console.error('Laybye created email error:', e); }
  }

  /**
   * Send laybye payment received notification
   */
  async sendLaybyePaymentReceived(laybye, paymentAmount) {
    if (!(await this.isEnabled('laybyePaymentReceived'))) return;
    try {
      if (!laybye.customer || typeof laybye.customer === 'string') await laybye.populate('customer');
      if (!laybye.order || typeof laybye.order === 'string') await laybye.populate('order');
      const customer = laybye.customer;
      if (!customer?.email) return;
      const fmt = await this._getOrderCurrencyFormatter(laybye.order);
      return await this.sendTemplatedEmail(customer.email, 'laybye_payment', {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: laybye.order?.orderNumber || 'N/A',
        payment_amount: fmt(paymentAmount || 0),
        remaining_balance: fmt(laybye.remainingAmount || 0),
        paid_amount: fmt(laybye.paidAmount || 0),
        total_amount: fmt(laybye.totalAmount || 0),
        payment_link: `${process.env.FRONTEND_URL}/account/laybyes/${laybye._id}`,
      });
    } catch (e) { console.error('Laybye payment email error:', e); }
  }

  /**
   * Send laybye completed notification
   */
  async sendLaybyeCompleted(laybye) {
    if (!(await this.isEnabled('laybyeCompleted'))) return;
    try {
      if (!laybye.customer || typeof laybye.customer === 'string') await laybye.populate('customer');
      if (!laybye.order || typeof laybye.order === 'string') await laybye.populate('order');
      const customer = laybye.customer;
      if (!customer?.email) return;
      const fmt = await this._getOrderCurrencyFormatter(laybye.order);
      return await this.sendTemplatedEmail(customer.email, 'laybye_completed', {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: laybye.order?.orderNumber || 'N/A',
        total_amount: fmt(laybye.totalAmount || 0),
      });
    } catch (e) { console.error('Laybye completed email error:', e); }
  }

  /**
   * Send laybye payment reminder
   * @param {Object} laybye - The laybye object
   * @param {String} type - Type of reminder: 'upcoming', 'overdue', or 'expiry'
   */
  async sendLaybyeReminder(laybye, type = 'upcoming') {
    // Map reminder type to the emailNotifications key so admin panel toggles are respected
    const notifKey = type === 'overdue' ? 'laybyeOverdueReminder'
                   : type === 'expiry'  ? 'laybyeExpiryReminder'
                   : 'laybyeReminder';
    if (!(await this.isEnabled(notifKey))) return;

    try {
      // Ensure laybye is populated
      if (!laybye.customer || typeof laybye.customer === 'string') {
        await laybye.populate('customer');
      }
      if (!laybye.order || typeof laybye.order === 'string') {
        await laybye.populate('order');
      }
      if (!laybye.laybyPlan || typeof laybye.laybyPlan === 'string') {
        await laybye.populate('laybyPlan');
      }

      const customer = laybye.customer;
      const order = laybye.order;
      const plan = laybye.laybyPlan;

      if (!customer || !customer.email) {
        throw new Error('Customer email not found');
      }

      const daysUntilPayment = laybye.nextPaymentDate ? 
        Math.ceil((laybye.nextPaymentDate - new Date()) / (1000 * 60 * 60 * 24)) : 0;
      
      const daysOverdue = laybye.nextPaymentDate && laybye.nextPaymentDate < new Date() ?
        Math.ceil((new Date() - laybye.nextPaymentDate) / (1000 * 60 * 60 * 24)) : 0;

      const daysUntilExpiry = laybye.expiryDate ?
        Math.ceil((laybye.expiryDate - new Date()) / (1000 * 60 * 60 * 24)) : null;

      const fmt = await this._getOrderCurrencyFormatter(order);

      let subject = '';
      let template = 'laybye_reminder';
      const variables = {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: order?.orderNumber || 'N/A',
        payment_amount: fmt(laybye.installmentPlan?.installmentAmount || 0),
        payment_date: laybye.nextPaymentDate ? laybye.nextPaymentDate.toLocaleDateString('en-ZA') : 'N/A',
        remaining_balance: fmt(laybye.remainingAmount || 0),
        total_amount: fmt(laybye.totalAmount || 0),
        paid_amount: fmt(laybye.paidAmount || 0),
        payment_link: `${process.env.FRONTEND_URL}/account/laybyes/${laybye._id}`,
        days_until_payment: daysUntilPayment,
        days_overdue: daysOverdue,
        days_until_expiry: daysUntilExpiry,
        expiry_date: laybye.expiryDate ? laybye.expiryDate.toLocaleDateString('en-ZA') : 'N/A',
        plan_name: plan?.name || 'Layby Plan'
      };

      switch (type) {
        case 'overdue':
          subject = `Overdue Payment Reminder - Order #${order?.orderNumber || 'N/A'}`;
          template = 'laybye_overdue_reminder';
          variables.message = `Your laybye payment is ${daysOverdue} day(s) overdue. Please make your payment as soon as possible.`;
          break;
        case 'expiry':
          subject = `Laybye Expiring Soon - Order #${order?.orderNumber || 'N/A'}`;
          template = 'laybye_expiry_reminder';
          variables.message = `Your laybye will expire in ${daysUntilExpiry} day(s). Please complete your payments before the expiry date.`;
          break;
        default: // 'upcoming'
          subject = `Upcoming Payment Reminder - Order #${order?.orderNumber || 'N/A'}`;
          template = 'laybye_reminder';
          variables.message = `Your next laybye payment of ${variables.payment_amount} is due in ${daysUntilPayment} day(s).`;
          break;
      }

      // Try to send templated email, fallback to simple email if template doesn't exist
      try {
        return await this.sendTemplatedEmail(
          customer.email,
          template,
          variables,
          subject
        );
      } catch (templateError) {
        // Fallback to simple email
        const emailBody = `
          <h2>${subject}</h2>
          <p>Dear ${variables.customer_name},</p>
          <p>${variables.message}</p>
          <p><strong>Order Number:</strong> ${variables.order_number}</p>
          <p><strong>Payment Amount:</strong> ${variables.payment_amount}</p>
          <p><strong>Payment Date:</strong> ${variables.payment_date}</p>
          <p><strong>Remaining Balance:</strong> ${variables.remaining_balance}</p>
          ${variables.days_until_expiry ? `<p><strong>Expiry Date:</strong> ${variables.expiry_date} (${variables.days_until_expiry} days remaining)</p>` : ''}
          <p><a href="${variables.payment_link}">View Laybye Details</a></p>
          <p>Thank you for your business.</p>
        `;

        return await this.sendEmail({
          to: customer.email,
          subject,
          html: emailBody,
        });
      }
    } catch (error) {
      console.error('Error sending laybye reminder email:', error);
      throw error;
    }
  }

  /**
   * Send welcome email to new customer
   */
  async sendWelcomeEmail(user) {
    if (!(await this.isEnabled('newAccount'))) return;
    if (!user?.email) return;
    const variables = {
      customer_name: user.getFullName?.() || user.firstName || 'Customer',
      login_url: `${process.env.FRONTEND_URL}/login`,
      shop_url: process.env.FRONTEND_URL
    };

    return await this.sendTemplatedEmail(
      user.email,
      'new_customer',
      variables
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(user, resetToken) {
    if (!user?.email) return;
    const variables = {
      customer_name: user.getFullName?.() || user.firstName || 'Customer',
      reset_url: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      expiry_hours: 24
    };

    return await this.sendTemplatedEmail(
      user.email,
      'password_reset',
      variables
    );
  }

  /**
   * Send payment confirmation email
   */
  async sendPaymentConfirmation(order) {
    if (!(await this.isEnabled('orderConfirmation'))) return;
    await order.populate('customer');
    const customer = order.customer;
    if (!customer?.email) return;
    try {
      const fmt = await this._getOrderCurrencyFormatter(order);
      return await this.sendTemplatedEmail(customer.email, 'payment_confirmation', {
        customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
        order_number: order.orderNumber,
        order_total: fmt(order.total),
        payment_method: order.paymentMethod || 'N/A',
      });
    } catch (templateErr) {
      // Fallback to simple email if no payment_confirmation template exists
      const fmt = await this._getOrderCurrencyFormatter(order);
      return await this.sendEmail({
        to: customer.email,
        subject: `Payment Confirmed - Order #${order.orderNumber}`,
        html: `<h2>Payment Confirmed</h2><p>Dear ${customer.getFullName?.() || customer.firstName || 'Customer'},</p><p>Your payment for order <strong>#${order.orderNumber}</strong> has been confirmed.</p><p><strong>Total:</strong> ${fmt(order.total)}</p><p>Thank you for your purchase!</p>`,
      });
    }
  }

  /**
   * Send gift card email
   */
  async sendGiftCard(giftCard) {
    const variables = {
      recipient_name: giftCard.recipientName,
      sender_name: giftCard.senderName,
      sender_message: giftCard.senderMessage,
      gift_card_code: giftCard.code,
      gift_card_balance: `R ${giftCard.initialBalance.toFixed(2)}`,
      redeem_url: `${process.env.FRONTEND_URL}/gift-cards/${giftCard.code}`
    };

    return await this.sendEmail({
      to: giftCard.recipientEmail,
      subject: `You've received a gift card from ${giftCard.senderName}`,
      html: this.renderGiftCardEmail(variables),
      text: `You've received a gift card worth R${giftCard.initialBalance} from ${giftCard.senderName}`
    });
  }

  /**
   * Send bulk email
   */
  async sendBulkEmail(recipients, subject, html, text = null) {
    const results = {
      sent: [],
      failed: []
    };

    for (const recipient of recipients) {
      try {
        await this.sendEmail({
          to: recipient.email,
          subject,
          html: this.personalizeContent(html, recipient),
          text: text ? this.personalizeContent(text, recipient) : null
        });
        
        results.sent.push(recipient.email);
      } catch (error) {
        results.failed.push({
          email: recipient.email,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Build a currency formatter for an order.
   * Returns fmt(zarAmount) → formatted string in the customer's chosen currency.
   * Admin variant: fmtZAR(zarAmount) always formats in ZAR.
   */
  async _getOrderCurrencyFormatter(order) {
    const code = order?.currency || 'ZAR';
    const rate = order?.exchangeRate || 1;
    try {
      const curr = await Currency.findOne({ code, isActive: true });
      if (curr && !curr.isBaseCurrency && rate !== 1) {
        // Customer chose a non-ZAR currency
        return (zarAmount) => {
          const converted = (zarAmount || 0) / rate;
          return curr.formatAmount(converted);
        };
      }
    } catch (_) { /* fall through to ZAR default */ }
    // Default ZAR formatter
    return (zarAmount) => `R ${(zarAmount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  /**
   * Helper: Format order items for email
   */
  formatOrderItems(items, fmt) {
    if (!items || items.length === 0) return '<p style="color:#999;font-size:14px;">No items</p>';
    const f = fmt || ((v) => `R ${(v || 0).toFixed(2)}`);
    return items.map(item => {
      const imgUrl = item.image || item.images?.[0] || '';
      const name = item.name || 'Product';
      let variant = item.variant || item.selectedVariant || '';
      if (!variant && item.variation && typeof item.variation === 'object') {
        variant = Object.entries(item.variation).map(([k, v]) => `${k}: ${v}`).join(', ');
      }
      const qty = item.quantity || 1;
      const price = typeof item.price === 'number' ? item.price : 0;
      const total = typeof item.total === 'number' ? item.total : price * qty;
      return `<table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom:1px solid #eee;padding:14px 0;">
  <tr>
    <td style="width:70px;vertical-align:top;padding-right:14px;">
      ${imgUrl ? `<img src="${imgUrl}" alt="${name}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #eee;" />` : `<div style="width:64px;height:64px;background:#f0f0f0;border-radius:6px;text-align:center;line-height:64px;font-size:28px;">&#128722;</div>`}
    </td>
    <td style="vertical-align:top;font-family:'Public Sans',Arial,sans-serif;">
      <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#222;">${name}</p>
      ${variant ? `<p style="margin:0 0 4px;font-size:12px;color:#888;">${variant}</p>` : ''}
      <p style="margin:0;font-size:13px;color:#666;">Qty: ${qty} &times; ${f(price)}</p>
    </td>
    <td style="vertical-align:top;text-align:right;white-space:nowrap;font-family:'Public Sans',Arial,sans-serif;">
      <p style="margin:0;font-size:14px;font-weight:700;color:#0F604B;">${f(total)}</p>
    </td>
  </tr>
</table>`;
    }).join('');
  }

  /**
   * Helper: Format address for email
   */
  formatAddress(address) {
    if (!address) return 'N/A';
    const parts = [];
    if (address.firstName || address.lastName) parts.push(`${address.firstName || ''} ${address.lastName || ''}`.trim());
    if (address.street || address.address1) parts.push(address.street || address.address1);
    if (address.street2 || address.address2) parts.push(address.street2 || address.address2);
    const cityLine = [address.city, address.state || address.province, address.postalCode || address.zipCode].filter(Boolean).join(', ');
    if (cityLine) parts.push(cityLine);
    if (address.country) parts.push(address.country);
    return parts.join('<br>') || 'N/A';
  }

  /**
   * Helper: Strip HTML tags
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Helper: Personalize content
   */
  personalizeContent(content, recipient) {
    let personalized = content;
    
    Object.keys(recipient).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      personalized = personalized.replace(regex, recipient[key] || '');
    });
    
    return personalized;
  }

  /**
   * Helper: Render gift card email
   */
  renderGiftCardEmail(variables) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Inter', Arial, sans-serif; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0e604a; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background: #f9f9f9; }
          .gift-card { background: white; border: 2px solid #f7bd20; padding: 30px; margin: 20px 0; text-align: center; }
          .code { font-size: 24px; font-weight: bold; color: #0e604a; letter-spacing: 2px; }
          .button { display: inline-block; padding: 12px 30px; background: transparent; border: 2px solid #0e604a; color: #0e604a; text-decoration: none; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 You've Received a Gift Card!</h1>
          </div>
          <div class="content">
            <p>Hi ${variables.recipient_name},</p>
            <p>${variables.sender_name} has sent you a gift card!</p>
            ${variables.sender_message ? `<p><em>"${variables.sender_message}"</em></p>` : ''}
            <div class="gift-card">
              <h2>Your Gift Card</h2>
              <p>Balance: ${variables.gift_card_balance}</p>
              <div class="code">${variables.gift_card_code}</div>
              <a href="${variables.redeem_url}" class="button">Redeem Now</a>
            </div>
            <p>Start shopping now and enjoy your gift!</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
