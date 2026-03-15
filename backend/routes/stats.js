const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SiteEvent = require('../models/SiteEvent');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');

// ── Helper: date range filter ────────────────────────────────────────────────
function dateRange(days = 30) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS — used by frontend (no auth required)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/stats/event — Record a site event (public, lightweight)
 */
router.post('/event', async (req, res) => {
  try {
    const {
      type, productId, categoryId, page, referrer, pageTitle,
      searchQuery, searchResultCount, searchResultPosition,
      elementId, elementText, elementSection, metadata,
      quantity, sessionId,
    } = req.body;

    if (!type) {
      return res.status(400).json({ success: false, message: 'Event type is required' });
    }

    const event = {
      type,
      productId: productId || undefined,
      categoryId: categoryId || undefined,
      page,
      referrer,
      pageTitle,
      searchQuery,
      searchResultCount,
      searchResultPosition,
      elementId,
      elementText,
      elementSection,
      metadata,
      quantity,
      sessionId: sessionId || req.ip,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      createdAt: new Date(),
    };

    // If authenticated, attach userId
    if (req.headers.authorization) {
      try {
        const jwt = require('jsonwebtoken');
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        event.userId = decoded.id;
      } catch (_) { /* ignore invalid tokens */ }
    }

    // Fire and forget — don't block the response
    SiteEvent.create(event).catch(err => console.error('Event tracking error:', err.message));

    res.json({ success: true });
  } catch (error) {
    // Never fail the user's experience for tracking
    res.json({ success: true });
  }
});

/**
 * POST /api/stats/events/batch — Record multiple events at once
 */
router.post('/events/batch', async (req, res) => {
  try {
    const { events } = req.body;
    if (!Array.isArray(events) || events.length === 0) {
      return res.json({ success: true });
    }

    const enriched = events.slice(0, 50).map(e => ({
      ...e,
      productId: e.productId || undefined,
      categoryId: e.categoryId || undefined,
      sessionId: e.sessionId || req.ip,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      createdAt: new Date(),
    }));

    SiteEvent.insertMany(enriched, { ordered: false }).catch(err => console.error('Batch event error:', err.message));

    res.json({ success: true });
  } catch (error) {
    res.json({ success: true });
  }
});

/**
 * GET /api/stats/trending-products — Most ordered products (real sales data)
 */
router.get('/trending-products', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = Math.min(parseInt(req.query.limit) || 12, 30);

    // Primary: real order data from Order model
    const since = dateRange(days);
    const orderTrending = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalOrdered: { $sum: '$items.quantity' }, orderCount: { $sum: 1 }, revenue: { $sum: '$items.total' } } },
      { $sort: { totalOrdered: -1 } },
      { $limit: limit },
    ]);

    let productIds = orderTrending.map(t => t._id).filter(Boolean);
    let scoreMap = {};
    orderTrending.forEach(t => {
      if (t._id) scoreMap[t._id.toString()] = { totalOrdered: t.totalOrdered, orderCount: t.orderCount, revenue: t.revenue };
    });

    // If not enough from orders, supplement with most-viewed from SiteEvent
    if (productIds.length < limit) {
      const viewTrending = await SiteEvent.aggregate([
        { $match: { type: 'product_view', createdAt: { $gte: since }, productId: { $exists: true, $ne: null } } },
        { $group: { _id: '$productId', views: { $sum: 1 } } },
        { $sort: { views: -1 } },
        { $limit: limit * 2 },
      ]);
      viewTrending.forEach(v => {
        if (v._id && !scoreMap[v._id.toString()]) {
          productIds.push(v._id);
          scoreMap[v._id.toString()] = { totalOrdered: 0, orderCount: 0, revenue: 0, views: v.views };
        }
      });
      productIds = productIds.slice(0, limit);
    }

    // If STILL not enough, fall back to featured products
    if (productIds.length < limit) {
      const featured = await Product.find({ isActive: true, status: 'active', _id: { $nin: productIds } })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(limit - productIds.length)
        .select('_id');
      featured.forEach(p => productIds.push(p._id));
    }

    const products = await Product.find({ _id: { $in: productIds }, status: 'active' })
      .select('name slug regularPrice salePrice featuredImage images rating reviewCount categories')
      .populate('categories', 'name slug')
      .lean();

    // Sort by score
    products.sort((a, b) => {
      const sa = scoreMap[a._id.toString()]?.totalOrdered || 0;
      const sb = scoreMap[b._id.toString()]?.totalOrdered || 0;
      return sb - sa;
    });

    // Attach stats
    products.forEach(p => {
      p._stats = scoreMap[p._id.toString()] || {};
    });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trending products' });
  }
});

