const SYSTEM_PROMPT = `You are PESA AI, the official product assistant for Pesa Shop. You help customers with product questions including specifications, compatibility, usage tips, and features.

STRICT RULES YOU MUST ALWAYS FOLLOW:
1. NEVER recommend, mention, or link to any external websites, competitors, or third-party stores.
2. NEVER compare prices with other retailers or suggest the customer can find the product cheaper elsewhere.
3. NEVER suggest the customer search for the product on Google, Amazon, eBay, Takealot, or ANY other platform.
4. If a customer asks about pricing elsewhere, politely decline and say our prices are competitive and include value-added service.
5. If you cannot answer a question, ALWAYS recommend the customer contact our support team by saying: "For more details on this, I'd recommend reaching out to our support team through the Contact Us page — they'll be happy to help!"
6. Keep answers helpful, concise, and focused on the product within our store.
7. You may discuss product features, specifications, compatibility, usage tips, care instructions, and general product knowledge.
8. Do NOT fabricate specifications — if unsure, recommend contacting our support team.`;

class AIAssistant {
  constructor() {
    this.providers = {
      openai: {
        name: 'OpenAI',
        baseURL: 'https://api.openai.com/v1',
        model: 'gpt-3.5-turbo',
        maxTokens: 1000,
      },
      deepseek: {
        name: 'DeepSeek',
        baseURL: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        maxTokens: 1000,
      },
      anthropic: {
        name: 'Anthropic Claude',
        baseURL: 'https://api.anthropic.com/v1',
        model: 'claude-3-haiku-20240307',
        maxTokens: 1000,
      }
    };
  }

  async getSettings() {
    // Get settings from database
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    
    return {
      openai: {
        apiKey: settings.openaiApiKey,
        enabled: !!settings.openaiApiKey && settings.aiEnabled,
      },
      deepseek: {
        apiKey: settings.deepseekApiKey,
        enabled: !!settings.deepseekApiKey && settings.aiEnabled,
      },
      anthropic: {
        apiKey: settings.anthropicApiKey,
        enabled: !!settings.anthropicApiKey && settings.aiEnabled,
      },
      fallbackProvider: settings.aiFallbackProvider || 'openai',
      webSearchEnabled: settings.aiWebSearchEnabled,
      webSearchApiKey: settings.aiWebSearchApiKey,
    };
  }

  async searchWeb(query, productName) {
    // Simple web search implementation (you can integrate with SerpApi, Google Custom Search, etc.)
    // For now, return mock search results
    const searchQuery = `${productName} ${query}`;
    
    try {
      // This is where you'd integrate with a real search API
      // For demonstration, we'll simulate search results
      return {
        results: [
          {
            title: `${productName} - Official Product Page`,
            snippet: `Official specifications and details for ${productName}`,
            url: `https://example.com/product/${productName.toLowerCase().replace(/\s+/g, '-')}`
          },
          {
            title: `${productName} - User Reviews`,
            snippet: `Customer reviews and experiences with ${productName}`,
            url: `https://example.com/reviews/${productName.toLowerCase().replace(/\s+/g, '-')}`
          }
        ],
        query: searchQuery
      };
    } catch (error) {
      console.error('Web search error:', error);
      return null;
    }
  }

