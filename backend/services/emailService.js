const nodemailer = require('nodemailer');
const axios = require('axios');
const EmailTemplate = require('../models/EmailTemplate');

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
        logoUrl: settings.logoUrl || `${process.env.FRONTEND_URL || 'https://pesashop.com'}/logo.png`,
        supportEmail: settings.storeEmail || process.env.EMAIL_FROM || 'support@pesashop.com',
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
    try {
      await this.ensureInitialized();

      // Use Brevo HTTP API if configured
      if (this._brevoConfig) {
        return await this._sendViaBrevo({ to, subject, html, text, cc, bcc });
      }

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

      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('Email send error:', error.response?.data || error.message);
      throw error;
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
    
    const variables = {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      order_date: order.createdAt.toLocaleDateString(),
      order_total: `R ${order.total.toFixed(2)}`,
      order_items: this.formatOrderItems(order.items),
      billing_address: this.formatAddress(order.billingAddress),
      shipping_address: this.formatAddress(order.shippingAddress),
      delivery_method: order.deliveryMethod || 'delivery',
      pickup_location: order.deliveryMethod === 'pickup' && order.pickupAddress
        ? `${order.pickupAddress.label || ''} — ${order.pickupAddress.address || ''}`.trim()
        : '',
      tracking_url: order.trackingUrl || '#'
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
    return await this.sendTemplatedEmail(customer.email, 'order_delivered', {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      order_total: `R ${order.total.toFixed(2)}`,
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
    return await this.sendTemplatedEmail(customer.email, 'order_cancelled', {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      order_total: `R ${order.total.toFixed(2)}`,
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
    return await this.sendTemplatedEmail(customer.email, 'order_refunded', {
      customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
      order_number: order.orderNumber,
      refund_amount: `R ${(refundAmount || order.total).toFixed(2)}`,
      order_total: `R ${order.total.toFixed(2)}`,
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
   * Send new order admin notification
   */
  async sendAdminNewOrder(order) {
    if (!(await this.isEnabled('adminNewOrder'))) return;
    try {
      const Settings = require('../models/Settings');
      const settings = await Settings.getSettings();
      const adminEmail = settings.storeEmail;
      if (!adminEmail) return;
      return await this.sendEmail({
        to: adminEmail,
        subject: `New Order #${order.orderNumber} — R ${order.total.toFixed(2)}`,
        html: `<h2>New Order Received</h2><p><strong>Order:</strong> #${order.orderNumber}</p><p><strong>Total:</strong> R ${order.total.toFixed(2)}</p><p><strong>Items:</strong> ${order.items?.length || 0}</p><p><a href="${process.env.ADMIN_URL || 'http://localhost:3001'}/orders/${order._id}">View Order</a></p>`,
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
      return await this.sendTemplatedEmail(customer.email, 'laybye_created', {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: laybye.order?.orderNumber || 'N/A',
        plan_name: laybye.installmentPlan?.planName || 'Layby Plan',
        deposit_amount: `R ${(laybye.depositAmount || 0).toFixed(2)}`,
        installment_amount: `R ${(laybye.installmentPlan?.installmentAmount || 0).toFixed(2)}`,
        total_amount: `R ${(laybye.totalAmount || 0).toFixed(2)}`,
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
      return await this.sendTemplatedEmail(customer.email, 'laybye_payment', {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: laybye.order?.orderNumber || 'N/A',
        payment_amount: `R ${(paymentAmount || 0).toFixed(2)}`,
        remaining_balance: `R ${(laybye.remainingAmount || 0).toFixed(2)}`,
        paid_amount: `R ${(laybye.paidAmount || 0).toFixed(2)}`,
        total_amount: `R ${(laybye.totalAmount || 0).toFixed(2)}`,
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
      return await this.sendTemplatedEmail(customer.email, 'laybye_completed', {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: laybye.order?.orderNumber || 'N/A',
        total_amount: `R ${(laybye.totalAmount || 0).toFixed(2)}`,
      });
    } catch (e) { console.error('Laybye completed email error:', e); }
  }

  /**
   * Send laybye payment reminder
   * @param {Object} laybye - The laybye object
   * @param {String} type - Type of reminder: 'upcoming', 'overdue', or 'expiry'
   */
  async sendLaybyeReminder(laybye, type = 'upcoming') {
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

      let subject = '';
      let template = 'laybye_reminder';
      const variables = {
        customer_name: customer.firstName ? `${customer.firstName} ${customer.lastName}` : customer.email,
        order_number: order?.orderNumber || 'N/A',
        payment_amount: `R ${laybye.installmentPlan?.installmentAmount?.toFixed(2) || '0.00'}`,
        payment_date: laybye.nextPaymentDate ? laybye.nextPaymentDate.toLocaleDateString('en-ZA') : 'N/A',
        remaining_balance: `R ${laybye.remainingAmount?.toFixed(2) || '0.00'}`,
        total_amount: `R ${laybye.totalAmount?.toFixed(2) || '0.00'}`,
        paid_amount: `R ${laybye.paidAmount?.toFixed(2) || '0.00'}`,
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
      return await this.sendTemplatedEmail(customer.email, 'payment_confirmation', {
        customer_name: customer.getFullName?.() || customer.firstName || 'Customer',
        order_number: order.orderNumber,
        order_total: `R ${order.total.toFixed(2)}`,
        payment_method: order.paymentMethod || 'N/A',
      });
    } catch (templateErr) {
      // Fallback to simple email if no payment_confirmation template exists
      return await this.sendEmail({
        to: customer.email,
        subject: `Payment Confirmed - Order #${order.orderNumber}`,
        html: `<h2>Payment Confirmed</h2><p>Dear ${customer.getFullName?.() || customer.firstName || 'Customer'},</p><p>Your payment for order <strong>#${order.orderNumber}</strong> has been confirmed.</p><p><strong>Total:</strong> R ${order.total.toFixed(2)}</p><p>Thank you for your purchase!</p>`,
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
   * Helper: Format order items for email
   */
  formatOrderItems(items) {
    return items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>R ${item.price.toFixed(2)}</td>
        <td>R ${item.total.toFixed(2)}</td>
      </tr>
    `).join('');
  }

  /**
   * Helper: Format address for email
   */
  formatAddress(address) {
    if (!address) return 'N/A';
    
    return `
      ${address.firstName} ${address.lastName}<br>
      ${address.street}<br>
      ${address.street2 ? address.street2 + '<br>' : ''}
      ${address.city}, ${address.state} ${address.postalCode}<br>
      ${address.country}
    `;
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