/**
 * GET /api/stats/popular-products — Most viewed/clicked products
 */
router.get('/popular-products', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = Math.min(parseInt(req.query.limit) || 12, 30);
    const since = dateRange(days);

    const popular = await SiteEvent.aggregate([
      { $match: { type: { $in: ['product_view', 'product_click', 'quick_view'] }, createdAt: { $gte: since }, productId: { $exists: true, $ne: null } } },
      { $group: {
        _id: '$productId',
        views: { $sum: { $cond: [{ $eq: ['$type', 'product_view'] }, 1, 0] } },
        clicks: { $sum: { $cond: [{ $eq: ['$type', 'product_click'] }, 1, 0] } },
        quickViews: { $sum: { $cond: [{ $eq: ['$type', 'quick_view'] }, 1, 0] } },
        uniqueSessions: { $addToSet: '$sessionId' },
      }},
      { $addFields: { uniqueVisitors: { $size: '$uniqueSessions' }, score: { $add: ['$views', { $multiply: ['$clicks', 2] }, { $multiply: ['$quickViews', 3] }] } } },
      { $sort: { score: -1 } },
      { $limit: limit },
      { $project: { uniqueSessions: 0 } },
    ]);

    let productIds = popular.map(p => p._id).filter(Boolean);
    const statsMap = {};
    popular.forEach(p => { if (p._id) statsMap[p._id.toString()] = p; });

    // Fallback to featured
    if (productIds.length < limit) {
      const featured = await Product.find({ isActive: true, status: 'active', _id: { $nin: productIds } })
        .sort({ isFeatured: -1, rating: -1 })
        .limit(limit - productIds.length)
        .select('_id');
      featured.forEach(p => productIds.push(p._id));
    }

    const products = await Product.find({ _id: { $in: productIds }, status: 'active' })
      .select('name slug regularPrice salePrice featuredImage images rating reviewCount categories')
      .populate('categories', 'name slug')
      .lean();

    products.sort((a, b) => {
      const sa = statsMap[a._id.toString()]?.score || 0;
      const sb = statsMap[b._id.toString()]?.score || 0;
      return sb - sa;
    });

    products.forEach(p => { p._stats = statsMap[p._id.toString()] || {}; });

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Popular products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch popular products' });
  }
});

/**
 * GET /api/stats/also-bought/:productId — Customers who bought X also bought Y
 */
router.get('/also-bought/:productId', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const productId = req.params.productId;

    // Find orders containing this product, then find other products in those orders
    const coBought = await Order.aggregate([
      { $match: { 'items.product': new mongoose.Types.ObjectId(productId), status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $ne: new mongoose.Types.ObjectId(productId) } } },
      { $group: { _id: '$items.product', coCount: { $sum: 1 }, totalQty: { $sum: '$items.quantity' } } },
      { $sort: { coCount: -1 } },
      { $limit: limit },
    ]);

    let productIds = coBought.map(c => c._id).filter(Boolean);

    // If not enough co-purchase data, supplement with same-category products
    if (productIds.length < limit) {
      const currentProduct = await Product.findById(productId).select('categories').lean();
      if (currentProduct?.categories?.length) {
        const sameCat = await Product.find({
          _id: { $nin: [productId, ...productIds] },
          categories: { $in: currentProduct.categories },
          status: 'active', isActive: true,
        })
          .sort({ rating: -1, isFeatured: -1 })
          .limit(limit - productIds.length)
          .select('_id');
        sameCat.forEach(p => productIds.push(p._id));
      }
    }

    const products = await Product.find({ _id: { $in: productIds }, status: 'active' })
      .select('name slug regularPrice salePrice featuredImage images rating reviewCount categories')
      .populate('categories', 'name slug')
      .lean();

    // Maintain co-buy score order
    const scoreMap = {};
    coBought.forEach(c => { if (c._id) scoreMap[c._id.toString()] = c.coCount; });
    products.sort((a, b) => (scoreMap[b._id.toString()] || 0) - (scoreMap[a._id.toString()] || 0));

    res.json({ success: true, data: products });
  } catch (error) {
    console.error('Also-bought error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch also-bought products' });
  }
});

/**
 * GET /api/stats/recommended/:productId — AI-powered complementary products
 * Uses active AI provider to find what goes well with this product,
 * then matches against our real catalog categories.
 */
