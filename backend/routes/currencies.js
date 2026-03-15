const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Currency = require('../models/Currency');
const currencyUpdater = require('../services/currencyUpdater');

// GET all currencies
router.get('/', async (req, res, next) => {
  try {
    const { frontend } = req.query;
    
    let currencies;
    if (frontend === 'true') {
      // For frontend, only return currencies visible in frontend
      currencies = await Currency.getFrontendCurrencies();
    } else {
      // For admin, return all currencies
      currencies = await Currency.find().sort({ sortOrder: 1, code: 1 });
    }
    
    res.json({
      success: true,
      data: currencies
    });
  } catch (error) {
    next(error);
  }
});

// GET base currency — MUST be before /:id to avoid Express matching "base" as an id
router.get('/base/get', async (req, res, next) => {
  try {
    const baseCurrency = await Currency.getBase();
    
    if (!baseCurrency) {
      return res.status(404).json({ success: false, message: 'Base currency not found' });
    }
    
    res.json({ success: true, data: baseCurrency });
  } catch (error) {
    next(error);
  }
});

// GET single currency
router.get('/:id', async (req, res, next) => {
  try {
    const currency = await Currency.findById(req.params.id);
    
    if (!currency) {
      return res.status(404).json({ success: false, message: 'Currency not found' });
    }
    
    res.json({ success: true, data: currency });
  } catch (error) {
    next(error);
  }
});

// POST create currency
router.post('/', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { code, name, symbol, exchangeRate, decimalDigits, symbolPosition, decimalSeparator, thousandSeparator, isActive, showInFrontend, sortOrder } = req.body;
    
    // Validate code
    if (!code || code.length !== 3) {
      return res.status(400).json({ success: false, message: 'Currency code must be 3 characters' });
    }
    
    // Check if currency already exists
    const existing = await Currency.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Currency already exists' });
    }
    
    const currency = await Currency.create({
      code: code.toUpperCase(),
      name,
      symbol,
      exchangeRate: exchangeRate || 1,
      decimalDigits: decimalDigits || 2,
      symbolPosition: symbolPosition || 'before',
      decimalSeparator: decimalSeparator || '.',
      thousandSeparator: thousandSeparator || ',',
      isActive: isActive !== undefined ? isActive : true,
      showInFrontend: showInFrontend !== undefined ? showInFrontend : true,
      sortOrder: sortOrder || 0,
      isBaseCurrency: false // Can only be set via set-base endpoint
    });
    
    res.status(201).json({ success: true, data: currency, message: 'Currency created successfully' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Currency code already exists' });
    }
    next(error);
  }
});

// PUT update currency
router.put('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { name, symbol, exchangeRate, decimalDigits, symbolPosition, decimalSeparator, thousandSeparator, isActive, showInFrontend, sortOrder } = req.body;
    
    const currency = await Currency.findById(req.params.id);
    
    if (!currency) {
      return res.status(404).json({ success: false, message: 'Currency not found' });
    }
    
    // Prevent changing base currency status via update
    if (currency.isBaseCurrency && (req.body.isBaseCurrency === false)) {
      return res.status(400).json({ success: false, message: 'Cannot unset base currency. Set another currency as base first.' });
    }
    
    // Update fields
    if (name !== undefined) currency.name = name;
    if (symbol !== undefined) currency.symbol = symbol;
    if (exchangeRate !== undefined) currency.exchangeRate = exchangeRate;
    if (decimalDigits !== undefined) currency.decimalDigits = decimalDigits;
    if (symbolPosition !== undefined) currency.symbolPosition = symbolPosition;
    if (decimalSeparator !== undefined) currency.decimalSeparator = decimalSeparator;
    if (thousandSeparator !== undefined) currency.thousandSeparator = thousandSeparator;
    if (isActive !== undefined) currency.isActive = isActive;
    if (showInFrontend !== undefined) currency.showInFrontend = showInFrontend;
    if (sortOrder !== undefined) currency.sortOrder = sortOrder;
    
    await currency.save();
    
    res.json({ success: true, data: currency, message: 'Currency updated successfully' });
  } catch (error) {
    next(error);
  }
});

// POST set base currency
router.post('/set-base/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const newBaseCurrency = await Currency.findById(req.params.id);
    
    if (!newBaseCurrency) {
      return res.status(404).json({ success: false, message: 'Currency not found' });
    }
    
    // Unset current base currency
    await Currency.updateMany(
      { isBaseCurrency: true },
      { isBaseCurrency: false }
    );
    
    // Set new base currency
    newBaseCurrency.isBaseCurrency = true;
    newBaseCurrency.exchangeRate = 1; // Base currency always has rate of 1
    await newBaseCurrency.save();
    
    // Update all other currencies' exchange rates relative to new base
    // This would require fetching new rates from API
    // For now, we'll just set the base and let the cron job update rates
    
    res.json({ success: true, data: newBaseCurrency, message: 'Base currency updated successfully' });
  } catch (error) {
    next(error);
  }
});

// DELETE currency
router.delete('/:id', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const currency = await Currency.findById(req.params.id);
    
    if (!currency) {
      return res.status(404).json({ success: false, message: 'Currency not found' });
    }
    
    // Prevent deleting base currency
    if (currency.isBaseCurrency) {
      return res.status(400).json({ success: false, message: 'Cannot delete base currency. Set another currency as base first.' });
    }
    
    await Currency.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Currency deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST bulk delete currencies
router.post('/bulk-delete', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Currency IDs are required' });
    }
    
    // Check if any of the currencies is the base currency
    const currencies = await Currency.find({ _id: { $in: ids } });
    const baseCurrency = currencies.find(c => c.isBaseCurrency);
    
    if (baseCurrency) {
      return res.status(400).json({ 
        success: false, 
        message: `Cannot delete base currency (${baseCurrency.code}). Set another currency as base first.` 
      });
    }
    
    const result = await Currency.deleteMany({ _id: { $in: ids } });
    
    res.json({ 
      success: true, 
      message: `${result.deletedCount} currency(ies) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    next(error);
  }
});

// POST bulk update currencies
router.post('/bulk-update', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const { ids, updates } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Currency IDs are required' });
    }
    
    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({ success: false, message: 'Updates are required' });
    }
    
    // Prevent changing base currency status via bulk update
    if (updates.isBaseCurrency === false) {
      const currencies = await Currency.find({ _id: { $in: ids }, isBaseCurrency: true });
      if (currencies.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Cannot unset base currency via bulk update. Set another currency as base first.' 
        });
      }
    }
    
    // Build update object (only allow specific fields)
    const allowedUpdates = ['isActive', 'showInFrontend', 'sortOrder'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    });
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid updates provided' });
    }
    
    const result = await Currency.updateMany(
      { _id: { $in: ids } },
      { $set: updateData }
    );
    
    res.json({ 
      success: true, 
      message: `${result.modifiedCount} currency(ies) updated successfully`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    next(error);
  }
});

// POST update exchange rates manually
router.post('/update-rates', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const result = await currencyUpdater.updateRates();
    res.json({ success: true, data: result, message: 'Exchange rates updated successfully' });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to update exchange rates' 
    });
  }
});

// GET currency updater status
router.get('/updater/status', protect, authorize('admin', 'shop_manager'), async (req, res, next) => {
  try {
    const status = await currencyUpdater.getStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
