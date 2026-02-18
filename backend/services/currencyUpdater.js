const axios = require('axios');
const cron = require('node-cron');
const Currency = require('../models/Currency');

class CurrencyUpdater {
  constructor() {
    this.baseCurrency = null; // Will be set dynamically
    this.apiUrl = process.env.CURRENCY_API_URL || 'https://api.exchangerate-api.com/v4/latest';
    this.apiKey = process.env.CURRENCY_API_KEY; // Optional API key for premium services
    this.updateInterval = process.env.CURRENCY_UPDATE_INTERVAL || 24; // hours (default daily)
    this.isRunning = false;
    this.lastUpdate = null;
    this.updateSchedule = `0 */${this.updateInterval} * * *`;
  }

  /**
   * Get base currency code
   */
  async getBaseCurrencyCode() {
    if (!this.baseCurrency) {
      const baseCurrency = await Currency.getBase();
      this.baseCurrency = baseCurrency ? baseCurrency.code : 'ZAR';
    }
    return this.baseCurrency;
  }

  /**
   * Update all currency exchange rates
   */
  async updateRates() {
    try {
      console.log('Updating currency exchange rates...');
      
      // Get base currency
      const baseCode = await this.getBaseCurrencyCode();
      
      // Build API URL — strip any trailing currency code or slash from base URL
      const cleanBase = this.apiUrl.replace(/\/[A-Z]{3}\/?$/, '').replace(/\/$/, '');
      let apiUrl = `${cleanBase}/${baseCode}`;
      if (this.apiKey) {
        // If using a service that requires API key (like fixer.io)
        apiUrl = `${cleanBase}?access_key=${this.apiKey}&base=${baseCode}`;
      }
      
      const response = await axios.get(apiUrl, {
        timeout: 15000,
        headers: this.apiKey ? {} : { 'Accept': 'application/json' }
      });
      
      // Handle different API response formats
      let rates = {};
      if (response.data && response.data.rates) {
        // exchangerate-api.com format
        rates = response.data.rates;
      } else if (response.data && response.data.success && response.data.rates) {
        // fixer.io format
        rates = response.data.rates;
      } else if (response.data && typeof response.data === 'object') {
        // Some APIs return rates directly
        rates = response.data;
      } else {
        throw new Error('Invalid API response format');
      }
      
      if (Object.keys(rates).length === 0) {
        throw new Error('No exchange rates received from API');
      }
      
      const updatePromises = [];
      const baseCurrency = await Currency.getBase();
      
      // Update base currency rate to 1
      if (baseCurrency) {
        updatePromises.push(
          Currency.findByIdAndUpdate(
            baseCurrency._id,
            { 
              exchangeRate: 1,
              lastUpdated: new Date(),
              lastUpdateError: null
            }
          )
        );
      }
      
      // Update other currencies
      for (const [code, rate] of Object.entries(rates)) {
        // Skip base currency
        if (code === baseCode) continue;
        
        // Rate from API is: 1 baseCurrency = rate targetCurrency
        // We need: 1 targetCurrency = ? baseCurrency
        // So: exchangeRate = 1 / rate
        const exchangeRate = 1 / rate;
        
        updatePromises.push(
          Currency.findOneAndUpdate(
            { code: code.toUpperCase() },
            { 
              exchangeRate,
              lastUpdated: new Date(),
              lastUpdateError: null
            },
            { 
              upsert: false, // Don't create new currencies, only update existing ones
              new: true
            }
          )
        );
      }
      
      await Promise.all(updatePromises);
      
      this.lastUpdate = new Date();
      
      console.log(`Currency rates updated successfully at ${this.lastUpdate}`);
      console.log(`Updated ${Object.keys(rates).length} currencies`);
      
      return { 
        success: true, 
        updatedAt: this.lastUpdate,
        currenciesUpdated: Object.keys(rates).length,
        baseCurrency: baseCode
      };
    } catch (error) {
      console.error('Currency update error:', error.message);
      
      // Log error to currencies
      await Currency.updateMany(
        { isActive: true },
        { lastUpdateError: error.message }
      );
      
      throw error;
    }
  }

