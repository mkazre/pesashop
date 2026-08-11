const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Settings = require('../models/Settings');

const MASK = '***configured***';
const SENSITIVE_KEYS = [
  'openaiApiKey', 'deepseekApiKey', 'anthropicApiKey', 'aiWebSearchApiKey',
  'smtpPassword', 'vapidPrivateKey', 'brevoApiKey',
];

function maskSensitive(obj) {
  const data = typeof obj.toObject === 'function' ? obj.toObject() : { ...obj };
  SENSITIVE_KEYS.forEach(k => { if (data[k]) data[k] = MASK; });
  if (data.socialLogin?.google?.clientSecret) data.socialLogin.google.clientSecret = MASK;
  if (data.socialLogin?.facebook?.appSecret) data.socialLogin.facebook.appSecret = MASK;
  if (data.socialEngine?.rapidApiKey) data.socialEngine.rapidApiKey = MASK;
  if (data.translation?.apiKey) data.translation.apiKey = MASK;
  return data;
}

/**
 * @route   GET /api/settings
 * @desc    Get all settings
 * @access  Private/Admin
 */
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({ success: true, data: maskSensitive(settings) });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Error fetching settings', error: error.message });
  }
});

/**
 * @route   PUT /api/settings
 * @desc    Update settings
 * @access  Private/Admin
 */
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      // Strip masked sensitive values so we don't overwrite with the mask
      const payload = { ...req.body };
      delete payload._id;
      delete payload.__v;
      delete payload.createdAt;
      delete payload.updatedAt;
      SENSITIVE_KEYS.forEach(k => {
        if (payload[k] === MASK || payload[k] === '') delete payload[k];
      });
      // Reject obviously invalid Brevo keys (e.g. browser autofill garbage)
      if (payload.brevoApiKey && payload.brevoApiKey.length < 20) {
        delete payload.brevoApiKey;
      }
      if (payload.socialLogin?.google?.clientSecret === MASK) delete payload.socialLogin.google.clientSecret;
      if (payload.socialLogin?.facebook?.appSecret === MASK) delete payload.socialLogin.facebook.appSecret;

      // Flatten socialEngine into dot-notation so MongoDB merges individual fields
      // instead of replacing the whole subdocument (which would wipe the stored rapidApiKey)
      if (payload.socialEngine) {
        const se = payload.socialEngine;
        Object.entries(se).forEach(([k, v]) => {
          if (k === 'rapidApiKey') {
            if (v && v !== MASK && v !== '') payload[`socialEngine.${k}`] = v;
            // else skip — preserve existing key already in DB
          } else {
            payload[`socialEngine.${k}`] = v;
          }
        });
        delete payload.socialEngine;
      }

      // Same masked-secret dance for the translation API key
      if (payload.translation) {
        const tr = payload.translation;
        Object.entries(tr).forEach(([k, v]) => {
          if (k === 'apiKey') {
            if (v && v !== MASK && v !== '') payload[`translation.${k}`] = v;
            // else skip — preserve existing key already in DB
          } else {
            payload[`translation.${k}`] = v;
          }
        });
        delete payload.translation;
      }

      // Use findOneAndUpdate with $set for reliable nested object persistence
      settings = await Settings.findOneAndUpdate(
        { _id: settings._id },
        { $set: payload },
        { new: true, runValidators: true }
      );
    }

    // Re-initialize email transporter if email settings changed
    if (req.body.smtpHost || req.body.smtpPort || req.body.smtpUser || req.body.smtpPassword || req.body.emailProvider || req.body.brevoApiKey) {
      try {
        const emailService = require('../services/emailService');
        emailService.reinitialize(settings);
      } catch (e) { /* ignore if method not yet available */ }
    }
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: maskSensitive(settings)
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(400).json({ success: false, message: 'Error updating settings', error: error.message });
  }
});

/**
 * @route   GET /api/settings/product-display
 * @desc    Get product display settings (public - for frontend storefront)
 * @access  Public
 */
router.get('/product-display', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings.productDisplay || {
        detailPage: { titleLines: 0, descriptionLines: 0, shortDescriptionLines: 0, reviewLines: 0 },
        otherLocations: { titleLines: 2, descriptionLines: 3, shortDescriptionLines: 2, reviewLines: 3 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching settings' });
  }
});

/**
 * @route   GET /api/settings/social-login
 * @desc    Get social login configuration (public - only exposes enabled state and client IDs, never secrets)
 * @access  Public
 */