  async callOpenAI(prompt, apiKey, options = {}) {
    const response = await fetch(`${this.providers.openai.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.providers.openai.model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.providers.openai.maxTokens,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callDeepSeek(prompt, apiKey, options = {}) {
    const response = await fetch(`${this.providers.deepseek.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.providers.deepseek.model,
        messages: [
          {
            role: 'system',
            content: options.systemPrompt || SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.providers.deepseek.maxTokens,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText} - ${errBody}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  async callAnthropic(prompt, apiKey, options = {}) {
    const sysPrompt = options.systemPrompt || SYSTEM_PROMPT;
    const response = await fetch(`${this.providers.anthropic.baseURL}/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.providers.anthropic.model,
        max_tokens: options.maxTokens || this.providers.anthropic.maxTokens,
        messages: [
          {
            role: 'user',
            content: `${sysPrompt}\n\n${prompt}`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Anthropic API error: ${response.status} ${response.statusText} - ${errBody}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  async rawGenerate(prompt, options = {}) {
    const settings = await this.getSettings();
    const providers = ['openai', 'deepseek', 'anthropic'];

    for (const providerName of providers) {
      const provider = this.providers[providerName];
      const setting = settings[providerName];
      if (!setting.enabled) continue;

      try {
        let response;
        switch (providerName) {
          case 'openai':
            response = await this.callOpenAI(prompt, setting.apiKey, options);
            break;
          case 'deepseek':
            response = await this.callDeepSeek(prompt, setting.apiKey, options);
            break;
          case 'anthropic':
            response = await this.callAnthropic(prompt, setting.apiKey, options);
            break;
        }
        return { answer: response, provider: provider.name };
      } catch (error) {
        console.error(`${provider.name} API error:`, error.message);
        continue;
      }
    }
    throw new Error('All AI providers are unavailable or failed. Please check your API keys and try again.');
  }

  async generateResponse(question, productInfo, webResults) {
    const settings = await this.getSettings();
    
    // Build context prompt
    let contextPrompt = `Product Information:\n`;
    contextPrompt += `- Name: ${productInfo.productName}\n`;
    contextPrompt += `- Description: ${productInfo.productDescription || 'No description available'}\n`;
    
    if (webResults && webResults.results) {
      contextPrompt += `\nWeb Search Results for "${webResults.query}":\n`;
      webResults.results.forEach((result, index) => {
        contextPrompt += `${index + 1}. ${result.title}\n   ${result.snippet}\n\n`;
      });
    }
    
    contextPrompt += `\nCustomer Question: ${question}\n\n`;
    contextPrompt += `Please provide a helpful answer to the customer's question about this product. `;
    contextPrompt += `Use the product information and any available context to provide accurate information. `;
    contextPrompt += `Remember: NEVER recommend external websites or price comparisons. If unsure, recommend contacting our support team via the Contact Us page.`;

    // Try providers in order of preference
    const providers = ['openai', 'deepseek', 'anthropic'];
    
    for (const providerName of providers) {
      const provider = this.providers[providerName];
      const setting = settings[providerName];
      
      if (!setting.enabled) {
        continue;
      }

      try {
        let response;
        
        switch (providerName) {
          case 'openai':
            response = await this.callOpenAI(contextPrompt, setting.apiKey);
            break;
          case 'deepseek':
            response = await this.callDeepSeek(contextPrompt, setting.apiKey);
            break;
          case 'anthropic':
            response = await this.callAnthropic(contextPrompt, setting.apiKey);
            break;
        }

        return {
          answer: response,
          provider: provider.name,
          usedWebSearch: !!webResults,
        };
      } catch (error) {
        console.error(`${provider.name} API error:`, error);
        continue; // Try next provider
      }
    }

    throw new Error('All AI providers are unavailable or failed. Please check your API keys and try again.');
  }

  async answerQuestion(question, productId, productName, productDescription) {
    try {
      const settings = await this.getSettings();
      
      // Check if any AI provider is enabled
      const hasEnabledProvider = Object.values(settings).some(setting => 
        setting.enabled && setting.apiKey
      );

      if (!hasEnabledProvider) {
        throw new Error('No AI providers are configured. Please add API keys in the settings.');
      }

      // Perform web search if enabled
      let webResults = null;
      if (settings.webSearchEnabled && settings.webSearchApiKey) {
        webResults = await this.searchWeb(question, productName);
      }

      // Generate AI response
      const response = await this.generateResponse(question, {
        productId,
        productName,
        productDescription,
      }, webResults);

      return response;
    } catch (error) {
      console.error('AI Assistant error:', error);
      throw error;
    }
  }
}

module.exports = new AIAssistant();