  /**
   * Start automatic currency updates
   */
  startAutoUpdate() {
    if (this.isRunning) {
      console.log('Currency auto-update is already running');
      return;
    }
    
    // Initial update (after a short delay to ensure DB is connected)
    setTimeout(() => {
      this.updateRates().catch(err => {
        console.error('Initial currency update failed:', err.message);
      });
    }, 5000);
    
    // Schedule daily updates at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Running scheduled currency rate update...');
      await this.updateRates().catch(err => {
        console.error('Scheduled currency update failed:', err.message);
      });
    });
    
    this.isRunning = true;
    console.log(`Currency auto-update started. Updates daily at 2:00 AM`);
  }

  /**
   * Stop automatic updates
   */
  stopAutoUpdate() {
    this.isRunning = false;
    console.log('Currency auto-update stopped');
  }

  /**
   * Convert price between currencies
   */
  async convertPrice(amount, fromCurrency, toCurrency = null) {
    if (fromCurrency === toCurrency) return amount;

    try {
      // Get base currency
      const baseCurrency = await Currency.getBase();
      const baseCode = baseCurrency ? baseCurrency.code : 'ZAR';
      
      // If toCurrency is not specified, use base currency
      if (!toCurrency) {
        toCurrency = baseCode;
      }

      // Both currencies to base conversion
      if (fromCurrency === baseCode) {
        const targetCurrency = await Currency.findOne({ 
          code: toCurrency, 
          isActive: true 
        });
        
        if (!targetCurrency) {
          throw new Error(`Currency ${toCurrency} not found or inactive`);
        }
        
        return amount / targetCurrency.exchangeRate;
      } else if (toCurrency === baseCode) {
        const sourceCurrency = await Currency.findOne({ 
          code: fromCurrency, 
          isActive: true 
        });
        
        if (!sourceCurrency) {
          throw new Error(`Currency ${fromCurrency} not found or inactive`);
        }
        
        return amount * sourceCurrency.exchangeRate;
      } else {
        // Convert from -> base -> to
        const sourceCurrency = await Currency.findOne({ 
          code: fromCurrency, 
          isActive: true 
        });
        const targetCurrency = await Currency.findOne({ 
          code: toCurrency, 
          isActive: true 
        });
        
        if (!sourceCurrency || !targetCurrency) {
          throw new Error('Currency not found or inactive');
        }
        
        const amountInBase = amount * sourceCurrency.exchangeRate;
        return amountInBase / targetCurrency.exchangeRate;
      }
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw error;
    }
  }

  /**
   * Get exchange rate between two currencies
   */
  async getExchangeRate(fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return 1;

    try {
      const rate = await this.convertPrice(1, fromCurrency, toCurrency);
      return rate;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format price with currency
   */
  async formatPrice(amount, currencyCode) {
    try {
      const currency = await Currency.findOne({ code: currencyCode });
      
      if (!currency) {
        return `${amount.toFixed(2)} ${currencyCode}`;
      }
      
      return currency.formatAmount(amount);
    } catch (error) {
      return `${amount.toFixed(2)} ${currencyCode}`;
    }
  }

  /**
   * Get all active currencies
   */
  async getActiveCurrencies() {
    try {
      return await Currency.find({ isActive: true }).sort({ code: 1 });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Initialize default currencies
   */
  async initializeDefaultCurrencies() {
    const defaultCurrencies = [
      { code: 'ZAR', name: 'South African Rand', symbol: 'R', exchangeRate: 1, isBaseCurrency: true },
      { code: 'USD', name: 'US Dollar', symbol: '$', exchangeRate: 0.055 },
      { code: 'EUR', name: 'Euro', symbol: '€', exchangeRate: 0.050 },
      { code: 'GBP', name: 'British Pound', symbol: '£', exchangeRate: 0.043 },
      { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', exchangeRate: 0.084 },
      { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', exchangeRate: 0.075 },
    ];

    for (const curr of defaultCurrencies) {
      await Currency.findOneAndUpdate(
        { code: curr.code },
        curr,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    console.log('Default currencies initialized');
    
    // Update with real rates
    await this.updateRates();
  }

  /**
   * Get status of currency service
   */
  async getStatus() {
    const baseCode = await this.getBaseCurrencyCode();
    return {
      isRunning: this.isRunning,
      lastUpdate: this.lastUpdate,
      updateInterval: `${this.updateInterval} hours`,
      updateSchedule: 'Daily at 2:00 AM',
      baseCurrency: baseCode
    };
  }
}

module.exports = new CurrencyUpdater();
