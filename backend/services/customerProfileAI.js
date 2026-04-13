/**
 * customerProfileAI.js
 * AI-powered customer profile analysis service.
 *
 * Provides:
 * - computeProfileInsights(userId) — segment, churn risk, preferred categories
 * - getPersonalisedRecommendations(userId, context) — product IDs for "Also Viewed"
 * - getHobbyProducts(hobbies, limit) — products matching given hobbies
 * - computeProfileCompletionScore(user) — 0-100 score + missing field list
 * - evaluateDynamicGroups(userId) — updates dynamicGroupIds on user
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const CustomerGroup = require('../models/CustomerGroup');
const aiAssistant = require('./aiAssistant');

// Fields that contribute to profile completion and their weights (total = 100)
const COMPLETION_FIELDS = [
  { field: 'gender',            label: 'Gender',             weight: 8 },
  { field: 'dateOfBirth',       label: 'Date of Birth',      weight: 8 },
  { field: 'maritalStatus',     label: 'Marital Status',     weight: 5 },
  { field: 'householdSize',     label: 'Household Size',     weight: 5 },
  { field: 'employmentStatus',  label: 'Employment Status',  weight: 8 },
  { field: 'incomeRange',       label: 'Income Range',       weight: 8 },
  { field: 'educationLevel',    label: 'Education Level',    weight: 5 },
  { field: 'province',          label: 'Province',           weight: 6 },
  { field: 'suburb',            label: 'Suburb',             weight: 4 },
  { field: 'hobbies',           label: 'Hobbies',            weight: 18 }, // array, need length > 0 (absorbed interests weight — no separate UI for interests)
  { field: 'lifeStage',         label: 'Life Stage',         weight: 8 },
  { field: 'phone',             label: 'Phone Number',       weight: 7 },
  { field: 'marketingOptIn',    label: 'Marketing Preferences', weight: 5 }, // just needs to be set
  { field: 'demographicsConsentGiven', label: 'Privacy Consent', weight: 5 },
];

/**
 * Compute profile completion score (0-100) and list of missing fields.
 * @param {object} user - Mongoose user document or plain object
 * @returns {{ score: number, missingFields: string[], missingLabels: string[] }}
 */
function computeProfileCompletionScore(user) {
  let earned = 0;
  const missingFields = [];
  const missingLabels = [];

  for (const item of COMPLETION_FIELDS) {
    const val = user[item.field];
    const isFilled = Array.isArray(val) ? val.length > 0 : (val !== undefined && val !== null && val !== '');
    if (isFilled) {
      earned += item.weight;
    } else {
      missingFields.push(item.field);
      missingLabels.push(item.label);
    }
  }

  return {
    score: Math.min(100, Math.round(earned)),
    missingFields,
    missingLabels
  };
}

/**
 * Compute and persist AI-driven profile insights for a user.
 * Sets: customerSegment, churnRisk, preferredCategories, avgOrderValue, purchaseFrequency
 */
