/**
 * adContextEngine.js
 * AI-powered contextual ad routing for Service Provider Ads.
 * Given page context (pageType, categorySlug, productId, customerId),
 * returns the most relevant active ads for that slot.
 *
 * Falls back to keyword matching if AI is disabled or unavailable.
 */

const ServiceProviderAd = require('../models/ServiceProviderAd');
const ServiceProvider = require('../models/ServiceProvider');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const aiAssistant = require('./aiAssistant');

// Simple in-memory TTL cache to avoid per-request AI calls
// Format: { cacheKey: { data, expiresAt } }
const adCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(slotId, pageType, context) {
  return `${slotId}::${pageType}::${context.categorySlug || ''}::${context.productId || ''}`;
}

/**
 * Main export: get contextually relevant ads for a given slot and page context.
 * @param {string} slotId - e.g. 'product_detail_below_buy'
 * @param {object} context - { pageType, categorySlug, productId, customerId, maxAds }
 * @returns {Promise<Array>} ranked ads
 */
async function getContextualAds(slotId, context = {}) {
  const { pageType, categorySlug, productId, customerId, maxAds = 3 } = context;

  // Check cache (skip customer-personalised cache keys to avoid stale personal data)
  if (!customerId) {
    const cacheKey = getCacheKey(slotId, pageType, context);
    const cached = adCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
  }

  // 1. Fetch all active ads for this slot within valid date range
  const now = new Date();
  const activeAds = await ServiceProviderAd.find({
    placementSlot: slotId,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now }
  }).populate('provider', 'businessName logoUrl applicationStatus subscriptionStatus');

  // Filter ads whose provider is approved and subscription is active
  const eligibleAds = activeAds.filter(ad =>
    ad.provider &&
    ad.provider.applicationStatus === 'approved' &&
    ad.provider.subscriptionStatus === 'active'
  );

  if (eligibleAds.length === 0) return [];
  if (eligibleAds.length <= maxAds) return eligibleAds;

  // 2. Gather context signals
  let productName = '';
  let categoryName = '';
  let customerHobbies = [];
  let customerSegment = '';

  if (productId) {
    const product = await Product.findById(productId).populate('categories', 'name').lean();
    if (product) {
      productName = product.name;
      if (product.categories && product.categories.length > 0) {
        categoryName = product.categories[0].name;
      }
    }
  }

  if (categorySlug && !categoryName) {
    const cat = await Category.findOne({ slug: categorySlug }).lean();
    if (cat) categoryName = cat.name;
  }

  if (customerId) {
    const user = await User.findById(customerId).select('hobbies customerSegment interests').lean();
    if (user) {
      customerHobbies = user.hobbies || [];
      customerSegment = user.customerSegment || '';
    }
  }

  // 3. Try AI scoring
  let rankedAds;
  try {
    rankedAds = await scoreWithAI(eligibleAds, {
      productName,
      categoryName,
      pageType,
      customerHobbies,
      customerSegment
    });
  } catch (err) {
    console.warn('[adContextEngine] AI scoring failed, falling back to keyword match:', err.message);
    rankedAds = scoreWithKeywords(eligibleAds, { productName, categoryName });
  }

  const result = rankedAds.slice(0, maxAds);

  // Cache non-personalised results
  if (!customerId) {
    const cacheKey = getCacheKey(slotId, pageType, context);
    adCache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  return result;
}

/**
 * Score ads using the configured AI provider.
 */
async function scoreWithAI(ads, contextSignals) {
  const settings = await aiAssistant.getSettings();
  const hasAI = Object.values(settings).some(s => s && s.enabled && s.apiKey);
  if (!hasAI) {
    return scoreWithKeywords(ads, contextSignals);
  }

  const adSummaries = ads.map((ad, i) => ({
    index: i,
    title: ad.title,
    keywords: (ad.aiKeywords || []).join(', '),
    provider: ad.provider ? ad.provider.businessName : ''
  }));

  const prompt = `You are an ad relevance engine. Given a page context, rank the following service provider ads from most to least relevant. Return ONLY a JSON array of ad indexes in order from most to least relevant, e.g. [2, 0, 1].

Page context:
- Page type: ${contextSignals.pageType || 'general'}
- Product/Category: ${contextSignals.productName || contextSignals.categoryName || 'general'}
- Customer hobbies: ${contextSignals.customerHobbies.join(', ') || 'unknown'}
- Customer segment: ${contextSignals.customerSegment || 'unknown'}

Ads to rank:
${JSON.stringify(adSummaries, null, 2)}

Return ONLY the JSON array, no explanation.`;

  const response = await aiAssistant.rawGenerate(prompt, {
    systemPrompt: 'You are an ad relevance ranking engine. Return only a valid JSON array of integer indexes.',
    maxTokens: 200
  });

  const raw = (response.answer || '').trim();
  const match = raw.match(/\[[\d,\s]+\]/);
  if (!match) throw new Error('AI returned unexpected format');
  const order = JSON.parse(match[0]);

  // Build ranked array according to AI order
  const ranked = [];
  const seen = new Set();
  for (const idx of order) {
    if (typeof idx === 'number' && idx >= 0 && idx < ads.length && !seen.has(idx)) {
      ranked.push(ads[idx]);
      seen.add(idx);
    }
  }
  // Append any ads not included in AI response
  ads.forEach((ad, i) => { if (!seen.has(i)) ranked.push(ad); });

  return ranked;
}

/**
 * Keyword-based fallback scoring.
 * Scores each ad by how many of its aiKeywords appear in the context signals.
 */
function scoreWithKeywords(ads, contextSignals) {
  const contextStr = [
    contextSignals.productName,
    contextSignals.categoryName,
    contextSignals.pageType
  ].join(' ').toLowerCase();

  return ads
    .map(ad => {
      const keywords = (ad.aiKeywords || []).map(k => k.toLowerCase());
      const score = keywords.filter(k => contextStr.includes(k)).length;
      return { ad, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(item => item.ad);
}

/**
 * Record an impression for an ad.
 */
async function recordImpression(adId) {
  await ServiceProviderAd.findByIdAndUpdate(adId, { $inc: { impressions: 1 } });
  // Invalidate any cached entries containing this ad
  // (simple approach: clear entire cache on impression)
  adCache.clear();
}

/**
 * Record a click for an ad.
 */
async function recordClick(adId) {
  await ServiceProviderAd.findByIdAndUpdate(adId, { $inc: { clicks: 1 } });
}

module.exports = { getContextualAds, recordImpression, recordClick };
