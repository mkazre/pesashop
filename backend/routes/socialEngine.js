const express = require('express');
const router  = express.Router();
const { protect, authorize } = require('../middleware/auth');
const socialEngine = require('../services/socialEngine');

// GET /api/social-engine/videos?keywords=air+fryer,air+fryer+recipe&limit=8
router.get('/videos', async (req, res) => {
  try {
    const { keywords, limit } = req.query;
    if (!keywords) return res.status(400).json({ success: false, message: 'keywords is required' });
    const keywordArray = keywords.split(',').map(k => k.trim()).filter(Boolean);
    const parsedLimit  = Math.min(parseInt(limit) || 8, 20);
    const result = await socialEngine.getVideos(keywordArray, parsedLimit);
    res.json({ success: true, data: result.videos });
  } catch (err) {
    console.error('[SocialEngine] /videos error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/social-engine/settings — public, never exposes the API key
router.get('/settings', async (req, res) => {
  try {
    const cfg = await socialEngine.getSettings();
    const { rapidApiKey, ...publicCfg } = cfg;
    res.json({ success: true, data: publicCfg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/social-engine/test — admin only, verifies RapidAPI connection
router.post('/test', protect, authorize('admin', 'superadmin', 'super_admin'), async (req, res) => {
  try {
    const videos = await socialEngine.testConnection();
    res.json({ success: true, data: videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
