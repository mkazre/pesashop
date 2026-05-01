const mongoose = require('mongoose');
const Product = require('../models/Product');
const PricingRule = require('../models/PricingRule');
const pricingService = require('./pricingService');

const CHUNK_SIZE = 500;
const ROUND2 = (n) => Math.round(n * 100) / 100;

/**
 * Service to apply pricing rules to products and update their regular prices.
 *
 * Bulk operations stream products via a cursor (constant memory) and write via
 * `Product.collection.bulkWrite` — bypassing Mongoose hooks/validators so a
 * 90,000-product run completes in tens of seconds rather than tens of minutes.
 */
class ProductPriceUpdater {
  // ─── Single-product flow (kept for callers that want hooks/validators) ───
  /**
   * Apply all active pricing rules to a specific product (slow path, hooks fire).
   */
  async applyRulesToProduct(productId, options = {}) {
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    const rules = await this.getApplicableRules(productId);
    if (rules.length === 0) {
      return product;
    }

    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    let modified = false;
    for (const rule of rules) {
      const sourceField = options.sourceField || rule.sourceField || 'backendPrice';
      const targetField = options.targetField || rule.targetField || 'regularPrice';

      let sourcePrice = product[sourceField];
      if (!sourcePrice || sourcePrice <= 0) {
        if (sourceField !== 'backendPrice' && product.backendPrice > 0) {
          sourcePrice = product.backendPrice;
        } else if (sourceField !== 'regularPrice' && product.regularPrice > 0) {
          sourcePrice = product.regularPrice;
        } else {
          continue;
        }
      }

      const result = pricingService.applyRuleAction(rule, sourcePrice, sourcePrice);
      product[targetField] = ROUND2(Math.max(0, result.price));
      modified = true;
    }

    if (modified) {
      await product.save();
    }
    return product;
  }

  async getApplicableRules(productId) {
    const product = await Product.findById(productId).populate('categories');
    if (!product) return [];

    const now = new Date();
    const query = {
      isActive: true,
      $or: [
        { ruleType: 'product_specific', products: productId },
        { ruleType: 'category_based', categories: { $in: product.categories || [] } },
        { ruleType: 'combo', products: productId },
      ],
      $and: [
        { $or: [{ validFrom: { $exists: false } }, { validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gte: now } }] },
      ],
    };

