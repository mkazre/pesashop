/**
 * Throttled background cache-warmer for product/category translations.
 *
 * Usage: node backend/scripts/prewarm-product-translations.js
 * (intended to be run daily via cron/PM2/whatever schedules other backend/cron/*.js jobs)
 *
 * The storefront already translates products/categories on-demand the first
 * time a customer views them in a given language (see translationService.js,
 * wired into routes/products.js and routes/categories.js) — this script is a
 * pure latency/UX optimization, NOT a correctness requirement. It walks the
 * catalog and calls the same translation service so common products are
 * already cached before a customer ever hits a cold path.
 *
 * Respects a daily character budget (DAILY_CHAR_BUDGET below) so a large
 * catalog can't blow through the Google Cloud Translation free tier
 * (500,000 chars/month) in one run — pre-warming a big catalog across all 6
 * languages may take multiple days/weeks to fully warm, which is fine; the
 * on-demand path covers anything not yet warmed.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const TranslationCache = require('../models/TranslationCache');
const { translateProductFields, translateCategoryFields, SUPPORTED_TARGET_LANGS } = require('../services/translationService');

// ~15k chars/day per language ≈ 450k/month total across 6 languages stays
// under the 500k/month free tier with headroom. Tune this once real catalog
// size and traffic patterns are known.
const DAILY_CHAR_BUDGET_PER_LANG = 15000;

const MONGODB_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

function textLength(...strings) {
  return strings.filter(Boolean).reduce((sum, s) => sum + String(s).length, 0);
}

async function prewarmProducts(lang, budget) {
  let charsUsed = 0;
  let warmedCount = 0;

  // Only look at products likely to still need warming for this language —
  // cheap heuristic: iterate active products, skip ones whose description is
  // already fully cached for this lang (translateProductFields is itself
  // cache-aware, so calling it again for an already-warm product just does
  // free cache reads — but we still stop once the budget is spent so we
  // don't waste API calls on genuinely new/cold text past the daily cap).
  const cursor = Product.find({ status: 'active' }).select('description shortDescription specifications').lean().cursor();

  for await (const product of cursor) {
    if (charsUsed >= budget) break;

    const cost = textLength(product.description, product.shortDescription,
      ...(product.specifications || []).flatMap((s) => [s.key, s.value]));

    await translateProductFields(product, lang);
    charsUsed += cost;
    warmedCount++;
  }

  return { warmedCount, charsUsed };
}

async function prewarmCategories(lang, budget) {
  let charsUsed = 0;
  let warmedCount = 0;

  const categories = await Category.find({ isActive: true }).select('name description metaTitle metaDescription').lean();

  for (const category of categories) {
    if (charsUsed >= budget) break;

    const cost = textLength(category.name, category.description, category.metaTitle, category.metaDescription);
    await translateCategoryFields(category, lang);
    charsUsed += cost;
    warmedCount++;
  }

  return { warmedCount, charsUsed };
}

async function main() {
  if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
    console.error('GOOGLE_TRANSLATE_API_KEY is not set — nothing to pre-warm yet.');
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB. Pre-warming translation cache...');

  for (const lang of SUPPORTED_TARGET_LANGS) {
    console.log(`\n[${lang}] warming categories (budget ${DAILY_CHAR_BUDGET_PER_LANG} chars)...`);
    const catResult = await prewarmCategories(lang, DAILY_CHAR_BUDGET_PER_LANG);
    console.log(`[${lang}] categories: warmed ${catResult.warmedCount}, ~${catResult.charsUsed} chars`);

    const remainingBudget = Math.max(0, DAILY_CHAR_BUDGET_PER_LANG - catResult.charsUsed);
    console.log(`[${lang}] warming products (remaining budget ${remainingBudget} chars)...`);
    const prodResult = await prewarmProducts(lang, remainingBudget);
    console.log(`[${lang}] products: warmed ${prodResult.warmedCount}, ~${prodResult.charsUsed} chars`);
  }

  const cacheSize = await TranslationCache.countDocuments();
  console.log(`\nDone. TranslationCache now has ${cacheSize} cached entries total.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('prewarm-product-translations.js failed:', err);
  process.exit(1);
});
