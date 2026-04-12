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

router.post('/', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
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

router.put('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
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

router.delete('/:id', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
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

router.post('/:id/test', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
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
    const Settings = require('../models/Settings');

    // Inject live globals (logo, store name, etc.) so the rendered email looks real
    let settings = {};
    try { settings = (await Settings.findOne()) || {}; } catch (_) {}
    const frontendUrl = process.env.FRONTEND_URL || 'https://pesashop.com';
    const globals = {
      storeName:    settings.storeName    || 'PesaShop',
      supportEmail: settings.storeEmail   || process.env.EMAIL_FROM || 'support@pesashop.com',
      logoUrl:      settings.storeLogo    || `${frontendUrl}/logo.png`,
      frontendUrl,
      year:         new Date().getFullYear().toString(),
    };

    // Build sample variables from template variable definitions, then overlay globals
    const sampleVars = { ...globals };
    (template.variables || []).forEach(v => {
      if (!globals[v.name]) sampleVars[v.name] = v.example || `[${v.name}]`;
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

// ─── Send campaign to audience ───
router.post('/:id/send-campaign', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const template = await EmailTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ success: false, message: 'Template not found' });
    if (!template.isActive) return res.status(400).json({ success: false, message: 'Template is not active' });

    const { audience = 'all', groupId, emails = [] } = req.body;
    const User = require('../models/User');
    const emailService = require('../services/emailService');

    let recipients = [];

    if (audience === 'manual') {
      recipients = emails.map(email => ({ email, firstName: '' }));
    } else if (audience === 'group' && groupId) {
      const CustomerGroup = require('../models/CustomerGroup');
      const group = await CustomerGroup.findById(groupId);
      if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

      let query = { role: 'customer', marketingOptIn: true };
      if (group.isDynamic && group.rules?.length) {
        // Apply the same rule logic used by the rule engine
        const buildQuery = (rules, logic) => {
          const conditions = rules.map(rule => {
            const { field, operator, value } = rule;
            let parsed = value;
            if (!isNaN(value) && value !== '') parsed = Number(value);
            if (value === 'true') parsed = true;
            if (value === 'false') parsed = false;
            switch (operator) {
              case 'eq':   return { [field]: parsed };
              case 'neq':  return { [field]: { $ne: parsed } };
              case 'gt':   return { [field]: { $gt: parsed } };
              case 'gte':  return { [field]: { $gte: parsed } };
              case 'lt':   return { [field]: { $lt: parsed } };
              case 'lte':  return { [field]: { $lte: parsed } };
              case 'in':   return { [field]: { $in: Array.isArray(value) ? value : [value] } };
              case 'nin':  return { [field]: { $nin: Array.isArray(value) ? value : [value] } };
              case 'contains': return { [field]: parsed };
              default: return {};
            }
          });
          return logic === 'or' ? { $or: conditions } : { $and: conditions };
        };
        const ruleQuery = buildQuery(group.rules, group.ruleLogic || 'and');
        Object.assign(query, ruleQuery);
      } else if (group.members?.length) {
        query._id = { $in: group.members };
      }
      recipients = await User.find(query).select('email firstName').lean();
    } else {
      // All opted-in customers
      recipients = await User.find({ role: 'customer', marketingOptIn: true }).select('email firstName').lean();
    }

    if (!recipients.length) {
      return res.json({ success: true, message: 'No recipients found', sent: 0 });
    }

    // Queue sends (fire-and-forget batches to avoid timeout)
    let sent = 0;
    const batchSize = 50;
    const sendBatch = async (batch) => {
      await Promise.allSettled(batch.map(r =>
        emailService.sendTemplatedEmail(template.slug || template.type, {
          to: r.email,
          variables: { customer_name: r.firstName || 'Valued Customer', campaign_title: template.name },
        }).catch(() => {}) // Soft fail per recipient
      ));
      sent += batch.length;
    };

    // Start async — respond immediately with estimated count
    (async () => {
      for (let i = 0; i < recipients.length; i += batchSize) {
        await sendBatch(recipients.slice(i, i + batchSize));
      }
    })();

    res.json({ success: true, message: `Campaign queued for ${recipients.length} recipients`, queued: recipients.length });
  } catch (error) {
    console.error('Campaign send error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Re-seed all templates with branded designs ───
router.post('/seed', protect, authorize('admin', 'shop_manager', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const seedEmailTemplates = require('../seeders/emailTemplates');
    await seedEmailTemplates({ force: true });
    const count = await EmailTemplate.countDocuments();
    res.json({
      success: true,
      message: `Re-seeded ${count} branded email templates`,
      count,
    });
  } catch (error) {
    console.error('Error seeding templates:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
