const Product = require('../models/Product');
const PricingRule = require('../models/PricingRule');
const pricingService = require('./pricingService');

/**
 * Service to apply pricing rules to products and update their regular prices
 * based on backend price
 */
class ProductPriceUpdater {
  /**
   * Apply all active pricing rules to a specific product
   * @param {String} productId - Product ID
   * @param {Object} options - Optional overrides for sourceField/targetField
   * @returns {Promise<Object>} - Updated product with new prices
   */
  async applyRulesToProduct(productId, options = {}) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get all active pricing rules that apply to this product
    const rules = await this.getApplicableRules(productId);

    if (rules.length === 0) {
      console.log(`[ProductPriceUpdater] No applicable rules for product ${productId}`);
      return product;
    }

    // Sort rules by priority (highest first)
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let modified = false;

    // Apply each rule independently using its own sourceField and targetField
    for (const rule of rules) {
      const sourceField = options.sourceField || rule.sourceField || 'backendPrice';
      const targetField = options.targetField || rule.targetField || 'regularPrice';

      // Read the source price
      let sourcePrice = product[sourceField];
      if (!sourcePrice || sourcePrice <= 0) {
        // Fallback: if source field is empty, try backendPrice, then regularPrice
        if (sourceField !== 'backendPrice' && product.backendPrice > 0) {
          sourcePrice = product.backendPrice;
        } else if (sourceField !== 'regularPrice' && product.regularPrice > 0) {
          sourcePrice = product.regularPrice;
        } else {
          console.log(`[ProductPriceUpdater] Product ${productId} has no valid ${sourceField}, skipping rule "${rule.name}"`);
          continue;
        }
      }

      const priceBefore = sourcePrice;
      const result = pricingService.applyRuleAction(rule, sourcePrice, sourcePrice);
      const calculatedPrice = Math.round(result.price * 100) / 100;

      // Write to the target field
      product[targetField] = calculatedPrice;
      modified = true;

      console.log(`[ProductPriceUpdater] Rule "${rule.name}": ${sourceField}(${priceBefore}) -> ${targetField}(${calculatedPrice}) [${rule.action} ${rule.value}${rule.action.includes('percentage') ? '%' : ''}]`);
    }

    if (modified) {
      await product.save();
    }
    
