const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const axios = require('axios');

// Helper function to get OpenAI API key
async function getOpenAIApiKey() {
  const settings = await Settings.getSettings();
  return settings.openaiApiKey || process.env.OPENAI_API_KEY;
}

/**
 * @route   POST /api/products-ai/generate-description/:id
 * @desc    Generate AI description for a single product
 * @access  Private/Admin
 */
router.post('/generate-description/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    // Allow temp ID for new products
    let product = null;
    if (req.params.id !== 'temp') {
      product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
    } else {
      // For new products, use product name from body if provided
      product = { name: req.body.productName || 'Product' };
    }
    
    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Please configure it in Settings > AI Configuration.'
      });
    }
    
    // Generate description using OpenAI
    const prompt = `Generate a compelling product description for: ${product.name}

Include:
- A short description (2-3 sentences, max 150 words)
- A detailed long description (3-4 paragraphs, max 300 words)
- Key features and benefits
- Do NOT include pricing information
- Make it engaging and SEO-friendly

Format the response as JSON:
{
  "shortDescription": "...",
  "longDescription": "..."
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a professional product copywriter. Generate compelling, SEO-friendly product descriptions without pricing information.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const generatedContent = JSON.parse(response.data.choices[0].message.content);
    
    res.json({
      success: true,
      data: {
        shortDescription: generatedContent.shortDescription,
        longDescription: generatedContent.longDescription,
        productId: product._id,
        productName: product.name
      }
    });
  } catch (error) {
    console.error('Error generating AI description:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating AI description',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * @route   POST /api/products-ai/apply-description/:id
 * @desc    Apply generated description to product
 * @access  Private/Admin
 */
router.post('/apply-description/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { shortDescription, longDescription } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        shortDescription,
        description: longDescription,
        'aiGenerated.shortDescription': true,
        'aiGenerated.description': true
      },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    
    res.json({
      success: true,
      message: 'AI-generated description applied',
      data: product
    });
  } catch (error) {
    console.error('Error applying description:', error);
    res.status(400).json({
      success: false,
      message: 'Error applying description',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/products-ai/bulk-generate
 * @desc    Generate descriptions for multiple products
 * @access  Private/Admin
 */
router.post('/bulk-generate', protect, authorize('admin'), async (req, res) => {
  try {
    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Please configure it in Settings > AI Configuration.'
      });
    }
    
    const { productIds, categoryId } = req.body;
    
    let query = { status: { $ne: 'trash' } };
    
    if (productIds && productIds.length > 0) {
      query._id = { $in: productIds };
    } else if (categoryId) {
      query.categories = categoryId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide product IDs or category ID'
      });
    }
    
    const products = await Product.find(query).select('_id name description shortDescription');
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found'
      });
    }
    
    // Generate descriptions for each product
    let successCount = 0;
    let errorCount = 0;
    const errors = [];
    
    for (const product of products) {
      try {
        const prompt = `Generate a compelling product description for: ${product.name}

Include:
- A short description (2-3 sentences, max 150 words)
- A detailed long description (3-4 paragraphs, max 300 words)
- Key features and benefits
- Do NOT include pricing information
- Make it engaging and SEO-friendly

Format the response as JSON:
{
  "shortDescription": "...",
  "longDescription": "..."
}`;

        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-4',
            messages: [
              {
                role: 'system',
                content: 'You are a professional product copywriter. Generate compelling, SEO-friendly product descriptions without pricing information.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1000
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        const generatedContent = JSON.parse(response.data.choices[0].message.content);
        
        // Update product
        await Product.findByIdAndUpdate(
          product._id,
          {
            shortDescription: generatedContent.shortDescription,
            description: generatedContent.longDescription,
            'aiGenerated.shortDescription': true,
            'aiGenerated.description': true
          },
          { new: true, runValidators: true }
        );
        
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          productId: product._id,
          productName: product.name,
          error: error.response?.data?.error?.message || error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `AI descriptions generated: ${successCount} successful, ${errorCount} failed`,
      data: {
        count: successCount,
        total: products.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });
  } catch (error) {
    console.error('Error bulk generating descriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error bulk generating descriptions',
      error: error.message
    });
  }
});

module.exports = router;