    const rules = await PricingRule.find(query).sort({ priority: -1 });
    return rules.filter((rule) => {
      if (rule.products && rule.products.length > 0) {
        const ids = rule.products.map((p) => String(p._id || p));
        if (!ids.includes(String(productId))) return false;
      }
      if (rule.categories && rule.categories.length > 0 && product.categories) {
        const ruleCats = rule.categories.map((c) => String(c._id || c));
        const productCats = product.categories.map((c) => String(c._id || c));
        if (!ruleCats.some((id) => productCats.includes(id))) return false;
      }
      return true;
    });
  }

  // ─── Bulk flows (fast path, no Mongoose hooks) ──────────────────────────
  /**
   * Apply ONE rule to all products it affects.
   * Streams products in chunks of CHUNK_SIZE and uses bulkWrite — safe for 90k+ products.
   */
  async applyRuleToProducts(ruleId, options = {}) {
    const rule = await PricingRule.findById(ruleId);
    if (!rule || !rule.isActive) return 0;

    const productFilter = this._buildRuleProductFilter(rule);
    if (!productFilter) return 0;

    return this._bulkApplyRules({
      productFilter,
      rules: [rule],
      onProgress: options.onProgress,
    });
  }

  /**
   * Recalculate prices for ALL products by re-applying every active product/category rule.
   * Loads all rules ONCE, indexes them, then streams products and writes via bulkWrite.
   */
  async recalculateAllProducts(options = {}) {
    const rules = await this._loadActiveRules();
    if (rules.length === 0) {
      if (options.onProgress) options.onProgress({ processed: 0, total: 0, updated: 0, done: true });
      return 0;
    }

    return this._bulkApplyRules({
      productFilter: {
        status: { $ne: 'trash' },
        backendPrice: { $exists: true, $gt: 0 },
      },
      rules,
      onProgress: options.onProgress,
    });
  }

  /**
   * Recalculate rules for a specific list of product IDs (used after deleting a rule).
   */
  async recalculateProducts(productIds, options = {}) {
    if (!Array.isArray(productIds) || productIds.length === 0) return 0;
    const rules = await this._loadActiveRules();

    const objectIds = productIds
      .map((id) => {
        try { return new mongoose.Types.ObjectId(String(id)); } catch { return null; }
      })
      .filter(Boolean);
    if (objectIds.length === 0) return 0;

    return this._bulkApplyRules({
      productFilter: { _id: { $in: objectIds } },
      rules,
      onProgress: options.onProgress,
    });
  }

  /**
   * Get product IDs affected by a pricing rule (preview before delete/update).
   */
  async getAffectedProductIds(rule) {
    let productIds = [];
    if (rule.products && rule.products.length > 0) {
      productIds = rule.products.map((p) => String(p._id || p));
    } else if (rule.categories && rule.categories.length > 0) {
      const products = await Product.find({
        categories: { $in: rule.categories },
        status: { $ne: 'trash' },
      }).select('_id').lean();
      productIds = products.map((p) => String(p._id));
    }
    return productIds;
  }

  /**
   * Clear price fields on products that were affected by a rule.
   */
  async clearProductPrices(rule, options = {}) {
    const { clearTarget = true, clearBoth = false } = options;
    const productIds = await this.getAffectedProductIds(rule);
    if (productIds.length === 0) return 0;

    const targetField = rule.targetField || 'regularPrice';
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

    const result = await Product.collection.updateMany(
      { _id: { $in: productIds.map((id) => new mongoose.Types.ObjectId(id)) } },
      updateOp
    );

    console.log(`[ProductPriceUpdater] Cleared prices for ${result.modifiedCount} products (matched: ${result.matchedCount})`);
    return result.modifiedCount;
  }

  // ─── Internal helpers ───────────────────────────────────────────────────

  async _loadActiveRules() {
    const now = new Date();
    return PricingRule.find({
      isActive: true,
      ruleType: { $in: ['product_specific', 'category_based', 'combo'] },
      $and: [
        { $or: [{ validFrom: { $exists: false } }, { validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validUntil: { $exists: false } }, { validUntil: null }, { validUntil: { $gte: now } }] },
      ],
    }).sort({ priority: -1 }).lean();
  }

  _buildRuleProductFilter(rule) {
    if (rule.products && rule.products.length > 0) {
      return {
        _id: { $in: rule.products.map((p) => new mongoose.Types.ObjectId(String(p._id || p))) },
        status: { $ne: 'trash' },
      };
    }
    if (rule.categories && rule.categories.length > 0) {
      return {
        categories: { $in: rule.categories.map((c) => new mongoose.Types.ObjectId(String(c._id || c))) },
        status: { $ne: 'trash' },
      };
    }
    return null;
  }

  /**
   * Index rules by product ID and category ID for O(1) per-product lookup.
   */
  _indexRules(rules) {
    const byProduct = new Map();
    const byCategory = new Map();
    for (const rule of rules) {
      const hasProducts = Array.isArray(rule.products) && rule.products.length > 0;
      const hasCategories = Array.isArray(rule.categories) && rule.categories.length > 0;
      if (hasProducts) {
        for (const pid of rule.products) {
          const k = String(pid._id || pid);
          if (!byProduct.has(k)) byProduct.set(k, []);
          byProduct.get(k).push(rule);
        }
      }
      if (hasCategories) {
        for (const cid of rule.categories) {
          const k = String(cid._id || cid);
          if (!byCategory.has(k)) byCategory.set(k, []);
          byCategory.get(k).push(rule);
        }
      }
    }
    return { byProduct, byCategory };
  }

  _resolveRulesForProduct(product, idx) {
    const ruleMap = new Map();
    const pid = String(product._id);
    if (idx.byProduct.has(pid)) {
      for (const r of idx.byProduct.get(pid)) ruleMap.set(String(r._id), r);
    }
    if (Array.isArray(product.categories)) {
      for (const cat of product.categories) {
        const cid = String(cat?._id || cat);
        if (idx.byCategory.has(cid)) {
          for (const r of idx.byCategory.get(cid)) ruleMap.set(String(r._id), r);
        }
      }
    }
    if (ruleMap.size === 0) return [];
    return [...ruleMap.values()].sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }

  _computeUpdate(product, rules) {
    if (!rules || rules.length === 0) return null;

    const working = {
      backendPrice: product.backendPrice,
      regularPrice: product.regularPrice,
      salePrice: product.salePrice,
    };

    let touched = false;
    for (const rule of rules) {
      const sourceField = rule.sourceField || 'backendPrice';
      const targetField = rule.targetField || 'regularPrice';

      let sourcePrice = working[sourceField];
      if (!sourcePrice || sourcePrice <= 0) {
        if (sourceField !== 'backendPrice' && working.backendPrice > 0) sourcePrice = working.backendPrice;
        else if (sourceField !== 'regularPrice' && working.regularPrice > 0) sourcePrice = working.regularPrice;
        else continue;
      }

      const result = pricingService.applyRuleAction(rule, sourcePrice, sourcePrice);
      working[targetField] = ROUND2(Math.max(0, result.price));
      touched = true;
    }

    if (!touched) return null;

    const update = {};
    for (const k of ['backendPrice', 'regularPrice', 'salePrice']) {
      if (working[k] !== undefined && working[k] !== product[k]) {
        update[k] = working[k];
      }
    }
    return Object.keys(update).length > 0 ? update : null;
  }

  /**
   * Stream products matching `productFilter`, apply `rules` to each, and bulkWrite the diff.
   * Returns the number of products actually modified.
   */
  async _bulkApplyRules({ productFilter, rules, onProgress }) {
    const idx = this._indexRules(rules);
    const total = await Product.countDocuments(productFilter);
    if (total === 0) {
      if (onProgress) onProgress({ processed: 0, total: 0, updated: 0, done: true });
      return 0;
    }

    const cursor = Product.collection.find(productFilter, {
      projection: { _id: 1, backendPrice: 1, regularPrice: 1, salePrice: 1, categories: 1 },
    }).batchSize(CHUNK_SIZE);

    let processed = 0;
    let updated = 0;
    let bulkOps = [];

    const flush = async () => {
      if (bulkOps.length === 0) return;
      const ops = bulkOps;
      bulkOps = [];
      const r = await Product.collection.bulkWrite(ops, { ordered: false });
      updated += r.modifiedCount || 0;
    };

    try {
      while (await cursor.hasNext()) {
        const product = await cursor.next();
        const applicable = this._resolveRulesForProduct(product, idx);
        const update = this._computeUpdate(product, applicable);
        if (update) {
          bulkOps.push({
            updateOne: {
              filter: { _id: product._id },
              update: { $set: { ...update, updatedAt: new Date() } },
            },
          });
        }
        processed++;

        if (bulkOps.length >= CHUNK_SIZE) {
          await flush();
          if (onProgress) onProgress({ processed, total, updated });
        }
      }
      await flush();
    } finally {
      try { await cursor.close(); } catch (_) {}
    }

    if (onProgress) onProgress({ processed, total, updated, done: true });
    console.log(`[ProductPriceUpdater] Bulk applied to ${updated}/${total} products (rules: ${rules.length})`);
    return updated;
  }
}

module.exports = new ProductPriceUpdater();
