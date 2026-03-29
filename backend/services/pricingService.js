const CustomerGroup = require('../models/CustomerGroup');
const PriceList = require('../models/PriceList');
const PricingRule = require('../models/PricingRule');
const Product = require('../models/Product');

class PricingService {
  /**
   * Calculate the final price for a product for a specific customer
   * @param {Object} options
   * @param {String} options.productId - Product ID
   * @param {String} options.variationId - Variation ID (optional)
   * @param {String} options.customerId - Customer ID (optional)
   * @param {String} options.customerGroupId - Customer Group ID (optional)
   * @param {Number} options.quantity - Quantity (for quantity breaks)
   * @param {Number} options.orderValue - Total order value (for volume discounts)
   * @returns {Promise<Object>} - { price, originalPrice, discount, appliedRules }
   */
  async calculatePrice(options = {}) {
    const {
      productId,
      variationId = null,
      customerId = null,
      customerGroupId = null,
      quantity = 1,
      orderValue = 0
    } = options;

    // Get product
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Get base price - use backendPrice if available, otherwise regularPrice
    // For pricing rules, we want to calculate from backend price
    const backendPrice = product.backendPrice || product.regularPrice;
    let basePrice = product.regularPrice; // This is the calculated price after rules
    let originalPrice = product.regularPrice; // Display price
    let salePrice = product.salePrice;

    // For variable products, get variation price
    if (variationId && product.variations && product.variations.length > 0) {
      const variation = product.variations.id(variationId);
      if (variation) {
        basePrice = variation.regularPrice;
        originalPrice = variation.regularPrice;
        salePrice = variation.salePrice;
      }
    }

    // Start with base price
    let finalPrice = salePrice || basePrice;
    const appliedRules = [];
    let totalDiscount = 0;
    let totalDiscountAmount = 0;

    // Get customer group if customer ID provided
    let customerGroup = null;
    if (customerId) {
      const User = require('../models/User');
      const customer = await User.findById(customerId).select('customerGroup');
      if (customer && customer.customerGroup) {
        customerGroup = await CustomerGroup.findOne({ slug: customer.customerGroup });
        if (customerGroup) {
          customerGroupId = customerGroup._id;
        }
      }
    } else if (customerGroupId) {
      customerGroup = await CustomerGroup.findById(customerGroupId);
    }

    // Apply customer group default discount
    if (customerGroup && customerGroup.defaultDiscount > 0) {
      const discount = (finalPrice * customerGroup.defaultDiscount) / 100;
      finalPrice -= discount;
      totalDiscount += customerGroup.defaultDiscount;
      totalDiscountAmount += discount;
      appliedRules.push({
        type: 'customer_group_default',
        name: customerGroup.name,
        discount: customerGroup.defaultDiscount,
        discountAmount: discount
      });
    }

    // Get applicable price lists (ordered by priority)
    const priceListQuery = {
      isActive: true,
      $or: [
        { appliesToAllProducts: true },
        { products: productId },
        { categories: { $in: product.categories || [] } }
      ],
      $and: [
        {
          $or: [
            { validFrom: { $exists: false } },
            { validFrom: { $lte: new Date() } }
          ]
        },
        {
          $or: [
            { validUntil: { $exists: false } },
            { validUntil: { $gte: new Date() } }
          ]
        }
      ]
    };

    if (customerGroupId) {
      priceListQuery.$or.push({ customerGroups: customerGroupId });
    }
    if (customerId) {
      priceListQuery.$or.push({ customers: customerId });
    }

    const priceLists = await PriceList.find(priceListQuery)
      .sort({ priority: -1 })
      .populate('items.product');

    // Apply price lists
    for (const priceList of priceLists) {
      // Check if price list applies to this customer/group
      const appliesToCustomer = 
        (customerGroupId && priceList.customerGroups.includes(customerGroupId)) ||
        (customerId && priceList.customers.includes(customerId)) ||
        priceList.appliesToAllProducts;

      if (!appliesToCustomer) continue;

      // Find matching item in price list
      const matchingItem = priceList.items.find(item => {
        if (String(item.product) !== String(productId)) return false;
        if (variationId && String(item.variation) !== String(variationId)) return false;
        if (item.minQuantity && quantity < item.minQuantity) return false;
        if (item.maxQuantity && quantity > item.maxQuantity) return false;
        if (item.validFrom && new Date() < item.validFrom) return false;
        if (item.validUntil && new Date() > item.validUntil) return false;
        return item.isActive;
      });

      if (matchingItem) {
        // Apply price list item
        if (priceList.pricingMethod === 'fixed' || priceList.pricingMethod === 'override') {
          finalPrice = matchingItem.price;
          if (matchingItem.salePrice && matchingItem.salePrice < matchingItem.price) {
            finalPrice = matchingItem.salePrice;
          }
        } else if (priceList.pricingMethod === 'percentage_discount') {
          const discount = (finalPrice * matchingItem.price) / 100;
          finalPrice -= discount;
          totalDiscount += matchingItem.price;
          totalDiscountAmount += discount;
        } else if (priceList.pricingMethod === 'percentage_markup') {
          finalPrice = basePrice + (basePrice * matchingItem.price / 100);
        }

        appliedRules.push({
          type: 'price_list',
          name: priceList.name,
          price: finalPrice
        });
        break; // First matching price list wins
      } else if (priceList.pricingMethod === 'percentage_discount' && priceList.defaultDiscount) {
        // Apply default discount from price list
        const discount = (finalPrice * priceList.defaultDiscount) / 100;
        finalPrice -= discount;
        totalDiscount += priceList.defaultDiscount;
        totalDiscountAmount += discount;
        appliedRules.push({
          type: 'price_list_default',
          name: priceList.name,
          discount: priceList.defaultDiscount,
          discountAmount: discount
        });
      }
    }

    // Get applicable pricing rules (ordered by priority)
    const mongoose = require('mongoose');
    
    // Build query conditions
    const orConditions = [];
    
    // Product-specific rules - use $in to match any product in the array
    if (productId) {
      const productObjectId = mongoose.Types.ObjectId.isValid(productId) 
        ? new mongoose.Types.ObjectId(productId) 
        : productId;
      orConditions.push({ 
        ruleType: 'product_specific', 
        products: { $in: [productObjectId] } 
      });
    }
    
    // Category-based rules
    if (product.categories && product.categories.length > 0) {
      orConditions.push({ ruleType: 'category_based', categories: { $in: product.categories } });
    }
    
    // Customer group rules
    if (customerGroupId) {
      orConditions.push({ ruleType: 'customer_group', customerGroups: customerGroupId });
    }
    
    // Customer-specific rules
    if (customerId) {
      orConditions.push({ ruleType: 'customer_specific', customers: customerId });
    }
    
    // Quantity-based rules (always check, but ruleApplies will filter)
    orConditions.push({ ruleType: 'quantity_based' });
    
    // Volume-based rules
    orConditions.push({ ruleType: 'volume_based' });
    
    // Date-based rules
    orConditions.push({ ruleType: 'date_based' });
    
    // Combo rules (check all conditions)
    orConditions.push({ ruleType: 'combo' });

    const ruleQuery = {
      isActive: true,
      $or: orConditions,
      $and: [
        {
          $or: [
            { validFrom: { $exists: false } },
            { validFrom: null },
            { validFrom: { $lte: new Date() } }
          ]
        },
        {
          $or: [
            { validUntil: { $exists: false } },
            { validUntil: null },
            { validUntil: { $gte: new Date() } }
          ]
        }
      ]
    };

    const rules = await PricingRule.find(ruleQuery).sort({ priority: -1 });
    
    console.log(`[calculatePrice] Found ${rules.length} potential rules for product ${productId}`);
    console.log(`[calculatePrice] Rule query:`, JSON.stringify(ruleQuery, null, 2));

    // Detect if markup rules have already been applied to this product
    // If backendPrice exists and regularPrice is significantly higher, markup was already applied by productPriceUpdater
    let markupAlreadyApplied = false;
    if (product.backendPrice > 0 && product.regularPrice > 0) {
      const priceRatio = product.regularPrice / product.backendPrice;
      // If ratio is > 1.5, assume markup has been applied (allowing for various markup percentages)
      if (priceRatio > 1.5) {
        markupAlreadyApplied = true;
        console.log(`[calculatePrice] Detected existing markup: regularPrice(${product.regularPrice}) / backendPrice(${product.backendPrice}) = ${priceRatio.toFixed(2)}x - will skip markup rules`);
      }
    }

    // Apply pricing rules
    for (const rule of rules) {
      // Skip markup rules if markup has already been applied to this product
      if (markupAlreadyApplied && (rule.action === 'markup_percentage' || rule.action === 'markup_fixed')) {
        console.log(`[calculatePrice] Skipping markup rule "${rule.name}" - markup already applied to product`);
        continue;
      }

      const applies = this.ruleApplies(rule, { customerId, customerGroupId, productId, quantity, orderValue });
      console.log(`[calculatePrice] Rule "${rule.name}" (${rule.ruleType}): applies=${applies}`);
      if (!applies) {
        continue;
      }

      // Check quantity tiers
      if (rule.quantityTiers && rule.quantityTiers.length > 0) {
        const matchingTier = rule.quantityTiers.find(tier => {
          if (quantity < tier.minQuantity) return false;
          if (tier.maxQuantity && quantity > tier.maxQuantity) return false;
          return true;
        });

        if (matchingTier) {
          if (matchingTier.price !== undefined) {
            finalPrice = matchingTier.price;
          } else if (matchingTier.discount) {
            const discount = (finalPrice * matchingTier.discount) / 100;
            finalPrice -= discount;
            totalDiscount += matchingTier.discount;
            totalDiscountAmount += discount;
          } else if (matchingTier.priceAdjustment) {
            finalPrice += matchingTier.priceAdjustment;
          }
          appliedRules.push({
            type: 'quantity_tier',
            name: rule.name,
            tier: matchingTier
          });
          continue;
        }
      }

      // Apply rule action
      const priceBeforeRule = finalPrice;
      const ruleResult = this.applyRuleAction(rule, finalPrice, basePrice);
      
      if (ruleResult && ruleResult.price !== undefined) {
        // Always apply the rule result for markup and set_price actions
        // For discount actions, only apply if price changes
        const shouldApply = rule.action === 'set_price' || 
                           rule.action === 'markup_percentage' || 
                           rule.action === 'markup_fixed' ||
                           ruleResult.price !== priceBeforeRule;
        
        if (shouldApply) {
          finalPrice = ruleResult.price;
          if (ruleResult.discount) {
            totalDiscount += ruleResult.discount;
            totalDiscountAmount += ruleResult.discountAmount || 0;
          }
          appliedRules.push({
            type: rule.ruleType,
            name: rule.name,
            action: rule.action,
            value: rule.value,
            discount: ruleResult.discount || 0,
            discountAmount: ruleResult.discountAmount || 0,
            priceBefore: priceBeforeRule,
            priceAfter: finalPrice
          });
          
          console.log(`✅ Applied rule "${rule.name}": ${priceBeforeRule} -> ${finalPrice} (${rule.action}: ${rule.value}${rule.action.includes('percentage') ? '%' : ''})`);
        } else {
          console.log(`⏭️  Skipped rule "${rule.name}" - no price change`);
        }
      } else {
        console.log(`❌ Rule "${rule.name}" returned invalid result:`, ruleResult);
      }

      // Check max discount cap (after applying rule)
      if (rule.maxDiscount && totalDiscount > rule.maxDiscount) {
        const excess = totalDiscount - rule.maxDiscount;
        const excessAmount = (finalPrice * excess) / 100;
        finalPrice += excessAmount;
        totalDiscount = rule.maxDiscount;
      }
      if (rule.maxDiscountAmount && totalDiscountAmount > rule.maxDiscountAmount) {
        const excess = totalDiscountAmount - rule.maxDiscountAmount;
        finalPrice += excess;
        totalDiscountAmount = rule.maxDiscountAmount;
      }
    }

    // Ensure price doesn't go below zero
    finalPrice = Math.max(0, finalPrice);

    return {
      price: Math.round(finalPrice * 100) / 100, // Round to 2 decimals
      originalPrice: Math.round(originalPrice * 100) / 100,
      basePrice: Math.round(basePrice * 100) / 100,
      salePrice: salePrice ? Math.round(salePrice * 100) / 100 : null,
      discount: Math.round(totalDiscount * 100) / 100,
      discountAmount: Math.round(totalDiscountAmount * 100) / 100,
      savings: Math.round((originalPrice - finalPrice) * 100) / 100,
      appliedRules: appliedRules,
      customerGroup: customerGroup ? {
        id: customerGroup._id,
        name: customerGroup.name,
        slug: customerGroup.slug
      } : null
    };
  }