router.get('/recommended/:productId', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 8, 20);
    const product = await Product.findById(req.params.productId)
      .select('name categories description shortDescription')
      .populate('categories', 'name slug')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    // Get all our categories
    const allCategories = await Category.find({ isActive: true })
      .select('name slug')
      .lean();

    const categoryNames = allCategories.map(c => c.name);
    const productCategories = (product.categories || []).map(c => c.name);

    // Ask AI for complementary product categories
    const aiAssistant = require('../services/aiAssistant');
    let aiCategoryMatches = [];

    try {
      const settings = await aiAssistant.getSettings();
      const hasProvider = Object.values(settings).some(s => s.enabled && s.apiKey);

      if (hasProvider) {
        const prompt = `I have an online store with these product categories: ${categoryNames.join(', ')}.

A customer is viewing: "${product.name}" (categories: ${productCategories.join(', ')}).

Which of my existing categories would contain products that complement or are commonly bought together with "${product.name}"?

Rules:
- Only suggest categories from MY list above
- Do NOT suggest the same categories the product is already in (${productCategories.join(', ')})
- Think about what accessories, add-ons, or related items a customer would need
- Return ONLY a JSON array of category names, nothing else
- Maximum 6 categories
- Example: ["Sound Bars", "HDMI Cables", "TV Stands"]`;

        const response = await aiAssistant.generateResponse(prompt, {
          productName: product.name,
          productDescription: product.shortDescription || product.description?.substring(0, 200) || '',
        }, null);

        // Parse AI response — extract JSON array
        const text = response.answer || '';
        const jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          aiCategoryMatches = parsed.filter(name =>
            categoryNames.some(cn => cn.toLowerCase() === name.toLowerCase())
          );
        }
      }
    } catch (aiErr) {
      console.error('AI recommendation error:', aiErr.message);
    }

    // Map AI-suggested category names to IDs
    const matchedCategoryIds = allCategories
      .filter(c => aiCategoryMatches.some(name => name.toLowerCase() === c.name.toLowerCase()))
      .map(c => c._id);

    let products = [];

    if (matchedCategoryIds.length > 0) {
      products = await Product.find({
        _id: { $ne: req.params.productId },
        categories: { $in: matchedCategoryIds },
        status: 'active',
        isActive: true,
      })
        .sort({ isFeatured: -1, rating: -1 })
        .limit(limit)
        .select('name slug regularPrice salePrice featuredImage images rating reviewCount categories')
        .populate('categories', 'name slug')
        .lean();
    }

    // If AI didn't return enough, supplement with popular products from other categories
    if (products.length < limit) {
      const existingIds = [req.params.productId, ...products.map(p => p._id.toString())];
      const supplement = await Product.find({
        _id: { $nin: existingIds },
        categories: { $nin: product.categories?.map(c => c._id) || [] },
        status: 'active',
        isActive: true,
      })
        .sort({ isFeatured: -1, rating: -1 })
        .limit(limit - products.length)
        .select('name slug regularPrice salePrice featuredImage images rating reviewCount categories')
        .populate('categories', 'name slug')
        .lean();
      products = [...products, ...supplement];
    }

    // Tag each product with the AI-matched category for context
    products.forEach(p => {
      p._recommendationSource = matchedCategoryIds.some(cid =>
        (p.categories || []).some(pc => pc._id.toString() === cid.toString())
      ) ? 'ai' : 'popular';
    });

    res.json({
      success: true,
      data: products,
      aiCategories: aiCategoryMatches,
    });
  } catch (error) {
    console.error('Recommended products error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recommendations' });
  }
});

/**
 * GET /api/stats/top-searches — Most popular search terms
 */
router.get('/top-searches', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const since = dateRange(days);

    const searches = await SiteEvent.aggregate([
      { $match: { type: 'search', searchQuery: { $exists: true, $ne: '' }, createdAt: { $gte: since } } },
      { $addFields: { _queryLen: { $strLenCP: '$searchQuery' } } },
      { $match: { _queryLen: { $gte: 3 } } },
      { $group: { _id: { $toLower: '$searchQuery' }, count: { $sum: 1 }, uniqueSessions: { $addToSet: '$sessionId' } } },
      { $addFields: { uniqueSearchers: { $size: '$uniqueSessions' } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, query: '$_id', count: 1, uniqueSearchers: 1 } },
    ]);

    res.json({ success: true, data: searches });
  } catch (error) {
    console.error('Top searches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top searches' });
  }
});

/**
 * GET /api/stats/mega-menu-data — All-in-one endpoint for the mega menu
 * Returns trending + popular + top searches in a single call
 */
