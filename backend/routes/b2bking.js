const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const CustomerGroup = require('../models/CustomerGroup');
const PriceList = require('../models/PriceList');
const PricingRule = require('../models/PricingRule');
const User = require('../models/User');
const Product = require('../models/Product');
const pricingService = require('../services/pricingService');

// ==================== CUSTOMER GROUPS ====================

// GET all customer groups
router.get('/customer-groups', protect, authorize('admin', 'shop_manager'), checkPermission('customer_groups', 'read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const groups = await CustomerGroup.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CustomerGroup.countDocuments(query);

    // Update customer counts
    for (const group of groups) {
      const count = await User.countDocuments({ customerGroup: group.slug });
      if (count !== group.customerCount) {
        group.customerCount = count;
        await group.save();
      }
    }

    res.json({
      success: true,
      data: groups,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET single customer group
router.get('/customer-groups/:id', protect, authorize('admin', 'shop_manager'), checkPermission('customer_groups', 'read'), async (req, res, next) => {
  try {
    const group = await CustomerGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Customer group not found' });
    }

    // Get customer count
    const customerCount = await User.countDocuments({ customerGroup: group.slug });
    group.customerCount = customerCount;

    res.json({ success: true, data: group });
  } catch (error) {
    next(error);
  }
});

// POST create customer group
router.post('/customer-groups', protect, authorize('shop_manager'), checkPermission('customer_groups', 'create'), async (req, res, next) => {
  try {
    const group = await CustomerGroup.create(req.body);
    res.status(201).json({ success: true, data: group });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Customer group name or slug already exists' });
    }
    next(error);
  }
});

// PUT update customer group
router.put('/customer-groups/:id', protect, authorize('shop_manager'), checkPermission('customer_groups', 'update'), async (req, res, next) => {
  try {
    const group = await CustomerGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!group) {
      return res.status(404).json({ success: false, message: 'Customer group not found' });
    }
    res.json({ success: true, data: group });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Customer group name or slug already exists' });
    }
    next(error);
  }
});