router.get('/social-login', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    const sl = settings.socialLogin || {};
    res.json({
      success: true,
      data: {
        google: {
          enabled: !!(sl.google?.enabled && sl.google?.clientId),
          clientId: sl.google?.enabled ? sl.google.clientId : '',
          mobileClientId: sl.google?.enabled ? (sl.google.mobileClientId || sl.google.clientId || '') : '',
        },
        facebook: {
          enabled: !!(sl.facebook?.enabled && sl.facebook?.appId),
          appId: sl.facebook?.enabled ? sl.facebook.appId : '',
        },
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching social login settings' });
  }
});

/**
 * @route   GET /api/settings/bank-details
 * @desc    Get bank details for EFT payments (public)
 * @access  Public
 */
router.get('/bank-details', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: settings.bankDetails || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching bank details' });
  }
});

/**
 * @route   GET /api/settings/public
 * @desc    Get public store settings (store name, contacts, timezone, logo etc.)
 * @access  Public
 */
router.get('/public', async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    res.json({
      success: true,
      data: {
        storeName: settings.storeName || '',
        storeEmail: settings.storeEmail || settings.fromEmail || '',
        storePhone: settings.storePhone || '',
        storeAddress: settings.storeAddress || '',
        timezone: settings.timezone || 'Africa/Johannesburg',
        currency: settings.currency || 'ZAR',
        logo: settings.logo || '',
        favicon: settings.favicon || '',
        mobileContentVersion: settings.mobileContentVersion || 1,
        enabledLanguages: settings.translation?.enabledLanguages?.length
          ? settings.translation.enabledLanguages
          : ['fr', 'sn', 'bem', 'ny', 'zu'],
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching public settings' });
  }
});

/**
 * @route   POST /api/settings/refresh-mobile-content
 * @desc    Bump mobileContentVersion so mobile clients flush their local
 *          content caches (drawer menu, etc.) next time they launch/resume
 * @access  Private/Admin
 */
router.post('/refresh-mobile-content', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    settings.mobileContentVersion = (settings.mobileContentVersion || 1) + 1;
    await settings.save();
    res.json({ success: true, data: { mobileContentVersion: settings.mobileContentVersion } });
  } catch (error) {
    console.error('refresh-mobile-content error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error refreshing mobile content version' });
  }
});

/**
 * @route   GET /api/settings/translation-stats
 * @desc    TranslationCache size per language, for the admin Translations panel
 * @access  Private/Admin
 */
router.get('/translation-stats', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const TranslationCache = require('../models/TranslationCache');
    const byLanguage = await TranslationCache.aggregate([
      { $group: { _id: '$targetLang', count: { $sum: 1 }, chars: { $sum: { $strLenCP: '$sourceText' } } } },
      { $sort: { _id: 1 } },
    ]);
    const total = byLanguage.reduce((sum, l) => sum + l.count, 0);
    res.json({
      success: true,
      data: {
        total,
        byLanguage: byLanguage.map((l) => ({ lang: l._id, cachedEntries: l.count, approxSourceChars: l.chars })),
      }
    });
  } catch (error) {
    console.error('translation-stats error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error fetching translation stats' });
  }
});

/**
 * @route   POST /api/settings/translation-test
 * @desc    Sanity-check the configured translation API key by translating a
 *          short sample string, bypassing the cache. Lets an admin verify a
 *          newly-pasted key actually works before relying on it.
 * @access  Private/Admin
 */
router.post('/translation-test', protect, authorize('admin'), async (req, res) => {
  try {
    const { targetLang = 'fr' } = req.body;
    const axios = require('axios');
    const settings = await Settings.getSettings();
    const apiKey = settings.translation?.apiKey || process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      return res.status(400).json({ success: false, message: 'No API key configured yet' });
    }
    const sample = 'Add to cart';
    const response = await axios.post('https://translation.googleapis.com/language/translate/v2', null, {
      params: { key: apiKey, q: sample, target: targetLang, source: 'en', format: 'text' },
    });
    const translated = response.data?.data?.translations?.[0]?.translatedText;
    res.json({ success: true, data: { sample, targetLang, translated } });
  } catch (error) {
    const message = error.response?.data?.error?.message || error.message || 'Translation test failed';
    res.status(400).json({ success: false, message });
  }
});

/**
 * @route   DELETE /api/settings/translation-cache
 * @desc    Wipe the TranslationCache — e.g. after switching provider/API key,
 *          or to force everything to re-translate with fresh output.
 * @access  Private/Admin
 */