router.get('/mega-menu-data', async (req, res) => {
  try {
    const since = dateRange(30);

    // Trending (most ordered) - top 4
    const trendingAgg = await Order.aggregate([
      { $match: { createdAt: { $gte: since }, status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', totalOrdered: { $sum: '$items.quantity' } } },
      { $sort: { totalOrdered: -1 } },
      { $limit: 8 },
    ]);

    let trendingIds = trendingAgg.map(t => t._id).filter(Boolean);

    // Popular (most viewed) - top 4
    const popularAgg = await SiteEvent.aggregate([
      { $match: { type: 'product_view', createdAt: { $gte: since }, productId: { $exists: true, $ne: null } } },
      { $group: { _id: '$productId', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 8 },
    ]);

    let popularIds = popularAgg.map(p => p._id).filter(Boolean);

    // Fallbacks if we don't have enough data
    const allNeededIds = [...new Set([...trendingIds, ...popularIds].map(id => id.toString()))];
    if (allNeededIds.length < 8) {
      const featured = await Product.find({ isActive: true, status: 'active', _id: { $nin: allNeededIds } })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(16 - allNeededIds.length)
        .select('_id');
      const fallbackIds = featured.map(f => f._id);
      if (trendingIds.length < 4) {
        trendingIds = [...trendingIds, ...fallbackIds.slice(0, 4 - trendingIds.length)];
      }
      if (popularIds.length < 4) {
        popularIds = [...popularIds, ...fallbackIds.slice(0, 4 - popularIds.length)];
      }
    }

    const allIds = [...new Set([...trendingIds, ...popularIds].map(id => id.toString()))];

    const products = await Product.find({ _id: { $in: allIds }, status: 'active' })
      .select('name slug regularPrice salePrice featuredImage images rating reviewCount')
      .lean();

    const productMap = {};
    products.forEach(p => { productMap[p._id.toString()] = p; });

    const trending = trendingIds.slice(0, 4).map(id => productMap[id?.toString()]).filter(Boolean);
    const popular = popularIds.slice(0, 4)
      .filter(id => !trendingIds.some(tid => tid?.toString() === id?.toString())) // avoid duplicates
      .map(id => productMap[id?.toString()])
      .filter(Boolean);

    // Top searches (filter out short partial queries < 3 chars)
    const topSearches = await SiteEvent.aggregate([
      { $match: { type: 'search', searchQuery: { $exists: true, $ne: '' }, createdAt: { $gte: since } } },
      { $addFields: { _queryLen: { $strLenCP: '$searchQuery' } } },
      { $match: { _queryLen: { $gte: 3 } } },
      { $group: { _id: { $toLower: '$searchQuery' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
      { $project: { _id: 0, query: '$_id', count: 1 } },
    ]);

    // Quick stat: total orders this month
    const monthlyOrders = await Order.countDocuments({ createdAt: { $gte: since }, status: { $nin: ['cancelled', 'refunded'] } });

    res.json({
      success: true,
      data: {
        trending,
        popular,
        topSearches,
        monthlyOrders,
      },
    });
  } catch (error) {
    console.error('Mega menu data error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mega menu data' });
  }
});


/**
 * GET /api/stats/also-viewed/:productId — Customers who viewed X also viewed Y
 * Uses session-based co-viewing patterns from SiteEvent data
 */
router.get('/also-viewed/:productId', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 20);
    const productId = req.params.productId;
    const since = dateRange(30);

    // Find sessions that viewed this product
    const sessions = await SiteEvent.aggregate([
      { $match: { type: 'product_view', productId, createdAt: { $gte: since }, sessionId: { $exists: true, $ne: null } } },
      { $group: { _id: '$sessionId' } },
      { $limit: 500 }, // cap for performance
    ]);

    const sessionIds = sessions.map(s => s._id);
    let coViewedProducts = [];

    if (sessionIds.length > 0) {
      // Find other products these sessions viewed
      coViewedProducts = await SiteEvent.aggregate([
        { $match: {
          type: 'product_view',
          sessionId: { $in: sessionIds },
          productId: { $exists: true, $ne: productId },
          createdAt: { $gte: since },
        }},
        { $group: { _id: '$productId', coViewCount: { $sum: 1 }, uniqueSessions: { $addToSet: '$sessionId' } } },
        { $addFields: { sessionCount: { $size: '$uniqueSessions' } } },
        { $sort: { sessionCount: -1 } },
        { $limit: limit },
        { $project: { uniqueSessions: 0 } },
      ]);
    }

    let productIds = coViewedProducts.map(c => c._id).filter(Boolean);

    // Fallback: if not enough co-view data, supplement with same-category popular products
    if (productIds.length < limit) {
      const currentProduct = await Product.findById(productId).select('categories').lean();
      if (currentProduct?.categories?.length) {
        const supplement = await Product.find({
          _id: { $nin: [productId, ...productIds] },
          categories: { $in: currentProduct.categories },
          status: 'active', isActive: true,
        })
          .sort({ rating: -1, isFeatured: -1 })
          .limit(limit - productIds.length)
          .select('_id')
          .lean();
        productIds = [...productIds, ...supplement.map(s => s._id)];
      }
    }

    // Further fallback: featured products
    if (productIds.length < limit) {
      const featured = await Product.find({
        _id: { $nin: [productId, ...productIds] },
        status: 'active', isActive: true,
      })
        .sort({ isFeatured: -1, rating: -1, createdAt: -1 })
        .limit(limit - productIds.length)
        .select('_id')
        .lean();
      productIds = [...productIds, ...featured.map(f => f._id)];
    }

    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug regularPrice salePrice featuredImage images rating reviewCount categories')
      .populate('categories', 'name slug')
      .lean();

    // Preserve order from aggregation
    const prodMap = {};
    products.forEach(p => { prodMap[p._id.toString()] = p; });
    const ordered = productIds
      .map(id => prodMap[id.toString()])
      .filter(Boolean);

    res.json({ success: true, data: ordered });
  } catch (error) {
    console.error('Also-viewed error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch also-viewed products' });
  }
});

/**
 * GET /api/stats/frequently-bought-together/:productId — AI-powered + order-based bundles
 * Combines order co-purchase data with AI category complementarity
 */
router.get('/frequently-bought-together/:productId', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 12, 20);
    const productId = req.params.productId;

    // Step 1: Find co-purchased products from orders
    const coBought = await Order.aggregate([
      { $match: { 'items.product': new mongoose.Types.ObjectId(productId), status: { $nin: ['cancelled', 'refunded'] } } },
      { $unwind: '$items' },
      { $match: { 'items.product': { $ne: new mongoose.Types.ObjectId(productId) } } },
      { $group: { _id: '$items.product', coCount: { $sum: 1 }, totalQty: { $sum: '$items.quantity' } } },
      { $sort: { coCount: -1 } },
      { $limit: limit },
    ]);

    let productIds = coBought.map(c => c._id).filter(Boolean);

    // Step 2: If not enough, use AI to find complementary categories
    if (productIds.length < limit) {
      const product = await Product.findById(productId)
        .select('name categories description shortDescription')
        .populate('categories', 'name slug')
        .lean();

      if (product) {
        const allCategories = await Category.find({ isActive: true }).select('name slug').lean();
        const categoryNames = allCategories.map(c => c.name);
        const productCategories = (product.categories || []).map(c => c.name);

        try {
          const aiAssistant = require('../services/aiAssistant');
          const settings = await aiAssistant.getSettings();
          const hasProvider = Object.values(settings).some(s => s && s.enabled && s.apiKey);

          if (hasProvider) {
            const prompt = `I have an online store with these categories: ${categoryNames.join(', ')}.
A customer is buying: "${product.name}" (categories: ${productCategories.join(', ')}).
Which of my categories contain products frequently bought TOGETHER with "${product.name}"?
Think about bundles, accessories, complementary items.
Rules: Only suggest from MY list. Do NOT repeat ${productCategories.join(', ')}. Return ONLY a JSON array of category names. Max 5.`;

            const response = await aiAssistant.generateResponse(prompt, {
              productName: product.name,
              productDescription: product.shortDescription || '',
            }, null);

            const text = response.answer || '';
            const jsonMatch = text.match(/\[[\s\S]*?\]/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              const matchedCatIds = allCategories
                .filter(c => parsed.some(name => name.toLowerCase() === c.name.toLowerCase()))
                .map(c => c._id);

              if (matchedCatIds.length > 0) {
                const aiProducts = await Product.find({
                  _id: { $nin: [productId, ...productIds] },
                  categories: { $in: matchedCatIds },
                  status: 'active', isActive: true,
                })
                  .sort({ isFeatured: -1, rating: -1 })
                  .limit(limit - productIds.length)
                  .select('_id')
                  .lean();
                productIds = [...productIds, ...aiProducts.map(p => p._id)];
              }
            }
          }
        } catch (aiErr) {
          console.error('FBT AI error:', aiErr.message);
        }

        // Step 3: Fallback to same-category
        if (productIds.length < limit) {
          const sameCat = await Product.find({
            _id: { $nin: [productId, ...productIds] },
            categories: { $in: product.categories?.map(c => c._id) || [] },
            status: 'active', isActive: true,
          })
            .sort({ rating: -1 })
            .limit(limit - productIds.length)
            .select('_id')
            .lean();
          productIds = [...productIds, ...sameCat.map(s => s._id)];
        }
      }
    }

    const products = await Product.find({ _id: { $in: productIds } })
      .select('name slug regularPrice salePrice featuredImage images rating reviewCount categories')
      .populate('categories', 'name slug')
      .lean();

    const prodMap = {};
    products.forEach(p => { prodMap[p._id.toString()] = p; });
    const ordered = productIds.map(id => prodMap[id.toString()]).filter(Boolean);

    res.json({ success: true, data: ordered });
  } catch (error) {
    console.error('Frequently-bought-together error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch frequently bought together products' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS — require authentication
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/stats/admin/hotspots — Most interacted elements, pages, products
 */
router.get('/admin/hotspots', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = dateRange(days);

    // Most visited pages
    const topPages = await SiteEvent.aggregate([
      { $match: { type: 'page_view', createdAt: { $gte: since }, page: { $exists: true } } },
      { $group: { _id: '$page', views: { $sum: 1 }, uniqueSessions: { $addToSet: '$sessionId' } } },
      { $addFields: { uniqueVisitors: { $size: '$uniqueSessions' } } },
      { $sort: { views: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, page: '$_id', views: 1, uniqueVisitors: 1 } },
    ]);

    // Most viewed products
    const topProducts = await SiteEvent.aggregate([
      { $match: { type: 'product_view', createdAt: { $gte: since }, productId: { $exists: true, $ne: null } } },
      { $group: { _id: '$productId', views: { $sum: 1 }, uniqueSessions: { $addToSet: '$sessionId' } } },
      { $addFields: { uniqueVisitors: { $size: '$uniqueSessions' } } },
      { $sort: { views: -1 } },
      { $limit: 20 },
      { $project: { uniqueSessions: 0 } },
    ]);

    // Populate product details
    const prodIds = topProducts.map(p => p._id);
    const prodDetails = await Product.find({ _id: { $in: prodIds } }).select('name slug featuredImage').lean();
    const prodMap = {};
    prodDetails.forEach(p => { prodMap[p._id.toString()] = p; });
    const topProductsEnriched = topProducts.map(p => ({
      ...p,
      product: prodMap[p._id?.toString()] || null,
    }));

    // Most clicked buttons/elements
    const topClicks = await SiteEvent.aggregate([
      { $match: { type: 'button_click', createdAt: { $gte: since } } },
      { $group: { _id: { text: '$elementText', section: '$elementSection' }, clicks: { $sum: 1 } } },
      { $sort: { clicks: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, elementText: '$_id.text', section: '$_id.section', clicks: 1 } },
    ]);

    // Most viewed categories
    const topCategories = await SiteEvent.aggregate([
      { $match: { type: 'category_view', createdAt: { $gte: since }, categoryId: { $exists: true, $ne: null } } },
      { $group: { _id: '$categoryId', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 15 },
    ]);
    const catIds = topCategories.map(c => c._id);
    const catDetails = await Category.find({ _id: { $in: catIds } }).select('name slug iconImage').lean();
    const catMap = {};
    catDetails.forEach(c => { catMap[c._id.toString()] = c; });
    const topCategoriesEnriched = topCategories.map(c => ({
      views: c.views,
      category: catMap[c._id?.toString()] || null,
    }));

    // Search analytics (filter out short partial queries < 3 chars)
    const topSearches = await SiteEvent.aggregate([
      { $match: { type: 'search', searchQuery: { $exists: true, $ne: '' }, createdAt: { $gte: since } } },
      { $addFields: { _queryLen: { $strLenCP: '$searchQuery' } } },
      { $match: { _queryLen: { $gte: 3 } } },
      { $group: {
        _id: { $toLower: '$searchQuery' },
        count: { $sum: 1 },
        clickedResults: { $sum: { $cond: [{ $gt: ['$searchResultPosition', 0] }, 1, 0] } },
      }},
      { $addFields: { clickRate: { $cond: [{ $gt: ['$count', 0] }, { $divide: ['$clickedResults', '$count'] }, 0] } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { _id: 0, query: '$_id', count: 1, clickedResults: 1, clickRate: 1 } },
    ]);

    // Zero-result searches (opportunities!)
    const zeroResults = await SiteEvent.aggregate([
      { $match: { type: 'search', searchResultCount: 0, createdAt: { $gte: since } } },
      { $group: { _id: { $toLower: '$searchQuery' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 15 },
      { $project: { _id: 0, query: '$_id', count: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        topPages,
        topProducts: topProductsEnriched,
        topClicks,
        topCategories: topCategoriesEnriched,
        topSearches,
        zeroResults,
      },
    });
  } catch (error) {
    console.error('Hotspots error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch hotspots' });
  }
});

/**
 * GET /api/stats/admin/overview — High-level stats overview
 */
router.get('/admin/overview', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = dateRange(days);
    const previousSince = dateRange(days * 2);

    // Current period
    const [totalEvents, totalViews, totalSearches, totalAddToCart, totalPurchases] = await Promise.all([
      SiteEvent.countDocuments({ createdAt: { $gte: since } }),
      SiteEvent.countDocuments({ type: 'page_view', createdAt: { $gte: since } }),
      SiteEvent.countDocuments({ type: 'search', createdAt: { $gte: since } }),
      SiteEvent.countDocuments({ type: 'add_to_cart', createdAt: { $gte: since } }),
      SiteEvent.countDocuments({ type: 'purchase', createdAt: { $gte: since } }),
    ]);

    // Previous period for comparison
    const [prevViews, prevSearches, prevAddToCart, prevPurchases] = await Promise.all([
      SiteEvent.countDocuments({ type: 'page_view', createdAt: { $gte: previousSince, $lt: since } }),
      SiteEvent.countDocuments({ type: 'search', createdAt: { $gte: previousSince, $lt: since } }),
      SiteEvent.countDocuments({ type: 'add_to_cart', createdAt: { $gte: previousSince, $lt: since } }),
      SiteEvent.countDocuments({ type: 'purchase', createdAt: { $gte: previousSince, $lt: since } }),
    ]);

    // Unique visitors (by sessionId)
    const uniqueVisitors = await SiteEvent.distinct('sessionId', { createdAt: { $gte: since } });
    const prevUniqueVisitors = await SiteEvent.distinct('sessionId', { createdAt: { $gte: previousSince, $lt: since } });

    // Conversion funnel
    const viewToCart = totalViews > 0 ? ((totalAddToCart / totalViews) * 100).toFixed(1) : 0;
    const cartToPurchase = totalAddToCart > 0 ? ((totalPurchases / totalAddToCart) * 100).toFixed(1) : 0;

    // Daily trend (last N days)
    const dailyTrend = await SiteEvent.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        pageViews: { $sum: { $cond: [{ $eq: ['$type', 'page_view'] }, 1, 0] } },
        productViews: { $sum: { $cond: [{ $eq: ['$type', 'product_view'] }, 1, 0] } },
        addToCart: { $sum: { $cond: [{ $eq: ['$type', 'add_to_cart'] }, 1, 0] } },
        purchases: { $sum: { $cond: [{ $eq: ['$type', 'purchase'] }, 1, 0] } },
        searches: { $sum: { $cond: [{ $eq: ['$type', 'search'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]);

    const calcChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return (((current - previous) / previous) * 100).toFixed(1);
    };

    res.json({
      success: true,
      data: {
        current: {
          totalEvents,
          pageViews: totalViews,
          searches: totalSearches,
          addToCart: totalAddToCart,
          purchases: totalPurchases,
          uniqueVisitors: uniqueVisitors.length,
        },
        changes: {
          pageViews: calcChange(totalViews, prevViews),
          searches: calcChange(totalSearches, prevSearches),
          addToCart: calcChange(totalAddToCart, prevAddToCart),
          purchases: calcChange(totalPurchases, prevPurchases),
          uniqueVisitors: calcChange(uniqueVisitors.length, prevUniqueVisitors.length),
        },
        funnel: {
          viewToCartRate: viewToCart,
          cartToPurchaseRate: cartToPurchase,
        },
        dailyTrend,
        period: { days, since },
      },
    });
  } catch (error) {
    console.error('Stats overview error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats overview' });
  }
});

/**
 * GET /api/stats/admin/conversion-insights — Smart insights about conversion opportunities
 */
router.get('/admin/conversion-insights', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const since = dateRange(days);

    // Products viewed a lot but never purchased (missed opportunities)
    const viewedNotBought = await SiteEvent.aggregate([
      { $match: { type: 'product_view', createdAt: { $gte: since }, productId: { $exists: true, $ne: null } } },
      { $group: { _id: '$productId', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
      { $limit: 30 },
    ]);

    const purchasedIds = await SiteEvent.distinct('productId', { type: 'purchase', createdAt: { $gte: since } });
    const purchasedSet = new Set(purchasedIds.map(id => id?.toString()));

    const missedOpportunities = viewedNotBought
      .filter(v => v._id && !purchasedSet.has(v._id.toString()))
      .slice(0, 10);

    const missedIds = missedOpportunities.map(m => m._id);
    const missedProducts = await Product.find({ _id: { $in: missedIds } })
      .select('name slug featuredImage regularPrice salePrice')
      .lean();
    const missedMap = {};
    missedProducts.forEach(p => { missedMap[p._id.toString()] = p; });

    // Cart abandonment — added to cart but no purchase in same session
    const cartSessions = await SiteEvent.distinct('sessionId', { type: 'add_to_cart', createdAt: { $gte: since } });
    const purchaseSessions = await SiteEvent.distinct('sessionId', { type: 'purchase', createdAt: { $gte: since } });
    const purchaseSessionSet = new Set(purchaseSessions);
    const abandonedCount = cartSessions.filter(s => !purchaseSessionSet.has(s)).length;
    const abandonmentRate = cartSessions.length > 0
      ? ((abandonedCount / cartSessions.length) * 100).toFixed(1)
      : 0;

    // Peak hours
    const peakHours = await SiteEvent.aggregate([
      { $match: { type: 'purchase', createdAt: { $gte: since } } },
      { $group: { _id: { $hour: '$createdAt' }, purchases: { $sum: 1 } } },
      { $sort: { purchases: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, hour: '$_id', purchases: 1 } },
    ]);

    // Device breakdown
    const deviceBreakdown = await SiteEvent.aggregate([
      { $match: { type: 'page_view', createdAt: { $gte: since }, userAgent: { $exists: true } } },
      { $addFields: {
        device: {
          $cond: {
            if: { $regexMatch: { input: '$userAgent', regex: /Mobile|Android|iPhone|iPad/i } },
            then: 'mobile',
            else: 'desktop'
          }
        }
      }},
      { $group: { _id: '$device', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        missedOpportunities: missedOpportunities.map(m => ({
          views: m.views,
          product: missedMap[m._id?.toString()] || null,
        })),
        cartAbandonment: {
          totalCartSessions: cartSessions.length,
          abandonedSessions: abandonedCount,
          abandonmentRate,
        },
        peakHours,
        deviceBreakdown: deviceBreakdown.reduce((acc, d) => { acc[d._id] = d.count; return acc; }, {}),
      },
    });
  } catch (error) {
    console.error('Conversion insights error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversion insights' });
  }
});

/**
 * POST /api/stats/admin/backfill-orders — Seed purchase events from existing orders
 * Run once to populate purchase stats from orders created before the stats module
 */
router.post('/admin/backfill-orders', protect, authorize('admin', 'shop_manager'), async (req, res) => {
  try {
    // Check how many purchase events already exist
    const existingPurchaseCount = await SiteEvent.countDocuments({ type: 'purchase' });

    // Get all orders that don't have corresponding purchase events
    const orders = await Order.find({ status: { $nin: ['cancelled'] } })
      .select('items user createdAt orderNumber totalAmount')
      .lean();

    let created = 0;
    let skipped = 0;

    for (const order of orders) {
      // Check if we already have purchase events for this order
      const existing = await SiteEvent.findOne({ type: 'purchase', 'metadata.orderId': order._id.toString() });
      if (existing) {
        skipped++;
        continue;
      }

      const items = order.items || [];
      for (const item of items) {
        const productId = item.product || item.productId;
        if (!productId) continue;

        await SiteEvent.create({
          type: 'purchase',
          productId,
          quantity: item.quantity || 1,
          revenue: item.total || (item.price * (item.quantity || 1)),
          userId: order.user || undefined,
          sessionId: `backfill-${order._id}`,
          metadata: { orderId: order._id.toString(), orderNumber: order.orderNumber, backfilled: true },
          createdAt: order.createdAt || new Date(),
        });
        created++;
      }
    }

    res.json({
      success: true,
      message: `Backfilled ${created} purchase events from ${orders.length} orders (${skipped} orders already had events)`,
      data: { created, skipped, totalOrders: orders.length, existingPurchaseEvents: existingPurchaseCount },
    });
  } catch (error) {
    console.error('Backfill orders error:', error);
    res.status(500).json({ success: false, message: 'Failed to backfill order events' });
  }
});

module.exports = router;
