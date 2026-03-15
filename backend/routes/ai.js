const express = require('express');
const router = express.Router();
const aiAssistant = require('../services/aiAssistant');

// Product AI Assistant endpoint
router.post('/product-assistant', async (req, res) => {
  try {
    const { question, productId, productName, productDescription } = req.body;

    // Validate input
    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    // Limit question length
    if (question.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Question is too long (max 1000 characters)'
      });
    }

    // Get AI response
    const response = await aiAssistant.answerQuestion(
      question,
      productId,
      productName,
      productDescription
    );

    res.json({
      success: true,
      data: {
        answer: response.answer,
        provider: response.provider,
        usedWebSearch: response.usedWebSearch,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process your request. Please try again later.'
    });
  }
});

// Get AI settings status (for admin panel)
router.get('/settings-status', async (req, res) => {
  try {
    const settings = await aiAssistant.getSettings();
    
    const status = {
      openai: {
        enabled: settings.openai.enabled,
        configured: !!settings.openai.apiKey,
      },
      deepseek: {
        enabled: settings.deepseek.enabled,
        configured: !!settings.deepseek.apiKey,
      },
      anthropic: {
        enabled: settings.anthropic.enabled,
        configured: !!settings.anthropic.apiKey,
      },
      webSearch: {
        enabled: settings.webSearchEnabled,
        configured: !!settings.webSearchApiKey,
      },
      fallbackProvider: settings.fallbackProvider
    };

    res.json({
      success: true,
      data: status
    });

  } catch (error) {
    console.error('AI Settings status error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get AI settings status'
    });
  }
});

module.exports = router;