router.delete('/translation-cache', protect, authorize('admin'), async (req, res) => {
  try {
    const TranslationCache = require('../models/TranslationCache');
    const { lang } = req.query;
    const filter = lang ? { targetLang: lang } : {};
    const result = await TranslationCache.deleteMany(filter);
    res.json({ success: true, data: { deletedCount: result.deletedCount } });
  } catch (error) {
    console.error('translation-cache clear error:', error);
    res.status(500).json({ success: false, message: error.message || 'Error clearing translation cache' });
  }
});

/**
 * @route   POST /api/settings/verify-email-config
 * @desc    Verify SMTP configuration without sending an email
 * @access  Private/Admin
 */
router.post('/verify-email-config', protect, authorize('admin'), async (req, res) => {
  try {
    const emailService = require('../services/emailService');
    const settings = await Settings.getSettings();
    emailService.reinitialize(settings);

    const provider = settings.emailProvider || 'smtp';
    const issues = [];
    let config;

    if (provider === 'brevo') {
      config = {
        provider: 'brevo',
        method: 'HTTP API (port 443)',
        from: settings.fromEmail || null,
        hasApiKey: !!(settings.brevoApiKey && settings.brevoApiKey.length > 20),
      };
      if (!config.hasApiKey) issues.push('Brevo API Key is not configured');
      if (!config.from) issues.push('From Email is not configured');
    } else {
      const port = parseInt(settings.smtpPort) || parseInt(process.env.EMAIL_PORT) || 587;
      config = {
        provider: 'smtp',
        host: settings.smtpHost || process.env.EMAIL_HOST || null,
        port,
        user: settings.smtpUser || process.env.EMAIL_USER || null,
        from: settings.fromEmail || process.env.EMAIL_FROM || null,
        secure: settings.smtpSecure === true || port === 465,
        hasPassword: !!(settings.smtpPassword || process.env.EMAIL_PASSWORD),
      };
      if (!config.host) issues.push('SMTP Host is not configured');
      if (!config.port) issues.push('SMTP Port is not configured');
      if (!config.user) issues.push('SMTP Username is not configured');
      if (!config.hasPassword) issues.push('SMTP Password is not configured');
      if (!config.from) issues.push('From Email is not configured');
    }

    if (issues.length > 0) {
      return res.json({ success: true, data: { status: 'incomplete', config, issues } });
    }

    console.log(`[Email Verify] Testing ${provider}: host=${config.host} port=${config.port} user=${config.user}`);

    const verify = await emailService.testConnection();
    if (!verify.success) {
      console.error(`[Email Verify] Connection failed: ${verify.message}`);
      return res.json({ success: true, data: { status: 'failed', config, issues: [`Connection failed: ${verify.message}`] } });
    }

    console.log('[Email Verify] Connection successful');
    res.json({ success: true, data: { status: 'ok', config, issues: [] } });
  } catch (error) {
    console.error('Verify email config error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/settings/test-email
 * @desc    Send a test email to verify SMTP configuration
 * @access  Private/Admin
 */
router.post('/test-email', protect, authorize('admin'), async (req, res) => {
  try {
    const { to } = req.body;
    if (!to) return res.status(400).json({ success: false, message: 'Please provide a recipient email' });

    const emailService = require('../services/emailService');
    
    // Re-initialize from DB settings first
    const settings = await Settings.getSettings();
    emailService.reinitialize(settings);

    // Try verifying connection first
    const verify = await emailService.testConnection();
    if (!verify.success) {
      return res.status(400).json({ success: false, message: `SMTP connection failed: ${verify.message}` });
    }

    // Send actual test email
    await emailService.sendEmail({
      to,
      subject: `Test Email from ${settings.storeName || 'PesaShop'}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
          <div style="background:#1b5e35;color:#fff;padding:20px;text-align:center"><h1 style="margin:0">✅ Email Configuration Working</h1></div>
          <div style="padding:20px;background:#f9f9f9">
            <p>This is a test email from your <strong>${settings.storeName || 'PesaShop'}</strong> admin panel.</p>
            <p>If you received this email, your SMTP settings are configured correctly.</p>
            <hr style="border:none;border-top:1px solid #ddd;margin:20px 0">
            <p style="font-size:12px;color:#999"><strong>SMTP Host:</strong> ${settings.smtpHost || 'N/A'}<br>
            <strong>Port:</strong> ${settings.smtpPort || 'N/A'}<br>
            <strong>From:</strong> ${settings.fromEmail || 'N/A'}</p>
          </div>
        </div>`,
    });

    res.json({ success: true, message: `Test email sent successfully to ${to}` });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ success: false, message: `Failed to send test email: ${error.message}` });
  }
});

module.exports = router;