  /**
   * Check if a pricing rule applies to the given context
   */
  ruleApplies(rule, context) {
    const { customerId, customerGroupId, productId, quantity, orderValue } = context;

    // Check customer group match
    if (rule.customerGroups && rule.customerGroups.length > 0) {
      if (!customerGroupId) {
        return false;
      }
      // Handle both populated objects and IDs
      const customerGroupIdStr = String(customerGroupId);
      const ruleGroupIds = rule.customerGroups.map(g => String(g._id || g));
      if (!ruleGroupIds.includes(customerGroupIdStr)) {
        return false;
      }
    }

    // Check customer match
    if (rule.customers && rule.customers.length > 0) {
      if (!customerId) {
        return false;
      }
      // Handle both populated objects and IDs
      const customerIdStr = String(customerId);
      const ruleCustomerIds = rule.customers.map(c => String(c._id || c));
      if (!ruleCustomerIds.includes(customerIdStr)) {
        return false;
      }
    }

    // Check product match
    if (rule.products && rule.products.length > 0) {
      if (!productId) {
        console.log(`[ruleApplies] Rule "${rule.name}": No productId provided, but rule has products`);
        return false;
      }
      // Convert both to strings for comparison
      const productIdStr = String(productId);
      const ruleProductIds = rule.products.map(p => String(p._id || p));
      const matches = ruleProductIds.includes(productIdStr);
      console.log(`[ruleApplies] Rule "${rule.name}": Checking product match - productId=${productIdStr}, ruleProducts=[${ruleProductIds.join(',')}], match=${matches}`);
      if (!matches) {
        return false;
      }
    }
    
    // Check category match (if rule has categories)
    if (rule.categories && rule.categories.length > 0) {
      // This will be checked separately in the query, but we need to verify here too
      // For now, if product match passed, category match should also pass (handled in query)
    }

    // Check quantity
    if (rule.minQuantity && quantity < rule.minQuantity) {
      return false;
    }
    if (rule.maxQuantity && quantity > rule.maxQuantity) {
      return false;
    }

    // Check order value
    if (rule.minOrderValue && orderValue < rule.minOrderValue) {
      return false;
    }
    if (rule.maxOrderValue && orderValue > rule.maxOrderValue) {
      return false;
    }

    // Check date/time constraints
    if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
      const currentDay = new Date().getDay();
      if (!rule.daysOfWeek.includes(currentDay)) {
        return false;
      }
    }

