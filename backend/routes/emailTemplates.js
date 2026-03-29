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

router.post('/', protect, authorize('shop_manager'), async (req, res) => {
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

router.put('/:id', protect, authorize('shop_manager'), async (req, res) => {
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

router.delete('/:id', protect, authorize('shop_manager'), async (req, res) => {
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

router.post('/:id/test', protect, authorize('shop_manager'), async (req, res) => {
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

// ─── Re-seed all templates with branded designs ───
router.post('/seed', protect, authorize('shop_manager'), async (req, res) => {
  try {
    const seedEmailTemplates = require('../seeders/emailTemplates');
    await seedEmailTemplates();
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
