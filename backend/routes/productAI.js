const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Product = require('../models/Product');
const Settings = require('../models/Settings');
const axios = require('axios');
const aiAssistant = require('../services/aiAssistant');

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
    
    // Check if any AI provider is configured
    const aiSettings = await aiAssistant.getSettings();
    const hasProvider = Object.values(aiSettings).some(s => s && s.enabled && s.apiKey);
    if (!hasProvider) {
      return res.status(500).json({
        success: false,
        message: 'No AI provider configured. Please set up OpenAI, DeepSeek, or Anthropic in Settings > AI Configuration.'
      });
    }
    
    // Generate description using whichever AI provider is configured
    const prompt = `Generate a compelling product description for: "${product.name}"

Include:
- A short description (2-3 sentences, max 150 words)
- A detailed long description (3-4 paragraphs, max 300 words)
- Key features and benefits
- Do NOT include pricing information
- Make it engaging and SEO-friendly

Return ONLY valid JSON, no markdown code blocks:
{"shortDescription": "...", "longDescription": "..."}`;

    const aiResponse = await aiAssistant.rawGenerate(prompt, {
      systemPrompt: 'You are a professional product copywriter. Generate compelling, SEO-friendly product descriptions. Always return valid JSON only, never wrap in markdown code blocks.',
      maxTokens: 1500,
    });
    
    const rawContent = (aiResponse.answer || '').trim();
    // Handle potential markdown code blocks in response
    let jsonStr = rawContent;
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }
    const generatedContent = JSON.parse(jsonStr);
    
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
      error: error.message
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
router.post('/bulk-generate', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const aiSettings = await aiAssistant.getSettings();
    const hasProvider = Object.values(aiSettings).some(s => s && s.enabled && s.apiKey);
    if (!hasProvider) {
      return res.status(500).json({
        success: false,
        message: 'No AI provider configured. Please set up OpenAI, DeepSeek, or Anthropic in Settings > AI Configuration.'
      });
    }
    
    const { productIds, categoryId, includeSpecifications } = req.body;
    
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
    
    const products = await Product.find(query).select('_id name description shortDescription categories').populate('categories', 'name');
    
    if (products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found'
      });
    }
    
    // Generate descriptions for each product
    let successCount = 0;
    let errorCount = 0;
    let specsCount = 0;
    const errors = [];
    
    for (const product of products) {
      try {
        const specsInstruction = includeSpecifications
          ? `\n- A "specifications" array of 8-15 objects with "key" and "value" fields (e.g. {"key":"Material","value":"Stainless Steel"})\n\nReturn ONLY valid JSON, no markdown code blocks:\n{"shortDescription": "...", "longDescription": "...", "specifications": [{"key":"...","value":"..."}]}`
          : `\n\nReturn ONLY valid JSON, no markdown code blocks:\n{"shortDescription": "...", "longDescription": "..."}`;

        const prompt = `Generate a compelling product description for: "${product.name}"

Include:
- A short description (2-3 sentences, max 150 words)
- A detailed long description (3-4 paragraphs, max 300 words)
- Key features and benefits
- Do NOT include pricing information
- Make it engaging and SEO-friendly${specsInstruction}`;

        const aiResponse = await aiAssistant.rawGenerate(prompt, {
          systemPrompt: 'You are a professional product copywriter and specifications expert. Generate compelling, SEO-friendly product descriptions. Always return valid JSON only, never wrap in markdown code blocks.',
          maxTokens: includeSpecifications ? 2500 : 1500,
        });
        
        const rawBulkContent = (aiResponse.answer || '').trim();
        let bulkJsonStr = rawBulkContent;
        const bulkJsonMatch = rawBulkContent.match(/\{[\s\S]*\}/);
        if (bulkJsonMatch) {
          bulkJsonStr = bulkJsonMatch[0];
        }
        const generatedContent = JSON.parse(bulkJsonStr);
        
        // Update product — replace existing descriptions
        const updateData = {
          shortDescription: generatedContent.shortDescription,
          description: generatedContent.longDescription,
          'aiGenerated.shortDescription': true,
          'aiGenerated.description': true
        };

        if (includeSpecifications && Array.isArray(generatedContent.specifications) && generatedContent.specifications.every(s => s.key && s.value)) {
          updateData.specifications = generatedContent.specifications;
          specsCount++;
        }

        await Product.findByIdAndUpdate(
          product._id,
          updateData,
          { new: true, runValidators: true }
        );
        
        successCount++;
      } catch (error) {
        errorCount++;
        errors.push({
          productId: product._id,
          productName: product.name,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `AI descriptions generated: ${successCount} successful, ${errorCount} failed${includeSpecifications ? `, ${specsCount} specs generated` : ''}`,
      data: {
        count: successCount,
        total: products.length,
        specsCount: includeSpecifications ? specsCount : undefined,
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

/**
 * @route   POST /api/products-ai/generate-specifications/:id
 * @desc    Generate AI specifications for a product
 * @access  Private/Admin
 */
router.post('/generate-specifications/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    let product = null;
    if (req.params.id !== 'temp') {
      product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
    } else {
      product = { name: req.body.productName || 'Product', description: req.body.description || '' };
    }

    const apiKey = await getOpenAIApiKey();
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OpenAI API key not configured. Please configure it in Settings > AI Configuration.'
      });
    }

    const customPrompt = req.body.promptTemplate || null;
    const prompt = customPrompt
      ? customPrompt.replace('{productName}', product.name).replace('{description}', product.description || '')
      : `Generate detailed product specifications for: ${product.name}.
${product.description ? `Product description: ${product.description}` : ''}

Include technical details, dimensions, materials, key features, and any relevant attributes.
Return ONLY a JSON array of objects with "key" and "value" fields, e.g.:
[
  { "key": "Material", "value": "Stainless Steel" },
  { "key": "Weight", "value": "1.5 kg" }
]
Generate 8-15 relevant specification pairs. Be specific and realistic.`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          { role: 'system', content: 'You are a product specifications expert. Generate accurate, detailed product specifications. Always return valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    let specs;
    const content = response.data.choices[0].message.content.trim();
    // Handle potential markdown code blocks in response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      specs = JSON.parse(jsonMatch[0]);
    } else {
      specs = JSON.parse(content);
    }

    // Validate structure
    if (!Array.isArray(specs) || !specs.every(s => s.key && s.value)) {
      return res.status(500).json({ success: false, message: 'AI returned invalid specifications format' });
    }

    res.json({
      success: true,
      data: {
        specifications: specs,
        productId: product._id,
        productName: product.name
      }
    });
  } catch (error) {
    console.error('Error generating AI specifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating AI specifications',
      error: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * @route   POST /api/products-ai/apply-specifications/:id
 * @desc    Apply generated specifications to product
 * @access  Private/Admin
 */
router.post('/apply-specifications/:id', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { specifications } = req.body;

    if (!Array.isArray(specifications)) {
      return res.status(400).json({ success: false, message: 'Specifications must be an array' });
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { specifications },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, message: 'Specifications applied', data: product });
  } catch (error) {
    console.error('Error applying specifications:', error);
    res.status(400).json({ success: false, message: 'Error applying specifications', error: error.message });
  }
});

/**
 * @route   POST /api/products-ai/bulk-generate-specifications
 * @desc    Generate AI specifications for multiple products (by IDs, category, or all)
 * @access  Private/Admin
 */
router.post('/bulk-generate-specifications', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const aiAssistant = require('../services/aiAssistant');
    const aiSettings = await aiAssistant.getSettings();
    const hasProvider = Object.values(aiSettings).some(s => s && s.enabled && s.apiKey);

    if (!hasProvider) {
      return res.status(500).json({
        success: false,
        message: 'No AI provider configured. Please set up OpenAI, DeepSeek, or Anthropic in Settings.'
      });
    }

    const { productIds, categoryId, all, promptTemplate, overwriteExisting } = req.body;

    let query = { status: { $ne: 'trash' }, isActive: true };
    if (productIds && productIds.length > 0) {
      query._id = { $in: productIds };
    } else if (categoryId) {
      query.categories = categoryId;
    } else if (!all) {
      return res.status(400).json({ success: false, message: 'Provide productIds, categoryId, or set all:true' });
    }

    // If not overwriting, skip products that already have specs
    if (!overwriteExisting) {
      query['specifications.0'] = { $exists: false };
    }

    const products = await Product.find(query)
      .select('_id name description shortDescription categories specifications')
      .populate('categories', 'name')
      .limit(100); // Safety cap

    if (products.length === 0) {
      return res.json({ success: true, message: 'No products to process', data: { count: 0, total: 0 } });
    }

    let successCount = 0;
    let errorCount = 0;
    const results = [];

    for (const product of products) {
      try {
        const catNames = (product.categories || []).map(c => c.name).join(', ');
        const defaultPrompt = `Generate detailed product specifications for: "${product.name}"
${product.shortDescription ? `Short description: ${product.shortDescription}` : ''}
${product.description ? `Description: ${product.description.substring(0, 300)}` : ''}
${catNames ? `Categories: ${catNames}` : ''}

Return ONLY a JSON array of objects with "key" and "value" fields.
Generate 8-15 relevant, specific, realistic specification pairs.
Include: dimensions, weight, materials, technical specs, compatibility, warranty, etc. as relevant.
Example: [{"key":"Material","value":"Stainless Steel"},{"key":"Weight","value":"1.5 kg"}]`;

        const prompt = promptTemplate
          ? promptTemplate.replace('{productName}', product.name)
              .replace('{description}', product.description || '')
              .replace('{shortDescription}', product.shortDescription || '')
              .replace('{categories}', catNames)
          : defaultPrompt;

        const response = await aiAssistant.generateResponse(prompt, {
          productName: product.name,
          productDescription: product.shortDescription || product.description?.substring(0, 200) || '',
        }, null);

        const text = response.answer || '';
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (!jsonMatch) throw new Error('No JSON array in AI response');

        const specs = JSON.parse(jsonMatch[0]);
        if (!Array.isArray(specs) || !specs.every(s => s.key && s.value)) {
          throw new Error('Invalid specs format');
        }

        await Product.findByIdAndUpdate(product._id, { specifications: specs });
        successCount++;
        results.push({ productId: product._id, name: product.name, status: 'success', specCount: specs.length });
      } catch (err) {
        errorCount++;
        results.push({ productId: product._id, name: product.name, status: 'error', error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Specifications generated: ${successCount} successful, ${errorCount} failed`,
      data: { count: successCount, total: products.length, errors: errorCount, results }
    });
  } catch (error) {
    console.error('Bulk spec generation error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
