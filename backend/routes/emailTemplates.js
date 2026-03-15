const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const EmailTemplate = require('../models/EmailTemplate');

router.get('/', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const { type, isActive } = req.query;
    let query = {};

    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const templates = await EmailTemplate.find(query)
      .select('-htmlContent -textContent')
      .sort('-createdAt');

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email templates',
      error: error.message
    });
  }
});

router.get('/:id', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching email template:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching email template',
      error: error.message
    });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    if (!req.body.slug && req.body.name) {
      req.body.slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    }

    const template = await EmailTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating email template:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Template with this name or slug already exists'
      });
    }

    res.status(400).json({
      success: false,
      message: 'Error creating email template',
      error: error.message
    });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    let template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    template = await EmailTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating email template',
      error: error.message
    });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    if (template.isDefault) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default template'
      });
    }

    await template.deleteOne();

    res.json({
      success: true,
      message: 'Email template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting email template:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting email template',
      error: error.message
    });
  }
});

router.post('/:id/preview', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    let previewHtml = template.htmlContent;
    const sampleData = req.body.sampleData || {};

    template.variables.forEach(variable => {
      const value = sampleData[variable.name] || variable.example || `{{${variable.name}}}`;
      const regex = new RegExp(`{{${variable.name}}}`, 'g');
      previewHtml = previewHtml.replace(regex, value);
    });

    res.json({
      success: true,
      data: {
        subject: template.subject,
        html: previewHtml,
        text: template.textContent
      }
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    res.status(500).json({
      success: false,
      message: 'Error previewing email template',
      error: error.message
    });
  }
});

router.post('/:id/test', protect, authorize('admin'), async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Email template not found'
      });
    }

    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({
        success: false,
        message: 'Please provide test email address'
      });
    }

    const emailService = require('../services/emailService');

    // Build sample variables from template variable definitions
    const sampleVars = {};
    (template.variables || []).forEach(v => {
      sampleVars[v.name] = v.example || `[${v.name}]`;
    });

    const { subject, html, text } = template.render(sampleVars);

    await emailService.sendEmail({
      to: testEmail,
      subject: `[TEST] ${subject}`,
      html,
      text,
    });

    res.json({
      success: true,
      message: `Test email sent to ${testEmail}`,
      data: { to: testEmail, subject, template: template.name }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      message: `Failed to send test email: ${error.message}`,
      error: error.message
    });
  }
});