async function computeProfileInsights(userId) {
  const user = await User.findById(userId)
    .populate('preferredCategories', 'name')
    .lean();
  if (!user) return null;

  // Fetch recent orders
  const orders = await Order.find({ customer: userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate('items.product', 'name categories')
    .lean();

  // Compute basic stats
  const orderCount = orders.length;
  const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

  // Infer purchase frequency
  let purchaseFrequency = 'rare';
  if (orderCount >= 12) purchaseFrequency = 'weekly';
  else if (orderCount >= 6) purchaseFrequency = 'monthly';
  else if (orderCount >= 2) purchaseFrequency = 'occasional';

  // Determine preferred categories from order history
  const catCounts = {};
  for (const order of orders) {
    for (const item of (order.items || [])) {
      if (item.product && item.product.categories) {
        for (const catId of item.product.categories) {
          const id = catId.toString();
          catCounts[id] = (catCounts[id] || 0) + 1;
        }
      }
    }
  }
  const preferredCategoryIds = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => new mongoose.Types.ObjectId(id));

  // Determine churn risk (simple heuristic)
  const daysSinceLastOrder = orders.length > 0
    ? (Date.now() - new Date(orders[0].createdAt).getTime()) / (1000 * 60 * 60 * 24)
    : 999;
  let churnRisk = 'low';
  if (daysSinceLastOrder > 180) churnRisk = 'high';
  else if (daysSinceLastOrder > 60) churnRisk = 'medium';

  // Determine customer segment
  let customerSegment = 'value';
  if (avgOrderValue > 5000) customerSegment = 'luxury';
  else if (avgOrderValue > 2000) customerSegment = 'premium';
  else if (avgOrderValue < 500) customerSegment = 'budget';

  // Try AI refinement for segment if AI is enabled
  try {
    const settings = await aiAssistant.getSettings();
    const hasAI = Object.values(settings).some(s => s && s.enabled && s.apiKey);
    if (hasAI && orderCount > 0) {
      const prompt = `Given this customer profile, classify their shopping segment as exactly one of: budget, value, premium, luxury.

Customer data:
- Average order value: R${avgOrderValue.toFixed(2)}
- Total orders: ${orderCount}
- Total spent: R${totalSpent.toFixed(2)}
- Purchase frequency: ${purchaseFrequency}
- Hobbies: ${(user.hobbies || []).join(', ') || 'unknown'}
- Income range: ${user.incomeRange || 'unknown'}
- Life stage: ${user.lifeStage || 'unknown'}

Reply with ONLY the segment word (budget, value, premium, or luxury).`;

      const response = await aiAssistant.rawGenerate(prompt, { maxTokens: 10 });
      const aiSegment = (response.answer || '').trim().toLowerCase();
      if (['budget', 'value', 'premium', 'luxury'].includes(aiSegment)) {
        customerSegment = aiSegment;
      }
    }
  } catch (err) {
    // Keep heuristic result
  }

  // Compute profile completion
  const { score, missingFields } = computeProfileCompletionScore(user);

  // Persist updates
  await User.findByIdAndUpdate(userId, {
    customerSegment,
    churnRisk,
    preferredCategories: preferredCategoryIds,
    avgOrderValue: Math.round(avgOrderValue),
    purchaseFrequency,
    lastPurchaseDate: orders.length > 0 ? orders[0].createdAt : undefined,
    profileCompletionScore: score,
    profileCompletionFields: missingFields
  });

  return { customerSegment, churnRisk, preferredCategoryIds, avgOrderValue, purchaseFrequency, score };
}

/**
 * Get personalised product recommendations for a customer.
 * Used for the "Customers Also Viewed" block on product detail pages.
 * @param {string} userId
 * @param {object} context - { productId, categoryId, limit }
 * @returns {Promise<Array>} product documents
 */
async function getPersonalisedRecommendations(userId, context = {}) {
  const { productId, categoryId, limit = 8 } = context;

  const user = await User.findById(userId)
    .select('hobbies interests preferredCategories customerSegment')
    .lean();

  // Build candidate pool: products from preferred categories + hobby-related
  const categoryIds = [
    ...(user?.preferredCategories || []),
    ...(categoryId ? [categoryId] : [])
  ];

  const query = {
    isActive: { $ne: false },
    deletedAt: { $exists: false }
  };

  if (productId) query._id = { $ne: productId };
  if (categoryIds.length > 0) query.categories = { $in: categoryIds };

  const candidates = await Product.find(query)
    .select('name slug featuredImage regularPrice salePrice categories averageRating ratingCount')
    .limit(50)
    .lean();

  if (candidates.length === 0) {
    // Fallback: recent products regardless of category
    return Product.find({ isActive: { $ne: false }, deletedAt: { $exists: false } })
      .select('name slug featuredImage regularPrice salePrice averageRating ratingCount')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  // Try AI ranking
  try {
    const settings = await aiAssistant.getSettings();
    const hasAI = Object.values(settings).some(s => s && s.enabled && s.apiKey);
    if (hasAI && user) {
      const summaries = candidates.slice(0, 20).map((p, i) => ({
        index: i,
        name: p.name,
        price: p.regularPrice
      }));

      const prompt = `You are a product recommendation engine. Given a customer profile, rank these products from most to least likely to interest them. Return ONLY a JSON array of product indexes.

Customer:
- Hobbies: ${(user.hobbies || []).join(', ') || 'unknown'}
- Interests: ${(user.interests || []).join(', ') || 'unknown'}
- Segment: ${user.customerSegment || 'value'}

Products:
${JSON.stringify(summaries, null, 2)}

Return ONLY the JSON array, e.g. [2, 0, 1, ...]`;

      const response = await aiAssistant.rawGenerate(prompt, { maxTokens: 200 });
      const raw = (response.answer || '').trim();
      const match = raw.match(/\[[\d,\s]+\]/);
      if (match) {
        const order = JSON.parse(match[0]);
        const seen = new Set();
        const ranked = [];
        for (const idx of order) {
          if (typeof idx === 'number' && idx >= 0 && idx < candidates.length && !seen.has(idx)) {
            ranked.push(candidates[idx]);
            seen.add(idx);
          }
        }
        candidates.forEach((p, i) => { if (!seen.has(i)) ranked.push(p); });
        return ranked.slice(0, limit);
      }
    }
  } catch (err) {
    // Fall through to unranked results
  }

  return candidates.slice(0, limit);
}

/**
 * Get products related to given hobbies.
 * Used for the hobby-product preview during profile setup.
 * @param {string[]} hobbies - e.g. ['cycling', 'gaming']
 * @param {number} limit - per hobby
 * @returns {Promise<Array>} flat list of products with hobbyTag
 */
async function getHobbyProducts(hobbies = [], limit = 3) {
  if (hobbies.length === 0) return [];

  const results = [];

  for (const hobby of hobbies.slice(0, 5)) { // cap at 5 hobbies
    const products = await Product.find({
      isActive: { $ne: false },
      deletedAt: { $exists: false },
      $or: [
        { name: { $regex: hobby, $options: 'i' } },
        { 'categories.name': { $regex: hobby, $options: 'i' } },
        { tags: { $regex: hobby, $options: 'i' } }
      ]
    })
      .select('name slug featuredImage regularPrice salePrice averageRating ratingCount')
      .limit(limit)
      .lean();

    results.push(...products.map(p => ({ ...p, hobbyTag: hobby })));
  }

  return results;
}

/**
 * Evaluate which dynamic CustomerGroups a user belongs to and update their dynamicGroupIds.
 * @param {string} userId
 */
async function evaluateDynamicGroups(userId) {
  const user = await User.findById(userId).lean();
  if (!user) return;

  const groups = await CustomerGroup.find({ isDynamic: true, isActive: true }).lean();
  const matchingGroupIds = [];

  for (const group of groups) {
    if (!group.rules || group.rules.length === 0) continue;

    const results = group.rules.map(rule => evaluateRule(user, rule));
    const matched = group.ruleLogic === 'or'
      ? results.some(Boolean)
      : results.every(Boolean);

    if (matched) matchingGroupIds.push(group._id);
  }

  await User.findByIdAndUpdate(userId, { dynamicGroupIds: matchingGroupIds });
  return matchingGroupIds;
}

function evaluateRule(user, rule) {
  const { field, operator, value } = rule;
  const userVal = user[field];

  switch (operator) {
    case 'eq':  return userVal == value;
    case 'neq': return userVal != value;
    case 'gt':  return Number(userVal) > Number(value);
    case 'gte': return Number(userVal) >= Number(value);
    case 'lt':  return Number(userVal) < Number(value);
    case 'lte': return Number(userVal) <= Number(value);
    case 'in':  return Array.isArray(value) ? value.includes(userVal) : false;
    case 'nin': return Array.isArray(value) ? !value.includes(userVal) : true;
    case 'contains':
      return Array.isArray(userVal) ? userVal.includes(value) : String(userVal).includes(value);
    default: return false;
  }
}

module.exports = {
  computeProfileCompletionScore,
  computeProfileInsights,
  getPersonalisedRecommendations,
  getHobbyProducts,
  evaluateDynamicGroups,
  COMPLETION_FIELDS
};