    return product;
  }

  /**
   * Get all active pricing rules that apply to a product
   * @param {String} productId - Product ID
   * @returns {Promise<Array>} - Array of applicable rules
   */
  async getApplicableRules(productId) {
    const product = await Product.findById(productId).populate('categories');
    if (!product) {
      return [];
    }

    const now = new Date();
    const query = {
      isActive: true,
      $or: [
        // Product-specific rules
        { ruleType: 'product_specific', products: productId },
        // Category-based rules
        { ruleType: 'category_based', categories: { $in: product.categories || [] } },
        // Combo rules that include this product
        { ruleType: 'combo', products: productId }
      ],
      $and: [
        {
          $or: [
            { validFrom: { $exists: false } },
            { validFrom: null },
            { validFrom: { $lte: now } }
          ]
        },
        {
          $or: [
            { validUntil: { $exists: false } },
            { validUntil: null },
            { validUntil: { $gte: now } }
          ]
        }
      ]
    };

    const rules = await PricingRule.find(query)
      .populate('products')
      .populate('categories')
      .populate('customerGroups')
      .sort({ priority: -1 });

    // Filter rules to ensure they actually apply (check product match)
    const applicableRules = rules.filter(rule => {
      // For product-specific and combo rules, verify product is in the list
      if (rule.products && rule.products.length > 0) {
        const productIds = rule.products.map(p => String(p._id || p));
        if (!productIds.includes(String(productId))) {
          return false;
        }
      }
      
      // For category-based rules, verify category match
      if (rule.categories && rule.categories.length > 0 && product.categories) {
        const ruleCategoryIds = rule.categories.map(c => String(c._id || c));
        const productCategoryIds = product.categories.map(c => String(c._id || c));
        const hasMatch = ruleCategoryIds.some(id => productCategoryIds.includes(id));
        if (!hasMatch) {
          return false;
        }
      }

      return true;
    });

    return applicableRules;
  }

  /**
   * Apply rules to all products that match a pricing rule
   * @param {String} ruleId - Pricing rule ID
   * @returns {Promise<Number>} - Number of products updated
   */
  async applyRuleToProducts(ruleId) {
    const rule = await PricingRule.findById(ruleId);
    if (!rule || !rule.isActive) {
      return 0;
    }

    let productIds = [];

    // Get product IDs based on rule type
    if (rule.products && rule.products.length > 0) {
      productIds = rule.products.map(p => String(p._id || p));
    } else if (rule.categories && rule.categories.length > 0) {
      // Get all products in these categories
      const products = await Product.find({
        categories: { $in: rule.categories },
        status: { $ne: 'trash' }
      }).select('_id');
      productIds = products.map(p => String(p._id));
    } else {
      // Rule doesn't target specific products, skip
      return 0;
    }

    // Apply rule to each product
    let updated = 0;
    for (const productId of productIds) {
      try {
        await this.applyRulesToProduct(productId);
        updated++;
      } catch (error) {
        console.error(`[ProductPriceUpdater] Error applying rules to product ${productId}:`, error);
      }
    }

    console.log(`[ProductPriceUpdater] Applied rule ${ruleId} to ${updated} products`);
    return updated;
  }

  /**
   * Get product IDs affected by a pricing rule
   * @param {Object} rule - The pricing rule document
   * @returns {Promise<Array<String>>} - Array of product ID strings
   */
  async getAffectedProductIds(rule) {
    let productIds = [];
    if (rule.products && rule.products.length > 0) {
      productIds = rule.products.map(p => String(p._id || p));
    } else if (rule.categories && rule.categories.length > 0) {
      const products = await Product.find({
        categories: { $in: rule.categories },
        status: { $ne: 'trash' }
      }).select('_id');
      productIds = products.map(p => String(p._id));
    }
    return productIds;
  }

  /**
   * Clear price fields on products that were affected by a rule.
   * Sets the target field (e.g. regularPrice or salePrice) to null/0 for all affected products.
   * @param {Object} rule - The pricing rule document (before deletion)
   * @param {Object} options
   * @param {Boolean} options.clearTarget - If true, set targetField to null
   * @param {Boolean} options.clearBoth - If true, clear both regularPrice and salePrice
   * @returns {Promise<Number>} - Number of products updated
   */
  async clearProductPrices(rule, options = {}) {
    const { clearTarget = true, clearBoth = false } = options;
    const productIds = await this.getAffectedProductIds(rule);
    console.log(`[ProductPriceUpdater.clearProductPrices] clearBoth=${clearBoth} clearTarget=${clearTarget} products=${productIds.length}`);
    if (productIds.length === 0) return 0;

    const targetField = rule.targetField || 'regularPrice';

    // regularPrice is required in the Product schema, so we set it to 0 rather than null/unset.
    // salePrice is optional, so we can unset it.
    const setFields = {};
    const unsetFields = {};

    if (clearBoth) {
      setFields.regularPrice = 0;
      unsetFields.salePrice = '';
    } else if (clearTarget) {
      if (targetField === 'regularPrice') {
        setFields.regularPrice = 0;
      } else if (targetField === 'salePrice') {
        unsetFields.salePrice = '';
      } else {
        setFields[targetField] = 0;
      }
    }

    const updateOp = {};
    if (Object.keys(setFields).length > 0) updateOp.$set = setFields;
    if (Object.keys(unsetFields).length > 0) updateOp.$unset = unsetFields;
    if (Object.keys(updateOp).length === 0) return 0;

    console.log(`[ProductPriceUpdater.clearProductPrices] updateOp:`, JSON.stringify(updateOp), 'on', productIds.length, 'products');

    // Use raw MongoDB updateMany to bypass Mongoose validators (salePrice validator checks against regularPrice)
    const mongoose = require('mongoose');
    const result = await Product.collection.updateMany(
      { _id: { $in: productIds.map(id => new mongoose.Types.ObjectId(id)) } },
      updateOp
    );

    console.log(`[ProductPriceUpdater] Cleared prices for ${result.modifiedCount} products (matched: ${result.matchedCount})`);
    return result.modifiedCount;
  }

  /**
   * Recalculate prices for all products (useful after bulk rule changes)
   * @returns {Promise<Number>} - Number of products updated
   */
  async recalculateAllProducts() {
    const products = await Product.find({
      status: { $ne: 'trash' },
      backendPrice: { $exists: true, $gt: 0 }
    }).select('_id');

    let updated = 0;
    for (const product of products) {
      try {
        await this.applyRulesToProduct(product._id);
        updated++;
      } catch (error) {
        console.error(`[ProductPriceUpdater] Error recalculating product ${product._id}:`, error);
      }
    }

    console.log(`[ProductPriceUpdater] Recalculated prices for ${updated} products`);
    return updated;
  }
}

module.exports = new ProductPriceUpdater();