    if (rule.timeOfDay) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (rule.timeOfDay.start && currentTime < rule.timeOfDay.start) {
        return false;
      }
      if (rule.timeOfDay.end && currentTime > rule.timeOfDay.end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Apply a pricing rule action
   */
  applyRuleAction(rule, currentPrice, basePrice) {
    let newPrice = currentPrice;
    let discount = 0;
    let discountAmount = 0;

    switch (rule.action) {
      case 'discount_percentage':
        discount = rule.value;
        discountAmount = (currentPrice * rule.value) / 100;
        newPrice = currentPrice - discountAmount;
        break;

      case 'discount_fixed':
        discountAmount = rule.value;
        newPrice = currentPrice - rule.value;
        discount = (discountAmount / currentPrice) * 100;
        break;

      case 'set_price':
        newPrice = rule.value;
        discountAmount = currentPrice - rule.value;
        discount = (discountAmount / currentPrice) * 100;
        break;

      case 'markup_percentage':
        // Markup increases the price by percentage
        newPrice = currentPrice + (currentPrice * rule.value / 100);
        // For markup, we don't have a discount, it's an increase
        discount = 0;
        discountAmount = 0;
        break;

      case 'markup_fixed':
        // Markup increases the price by fixed amount
        newPrice = currentPrice + rule.value;
        discount = 0;
        discountAmount = 0;
        break;
    }

    return {
      price: newPrice,
      discount,
      discountAmount
    };
  }

  /**
   * Calculate prices for multiple products (batch)
   */
  async calculateBatchPrices(products, options = {}) {
    const results = await Promise.all(
      products.map(product => 
        this.calculatePrice({
          ...options,
          productId: product.productId || product._id,
          variationId: product.variationId
        }).catch(err => ({
          error: err.message,
          productId: product.productId || product._id
        }))
      )
    );
    return results;
  }
}

module.exports = new PricingService();