// ─── Seed default templates ───
router.post('/seed', protect, authorize('admin'), async (req, res) => {
  try {
    const existing = await EmailTemplate.find({});
    const existingTypes = new Set(existing.map(t => t.type));

    const baseHtml = (title, body) => `<!DOCTYPE html>
<html><head><style>
body{font-family:'Segoe UI',Arial,sans-serif;margin:0;padding:0;background:#f4f4f4}
.c{max-width:600px;margin:0 auto;background:#fff}
.h{background:#1b5e35;color:#fff;padding:30px;text-align:center}
.h h1{margin:0;font-size:22px}
.b{padding:30px;color:#333;line-height:1.6}
.f{background:#f8f9fa;padding:20px;text-align:center;font-size:12px;color:#999}
.btn{display:inline-block;padding:12px 30px;background:#1b5e35;color:#fff;text-decoration:none;border-radius:4px;margin:15px 0}
</style></head><body>
<div class="c">
<div class="h"><h1>${title}</h1></div>
<div class="b">${body}</div>
<div class="f"><p>&copy; ${new Date().getFullYear()} PesaShop. All rights reserved.</p></div>
</div></body></html>`;

    const defaults = [
      {
        name: 'Order Confirmation',
        slug: 'order-confirmation',
        type: 'order_confirmation',
        subject: 'Order Confirmed — #{{order_number}}',
        htmlContent: baseHtml('Order Confirmed', '<p>Dear {{customer_name}},</p><p>Thank you for your order <strong>#{{order_number}}</strong>.</p><p><strong>Total:</strong> {{order_total}}</p><p>We will notify you once your order ships.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'order_total' }, { name: 'order_date' }],
        isDefault: true,
      },
      {
        name: 'Order Shipped',
        slug: 'order-shipped',
        type: 'order_shipped',
        subject: 'Your Order #{{order_number}} Has Shipped',
        htmlContent: baseHtml('Order Shipped', '<p>Dear {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been shipped!</p><p><strong>Tracking:</strong> {{tracking_number}}</p><a href="{{tracking_url}}" class="btn">Track Your Order</a>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'tracking_number' }, { name: 'tracking_url' }],
        isDefault: true,
      },
      {
        name: 'Welcome Email',
        slug: 'welcome-email',
        type: 'new_account',
        subject: 'Welcome to PesaShop!',
        htmlContent: baseHtml('Welcome!', '<p>Dear {{customer_name}},</p><p>Welcome to PesaShop! Your account has been created successfully.</p><a href="{{shop_url}}" class="btn">Start Shopping</a>'),
        variables: [{ name: 'customer_name' }, { name: 'login_url' }, { name: 'shop_url' }],
        isDefault: true,
      },
      {
        name: 'Password Reset',
        slug: 'password-reset',
        type: 'password_reset',
        subject: 'Reset Your Password',
        htmlContent: baseHtml('Password Reset', '<p>Dear {{customer_name}},</p><p>We received a request to reset your password. Click below to set a new password:</p><a href="{{reset_url}}" class="btn">Reset Password</a><p style="font-size:13px;color:#999">This link expires in {{expiry_hours}} hours. If you didn\'t request this, please ignore this email.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'reset_url' }, { name: 'expiry_hours' }],
        isDefault: true,
      },
      {
        name: 'Laybye Application Received',
        slug: 'laybye-application-received',
        type: 'laybye_application_received',
        subject: 'Layby Application Received — {{product_name}}',
        htmlContent: baseHtml('Application Received', '<p>Dear {{customer_name}},</p><p>We have received your layby application for <strong>{{product_name}}</strong>.</p><p><strong>Plan:</strong> {{plan_name}}<br><strong>Deposit:</strong> {{deposit_amount}}<br><strong>Installments:</strong> {{installment_details}}</p><p>Our team will review your application and notify you once a decision has been made. This usually takes 1-2 business days.</p><p>You can track your application status in your account.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'product_name' }, { name: 'plan_name' }, { name: 'deposit_amount' }, { name: 'installment_details' }],
        isDefault: true,
      },
      {
        name: 'Laybye Application Approved',
        slug: 'laybye-application-approved',
        type: 'laybye_application_approved',
        subject: 'Your Layby Application Has Been Approved!',
        htmlContent: baseHtml('Application Approved!', '<p>Dear {{customer_name}},</p><p>Great news! Your layby application for <strong>{{product_name}}</strong> has been approved.</p><p><strong>Plan:</strong> {{plan_name}}<br><strong>Price:</strong> {{product_price}}</p><p>Our team will be in touch to set up your payment plan.</p><a href="{{account_url}}" class="btn">View in My Account</a>'),
        variables: [{ name: 'customer_name' }, { name: 'product_name' }, { name: 'plan_name' }, { name: 'product_price' }, { name: 'account_url' }],
        isDefault: true,
      },
      {
        name: 'Laybye Application Rejected',
        slug: 'laybye-application-rejected',
        type: 'laybye_application_rejected',
        subject: 'Update on Your Layby Application',
        htmlContent: baseHtml('Application Update', '<p>Dear {{customer_name}},</p><p>Thank you for your interest in our layby program. Unfortunately, we are unable to approve your application for <strong>{{product_name}}</strong> at this time.</p>{{#rejection_reason}}<p><strong>Reason:</strong> {{rejection_reason}}</p>{{/rejection_reason}}<p>If you have questions, please contact us.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'product_name' }, { name: 'rejection_reason' }],
        isDefault: true,
      },
      {
        name: 'Laybye Payment Reminder',
        slug: 'laybye-reminder',
        type: 'laybye_reminder',
        subject: 'Upcoming Payment Reminder — Order #{{order_number}}',
        htmlContent: baseHtml('Payment Reminder', '<p>Dear {{customer_name}},</p><p>{{message}}</p><p><strong>Amount Due:</strong> {{payment_amount}}<br><strong>Due Date:</strong> {{payment_date}}<br><strong>Remaining:</strong> {{remaining_balance}}</p><a href="{{payment_link}}" class="btn">Make Payment</a>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'payment_amount' }, { name: 'payment_date' }, { name: 'remaining_balance' }, { name: 'message' }, { name: 'payment_link' }],
        isDefault: true,
      },
      {
        name: 'Laybye Overdue Reminder',
        slug: 'laybye-overdue-reminder',
        type: 'laybye_overdue_reminder',
        subject: 'Overdue Payment — Order #{{order_number}}',
        htmlContent: baseHtml('Overdue Payment', '<p>Dear {{customer_name}},</p><p style="color:#dc3545;font-weight:bold">{{message}}</p><p><strong>Amount Due:</strong> {{payment_amount}}<br><strong>Was Due:</strong> {{payment_date}}<br><strong>Days Overdue:</strong> {{days_overdue}}</p><a href="{{payment_link}}" class="btn" style="background:#dc3545">Pay Now</a>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'payment_amount' }, { name: 'payment_date' }, { name: 'days_overdue' }, { name: 'message' }, { name: 'payment_link' }],
        isDefault: true,
      },
      {
        name: 'Order Delivered',
        slug: 'order-delivered',
        type: 'order_delivered',
        subject: 'Your Order #{{order_number}} Has Been Delivered',
        htmlContent: baseHtml('Order Delivered', '<p>Dear {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been delivered!</p><p>We hope you enjoy your purchase. If you have any questions, please don\'t hesitate to contact us.</p><p>We would love to hear your feedback — please consider leaving a review for the products you purchased.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'order_total' }, { name: 'delivery_date' }],
        isDefault: true,
      },
      {
        name: 'Order Cancelled',
        slug: 'order-cancelled',
        type: 'order_cancelled',
        subject: 'Order #{{order_number}} Has Been Cancelled',
        htmlContent: baseHtml('Order Cancelled', '<p>Dear {{customer_name}},</p><p>Your order <strong>#{{order_number}}</strong> has been cancelled.</p><p><strong>Reason:</strong> {{cancellation_reason}}</p><p>If you have any questions about this cancellation, please contact our support team.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'order_total' }, { name: 'cancellation_reason' }],
        isDefault: true,
      },
      {
        name: 'Order Refunded',
        slug: 'order-refunded',
        type: 'order_refunded',
        subject: 'Refund Processed — Order #{{order_number}}',
        htmlContent: baseHtml('Refund Processed', '<p>Dear {{customer_name}},</p><p>A refund of <strong>{{refund_amount}}</strong> has been processed for your order <strong>#{{order_number}}</strong>.</p><p>Please allow 5-10 business days for the refund to reflect in your account.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'refund_amount' }, { name: 'order_total' }],
        isDefault: true,
      },
      {
        name: 'Order Note',
        slug: 'order-note',
        type: 'order_note',
        subject: 'Note Added to Order #{{order_number}}',
        htmlContent: baseHtml('Order Update', '<p>Dear {{customer_name}},</p><p>A note has been added to your order <strong>#{{order_number}}</strong>:</p><div style="background:#f8f9fa;padding:15px;border-radius:4px;margin:15px 0"><p style="margin:0">{{note_content}}</p></div>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'note_content' }],
        isDefault: true,
      },
      {
        name: 'Laybye Created',
        slug: 'laybye-created',
        type: 'laybye_created',
        subject: 'Your Layby Plan Has Been Created — Order #{{order_number}}',
        htmlContent: baseHtml('Layby Created', '<p>Dear {{customer_name}},</p><p>Your layby plan for order <strong>#{{order_number}}</strong> has been set up successfully.</p><p><strong>Plan:</strong> {{plan_name}}<br><strong>Deposit Paid:</strong> {{deposit_amount}}<br><strong>Installment Amount:</strong> {{installment_amount}}<br><strong>Total:</strong> {{total_amount}}</p><a href="{{payment_link}}" class="btn">View Layby Details</a>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'plan_name' }, { name: 'deposit_amount' }, { name: 'installment_amount' }, { name: 'total_amount' }, { name: 'payment_link' }],
        isDefault: true,
      },
      {
        name: 'Laybye Payment Received',
        slug: 'laybye-payment',
        type: 'laybye_payment',
        subject: 'Payment Received — Order #{{order_number}}',
        htmlContent: baseHtml('Payment Received', '<p>Dear {{customer_name}},</p><p>We have received your layby payment of <strong>{{payment_amount}}</strong> for order <strong>#{{order_number}}</strong>.</p><p><strong>Paid So Far:</strong> {{paid_amount}}<br><strong>Remaining:</strong> {{remaining_balance}}<br><strong>Total:</strong> {{total_amount}}</p><a href="{{payment_link}}" class="btn">View Layby Details</a>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'payment_amount' }, { name: 'remaining_balance' }, { name: 'paid_amount' }, { name: 'total_amount' }, { name: 'payment_link' }],
        isDefault: true,
      },
      {
        name: 'Laybye Completed',
        slug: 'laybye-completed',
        type: 'laybye_completed',
        subject: 'Layby Complete — Order #{{order_number}}',
        htmlContent: baseHtml('Layby Complete!', '<p>Dear {{customer_name}},</p><p>Congratulations! Your layby for order <strong>#{{order_number}}</strong> has been fully paid!</p><p><strong>Total Paid:</strong> {{total_amount}}</p><p>Your order will now be processed for fulfilment. Thank you for your patience!</p>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'total_amount' }],
        isDefault: true,
      },
      {
        name: 'Laybye Expiry Reminder',
        slug: 'laybye-expiry-reminder',
        type: 'laybye_expiry_reminder',
        subject: 'Your Layby Is Expiring Soon — Order #{{order_number}}',
        htmlContent: baseHtml('Layby Expiring', '<p>Dear {{customer_name}},</p><p style="color:#dc3545">Your layby for order <strong>#{{order_number}}</strong> will expire on <strong>{{expiry_date}}</strong>.</p><p><strong>Remaining Balance:</strong> {{remaining_balance}}</p><p>Please complete your payments before the expiry date to avoid cancellation.</p><a href="{{payment_link}}" class="btn" style="background:#dc3545">Make Payment</a>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'expiry_date' }, { name: 'remaining_balance' }, { name: 'payment_link' }],
        isDefault: true,
      },
      {
        name: 'Loyalty Points Earned',
        slug: 'loyalty-points-earned',
        type: 'loyalty_points_earned',
        subject: 'You Earned {{points_earned}} PesaCoins!',
        htmlContent: baseHtml('Points Earned!', '<p>Dear {{customer_name}},</p><p>You have earned <strong>{{points_earned}} PesaCoins</strong>!</p><p><strong>Reason:</strong> {{reason}}<br><strong>Total Balance:</strong> {{total_points}} PesaCoins</p><p>Use your PesaCoins on your next purchase for a discount.</p>'),
        variables: [{ name: 'customer_name' }, { name: 'points_earned' }, { name: 'total_points' }, { name: 'reason' }],
        isDefault: true,
      },
      {
        name: 'Loyalty Points Redeemed',
        slug: 'loyalty-points-redeemed',
        type: 'loyalty_points_redeemed',
        subject: 'PesaCoins Redeemed Successfully',
        htmlContent: baseHtml('Points Redeemed', '<p>Dear {{customer_name}},</p><p>You have redeemed <strong>{{points_redeemed}} PesaCoins</strong> for a discount of <strong>{{discount_amount}}</strong>.</p><p><strong>Remaining Balance:</strong> {{remaining_points}} PesaCoins</p>'),
        variables: [{ name: 'customer_name' }, { name: 'points_redeemed' }, { name: 'remaining_points' }, { name: 'discount_amount' }],
        isDefault: true,
      },
      {
        name: 'Gift Card Issued',
        slug: 'gift-card-issued',
        type: 'gift_card_issued',
        subject: 'You\'ve Received a Gift Card from {{sender_name}}!',
        htmlContent: baseHtml('Gift Card!', '<p>Dear {{recipient_name}},</p><p><strong>{{sender_name}}</strong> has sent you a gift card!</p><p style="font-style:italic;color:#666">{{sender_message}}</p><div style="background:#f8f9fa;padding:20px;text-align:center;margin:15px 0;border:2px solid #f7bd20"><p style="font-size:24px;font-weight:bold;color:#1b5e35;letter-spacing:2px;margin:0">{{gift_card_code}}</p><p style="margin:10px 0 0"><strong>Balance:</strong> {{gift_card_balance}}</p></div><a href="{{redeem_url}}" class="btn">Redeem Now</a>'),
        variables: [{ name: 'recipient_name' }, { name: 'sender_name' }, { name: 'sender_message' }, { name: 'gift_card_code' }, { name: 'gift_card_balance' }, { name: 'redeem_url' }],
        isDefault: true,
      },
      {
        name: 'Review Reminder',
        slug: 'review-reminder',
        type: 'review_reminder',
        subject: 'How Was Your Purchase? Leave a Review!',
        htmlContent: baseHtml('Review Your Purchase', '<p>Dear {{customer_name}},</p><p>We hope you\'re enjoying your recent purchase! We\'d love to hear your feedback.</p><p>Your review helps other customers make informed decisions and helps us improve our products and services.</p><a href="{{review_url}}" class="btn">Write a Review</a>'),
        variables: [{ name: 'customer_name' }, { name: 'order_number' }, { name: 'review_url' }],
        isDefault: true,
      },
    ];

    let created = 0;
    for (const tpl of defaults) {
      if (!existingTypes.has(tpl.type)) {
        await EmailTemplate.create(tpl);
        created++;
      }
    }

    res.json({
      success: true,
      message: `Seeded ${created} default templates (${defaults.length - created} already existed)`,
      created,
    });
  } catch (error) {
    console.error('Error seeding templates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