// DELETE customer group
router.delete('/customer-groups/:id', protect, authorize('shop_manager'), checkPermission('customer_groups', 'delete'), async (req, res, next) => {
  try {
    const group = await CustomerGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ success: false, message: 'Customer group not found' });
    }

    // Check if any customers are using this group
    const customerCount = await User.countDocuments({ customerGroup: group.slug });
    if (customerCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete customer group. ${customerCount} customer(s) are assigned to this group.`
      });
    }

    await group.deleteOne();
    res.json({ success: true, message: 'Customer group deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== PRICE LISTS ====================

// GET all price lists
router.get('/price-lists', protect, authorize('admin', 'shop_manager'), checkPermission('price_lists', 'read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const priceLists = await PriceList.find(query)
      .populate('customerGroups', 'name slug')
      .populate('customers', 'firstName lastName email')
      .populate('products', 'name sku')
      .populate('categories', 'name slug')
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PriceList.countDocuments(query);

    res.json({
      success: true,
      data: priceLists,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET single price list
router.get('/price-lists/:id', protect, authorize('admin', 'shop_manager'), checkPermission('price_lists', 'read'), async (req, res, next) => {
  try {
    const priceList = await PriceList.findById(req.params.id)
      .populate('customerGroups', 'name slug')
      .populate('customers', 'firstName lastName email')
      .populate('products', 'name sku regularPrice')
      .populate('categories', 'name slug')
      .populate('items.product', 'name sku regularPrice');

    if (!priceList) {
      return res.status(404).json({ success: false, message: 'Price list not found' });
    }

    res.json({ success: true, data: priceList });
  } catch (error) {
    next(error);
  }
});

// POST create price list
router.post('/price-lists', protect, authorize('shop_manager'), checkPermission('price_lists', 'create'), async (req, res, next) => {
  try {
    const priceList = await PriceList.create(req.body);
    await priceList.populate('customerGroups products categories');
    res.status(201).json({ success: true, data: priceList });
  } catch (error) {
    next(error);
  }
});

// PUT update price list
router.put('/price-lists/:id', protect, authorize('shop_manager'), checkPermission('price_lists', 'update'), async (req, res, next) => {
  try {
    const priceList = await PriceList.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('customerGroups products categories');

    if (!priceList) {
      return res.status(404).json({ success: false, message: 'Price list not found' });
    }

    res.json({ success: true, data: priceList });
  } catch (error) {
    next(error);
  }
});

// DELETE price list
router.delete('/price-lists/:id', protect, authorize('shop_manager'), checkPermission('price_lists', 'delete'), async (req, res, next) => {
  try {
    const priceList = await PriceList.findById(req.params.id);
    if (!priceList) {
      return res.status(404).json({ success: false, message: 'Price list not found' });
    }

    await priceList.deleteOne();
    res.json({ success: true, message: 'Price list deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// POST add item to price list
router.post('/price-lists/:id/items', protect, authorize('shop_manager'), async (req, res, next) => {
  try {
    const priceList = await PriceList.findById(req.params.id);
    if (!priceList) {
      return res.status(404).json({ success: false, message: 'Price list not found' });
    }

    priceList.items.push(req.body);
    await priceList.save();
    await priceList.populate('items.product', 'name sku regularPrice');

    res.json({ success: true, data: priceList.items[priceList.items.length - 1] });
  } catch (error) {
    next(error);
  }
});

// PUT update price list item
router.put('/price-lists/:id/items/:itemId', protect, authorize('shop_manager'), async (req, res, next) => {
  try {
    const priceList = await PriceList.findById(req.params.id);
    if (!priceList) {
      return res.status(404).json({ success: false, message: 'Price list not found' });
    }

    const item = priceList.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Price list item not found' });
    }

    Object.assign(item, req.body);
    await priceList.save();
    await priceList.populate('items.product', 'name sku regularPrice');

    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// DELETE price list item
router.delete('/price-lists/:id/items/:itemId', protect, authorize('shop_manager'), async (req, res, next) => {
  try {
    const priceList = await PriceList.findById(req.params.id);
    if (!priceList) {
      return res.status(404).json({ success: false, message: 'Price list not found' });
    }

    priceList.items.id(req.params.itemId).deleteOne();
    await priceList.save();

    res.json({ success: true, message: 'Price list item deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// ==================== PRICING RULES ====================

// GET all pricing rules
router.get('/pricing-rules', protect, authorize('admin', 'shop_manager'), checkPermission('pricing_rules', 'read'), async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, isActive, ruleType } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    if (ruleType && ruleType !== '') {
      query.ruleType = ruleType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get rules with proper population
    const rules = await PricingRule.find(query)
      .populate({
        path: 'customerGroups',
        select: 'name slug',
        options: { lean: true }
      })
      .populate({
        path: 'customers',
        select: 'firstName lastName email',
        options: { lean: true }
      })
      .populate({
        path: 'products',
        select: 'name sku',
        options: { lean: true }
      })
      .populate({
        path: 'categories',
        select: 'name slug',
        options: { lean: true }
      })
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean for better performance

    const total = await PricingRule.countDocuments(query);
    
    console.log(`Found ${rules.length} pricing rules (total: ${total})`);

    res.json({
      success: true,
      data: rules,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET single pricing rule
router.get('/pricing-rules/:id', protect, authorize('admin', 'shop_manager'), checkPermission('pricing_rules', 'read'), async (req, res, next) => {
  try {
    const rule = await PricingRule.findById(req.params.id)
      .populate('customerGroups', 'name slug')
      .populate('customers', 'firstName lastName email')
      .populate('products', 'name sku')
      .populate('categories', 'name slug');

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
});

// POST create pricing rule
router.post('/pricing-rules', protect, authorize('shop_manager'), checkPermission('pricing_rules', 'create'), async (req, res, next) => {
  try {
    // Clean up empty arrays and null values, but keep them if they have values
    const cleanData = { ...req.body };
    
    // Convert empty strings to empty arrays, then clean up
    if (!Array.isArray(cleanData.customerGroups)) {
      cleanData.customerGroups = cleanData.customerGroups ? [cleanData.customerGroups] : [];
    }
    if (!Array.isArray(cleanData.customers)) {
      cleanData.customers = cleanData.customers ? [cleanData.customers] : [];
    }
    if (!Array.isArray(cleanData.products)) {
      cleanData.products = cleanData.products ? [cleanData.products] : [];
    }
    if (!Array.isArray(cleanData.categories)) {
      cleanData.categories = cleanData.categories ? [cleanData.categories] : [];
    }
    
    // Only delete if truly empty
    if (cleanData.customerGroups.length === 0) {
      delete cleanData.customerGroups;
    }
    if (cleanData.customers.length === 0) {
      delete cleanData.customers;
    }
    if (cleanData.products.length === 0) {
      delete cleanData.products;
    }
    if (cleanData.categories.length === 0) {
      delete cleanData.categories;
    }
    
    // Handle daysOfWeek - convert to numbers if strings
    if (Array.isArray(cleanData.daysOfWeek)) {
      cleanData.daysOfWeek = cleanData.daysOfWeek.map(d => typeof d === 'string' ? parseInt(d) : d).filter(d => !isNaN(d));
      if (cleanData.daysOfWeek.length === 0) {
        delete cleanData.daysOfWeek;
      }
    }
    
    // Handle timeOfDay
    if (cleanData.timeOfDay && (!cleanData.timeOfDay.start && !cleanData.timeOfDay.end)) {
      delete cleanData.timeOfDay;
    }
    
    // Handle quantityTiers - ensure proper structure
    if (Array.isArray(cleanData.quantityTiers)) {
      cleanData.quantityTiers = cleanData.quantityTiers.map(tier => ({
        minQuantity: tier.minQuantity || 1,
        maxQuantity: tier.maxQuantity || null,
        price: tier.price || undefined,
        discount: tier.discount || undefined,
        priceAdjustment: tier.priceAdjustment || undefined
      })).filter(tier => tier.minQuantity > 0);
      if (cleanData.quantityTiers.length === 0) {
        delete cleanData.quantityTiers;
      }
    }
    if (Array.isArray(cleanData.quantityTiers) && cleanData.quantityTiers.length === 0) {
      delete cleanData.quantityTiers;
    }
    if (Array.isArray(cleanData.daysOfWeek) && cleanData.daysOfWeek.length === 0) {
      delete cleanData.daysOfWeek;
    }
    if (cleanData.validFrom === '') {
      delete cleanData.validFrom;
    }
    if (cleanData.validUntil === '') {
      delete cleanData.validUntil;
    }
    if (cleanData.minQuantity === '') {
      delete cleanData.minQuantity;
    }
    if (cleanData.maxQuantity === '') {
      delete cleanData.maxQuantity;
    }
    if (cleanData.minOrderValue === '') {
      delete cleanData.minOrderValue;
    }
    if (cleanData.maxOrderValue === '') {
      delete cleanData.maxOrderValue;
    }
    if (cleanData.maxDiscount === '') {
      delete cleanData.maxDiscount;
    }
    if (cleanData.maxDiscountAmount === '') {
      delete cleanData.maxDiscountAmount;
    }

    console.log('Creating pricing rule with cleaned data:', JSON.stringify(cleanData, null, 2));
    const rule = await PricingRule.create(cleanData);
    await rule.populate('customerGroups products categories');
    console.log('Pricing rule created successfully:', rule._id, rule.name);
    
    // Apply rule to affected products to update their regular prices
    const productPriceUpdater = require('../services/productPriceUpdater');
    try {
      const updatedCount = await productPriceUpdater.applyRuleToProducts(rule._id);
      console.log(`Applied pricing rule to ${updatedCount} products`);
    } catch (error) {
      console.error('Error applying rule to products:', error);
      // Don't fail the request, just log the error
    }
    
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    console.error('Error creating pricing rule:', error);
    next(error);
  }
});

// PUT update pricing rule
// Query params:
//   ?updateProducts=true  — re-apply the updated rule to all affected products (default: false)
router.put('/pricing-rules/:id', protect, authorize('shop_manager'), checkPermission('pricing_rules', 'update'), async (req, res, next) => {
  try {
    // Clean data similar to POST
    const cleanData = { ...req.body };
    
    // Convert empty strings to empty arrays, then clean up (same as POST)
    if (!Array.isArray(cleanData.customerGroups)) {
      cleanData.customerGroups = cleanData.customerGroups ? [cleanData.customerGroups] : [];
    }
    if (!Array.isArray(cleanData.customers)) {
      cleanData.customers = cleanData.customers ? [cleanData.customers] : [];
    }
    if (!Array.isArray(cleanData.products)) {
      cleanData.products = cleanData.products ? [cleanData.products] : [];
    }
    if (!Array.isArray(cleanData.categories)) {
      cleanData.categories = cleanData.categories ? [cleanData.categories] : [];
    }
    
    if (cleanData.customerGroups.length === 0) delete cleanData.customerGroups;
    if (cleanData.customers.length === 0) delete cleanData.customers;
    if (cleanData.products.length === 0) delete cleanData.products;
    if (cleanData.categories.length === 0) delete cleanData.categories;
    
    if (Array.isArray(cleanData.daysOfWeek)) {
      cleanData.daysOfWeek = cleanData.daysOfWeek.map(d => typeof d === 'string' ? parseInt(d) : d).filter(d => !isNaN(d));
      if (cleanData.daysOfWeek.length === 0) delete cleanData.daysOfWeek;
    }
    
    if (cleanData.timeOfDay && (!cleanData.timeOfDay.start && !cleanData.timeOfDay.end)) {
      delete cleanData.timeOfDay;
    }
    
    if (Array.isArray(cleanData.quantityTiers)) {
      cleanData.quantityTiers = cleanData.quantityTiers.map(tier => ({
        minQuantity: tier.minQuantity || 1,
        maxQuantity: tier.maxQuantity || null,
        price: tier.price || undefined,
        discount: tier.discount || undefined,
        priceAdjustment: tier.priceAdjustment || undefined
      })).filter(tier => tier.minQuantity > 0);
      if (cleanData.quantityTiers.length === 0) delete cleanData.quantityTiers;
    }
    
    const rule = await PricingRule.findByIdAndUpdate(
      req.params.id,
      cleanData,
      { new: true, runValidators: true }
    ).populate('customerGroups products categories');

    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    let updatedCount = 0;
    const shouldUpdate = req.query.updateProducts === 'true';

    if (shouldUpdate) {
      const productPriceUpdater = require('../services/productPriceUpdater');
      try {
        updatedCount = await productPriceUpdater.applyRuleToProducts(rule._id);
        console.log(`Applied updated pricing rule to ${updatedCount} products`);
      } catch (error) {
        console.error('Error applying rule to products:', error);
      }
    }

    res.json({ success: true, data: rule, updatedProducts: updatedCount });
  } catch (error) {
    next(error);
  }
});

// GET affected products count for a pricing rule (preview before delete/update)
router.get('/pricing-rules/:id/affected-products', protect, authorize('admin', 'shop_manager'), checkPermission('pricing_rules', 'read'), async (req, res, next) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    const productPriceUpdater = require('../services/productPriceUpdater');
    const productIds = await productPriceUpdater.getAffectedProductIds(rule);

    res.json({
      success: true,
      data: {
        count: productIds.length,
        targetField: rule.targetField || 'regularPrice',
        sourceField: rule.sourceField || 'backendPrice',
        action: rule.action,
        value: rule.value
      }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE pricing rule
// Query params:
//   ?priceAction=none       — just delete the rule, don't touch product prices
//   ?priceAction=clear       — delete rule AND clear the target price field on affected products
//   ?priceAction=clearBoth   — delete rule AND clear both regularPrice and salePrice
//   ?priceAction=recalculate — (default) delete rule AND recalculate remaining rules on affected products
router.delete('/pricing-rules/:id', protect, authorize('shop_manager'), checkPermission('pricing_rules', 'delete'), async (req, res, next) => {
  try {
    const rule = await PricingRule.findById(req.params.id);
    if (!rule) {
      return res.status(404).json({ success: false, message: 'Pricing rule not found' });
    }

    const priceAction = req.query.priceAction || 'recalculate';
    const productPriceUpdater = require('../services/productPriceUpdater');

    // Get affected product IDs before deleting the rule
    const productIds = await productPriceUpdater.getAffectedProductIds(rule);
    let affectedCount = 0;

    if (priceAction === 'clear') {
      // Clear only the target field (e.g. regularPrice) on affected products
      affectedCount = await productPriceUpdater.clearProductPrices(rule, { clearTarget: true });
    } else if (priceAction === 'clearBoth') {
      // Clear both regularPrice and salePrice on affected products
      affectedCount = await productPriceUpdater.clearProductPrices(rule, { clearBoth: true });
    }

    // Delete the rule
    await rule.deleteOne();

    if (priceAction === 'recalculate' && productIds.length > 0) {
      // Recalculate remaining rules for affected products
      for (const productId of productIds) {
        try {
          await productPriceUpdater.applyRulesToProduct(productId);
          affectedCount++;
        } catch (error) {
          console.error(`Error recalculating product ${productId}:`, error);
        }
      }
    }

    res.json({
      success: true,
      message: 'Pricing rule deleted successfully',
      affectedProducts: affectedCount
    });
  } catch (error) {
    next(error);
  }
});

// ==================== PRICE RECALCULATION ====================

// POST recalculate product prices
router.post('/recalculate-prices', protect, authorize('shop_manager'), async (req, res, next) => {
  try {
    const { productId } = req.body;
    const productPriceUpdater = require('../services/productPriceUpdater');
    
    if (productId) {
      // Recalculate single product
      await productPriceUpdater.applyRulesToProduct(productId);
      res.json({ success: true, message: 'Product price recalculated successfully' });
    } else {
      // Recalculate all products
      const count = await productPriceUpdater.recalculateAllProducts();
      res.json({ success: true, message: `Recalculated prices for ${count} products` });
    }
  } catch (error) {
    next(error);
  }
});

// ==================== PRICE CALCULATION ====================

// POST calculate price
router.post('/calculate-price', protect, async (req, res, next) => {
  try {
    const { productId, variationId, quantity = 1, orderValue = 0 } = req.body;
    const customerId = req.user.role === 'customer' ? req.user._id : req.body.customerId;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const result = await pricingService.calculatePrice({
      productId,
      variationId,
      customerId,
      quantity,
      orderValue
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST calculate batch prices
router.post('/calculate-batch-prices', protect, async (req, res, next) => {
  try {
    const { products, orderValue = 0 } = req.body;
    const customerId = req.user.role === 'customer' ? req.user._id : req.body.customerId;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Products array is required' });
    }

    const results = await pricingService.calculateBatchPrices(products, {
      customerId,
      orderValue
    });

    res.json({ success: true, data: results });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
