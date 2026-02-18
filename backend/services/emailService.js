const nodemailer = require('nodemailer');
const EmailTemplate = require('../models/EmailTemplate');

class EmailService {
  constructor() {
    this.transporter = null;
    this.from = process.env.EMAIL_FROM || 'noreply@ecommerce.com';
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT) || 587,
      secure: parseInt(process.env.EMAIL_PORT) === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
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

      // Render template with variables
      const { subject, html, text } = template.render(variables);

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
   * Send plain email
   */
  async sendEmail({ to, subject, html, text, attachments = [], cc = null, bcc = null }) {
    try {
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
      console.error('Email send error:', error);
      throw error;
    }
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(order) {
    const user = await order.populate('customer');
    
    const variables = {
      customer_name: user.customer.getFullName(),
      order_number: order.orderNumber,
      order_date: order.createdAt.toLocaleDateString(),
      order_total: `R ${order.total.toFixed(2)}`,
      order_items: this.formatOrderItems(order.items),
      billing_address: this.formatAddress(order.billingAddress),
      shipping_address: this.formatAddress(order.shippingAddress),
      tracking_url: order.trackingUrl || '#'
    };

    return await this.sendTemplatedEmail(
      user.customer.email,
      'order_confirmation',
      variables
    );
  }

  /**
   * Send order shipped notification
   */
  async sendOrderShipped(order) {
    const user = await order.populate('customer');
    
    const variables = {
      customer_name: user.customer.getFullName(),
      order_number: order.orderNumber,
      tracking_number: order.trackingNumber,
      tracking_url: order.trackingUrl,
      estimated_delivery: order.estimatedDelivery
    };

    return await this.sendTemplatedEmail(
      user.customer.email,
      'order_shipped',
      variables
    );
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

        return await this.sendEmail(
          customer.email,
          subject,
          emailBody
        );
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
    const variables = {
      customer_name: user.getFullName(),
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
    const variables = {
      customer_name: user.getFullName(),
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
   * Test email configuration
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { success: false, message: error.message };
    }
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
