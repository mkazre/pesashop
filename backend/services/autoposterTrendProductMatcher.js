const Product = require('../models/Product');
const Category = require('../models/Category');
const AutoposterTrend = require('../models/AutoposterTrend');
const AutoposterTrendCandidate = require('../models/AutoposterTrendCandidate');
const { embed, cosineSimilarity } = require('./visualSearchService');

// Semantic trend-product matching (Spec Section 10.6). Reuses the exact
// embedding + brute-force cosine pattern already live in production for
// visual search (Phase 0 finding) — same model (text-embedding-3-small),
// same brute-force approach, not a new pipeline.
//
// IMPORTANT — category narrowing (added after live testing, not in the
// original design): a first version of this matcher brute-force-scanned
// every embedded product (7,500+ and growing toward the full 13,700+
// catalogue) on every single trend match — fetching each product's full
// 1536-number embedding array over the network. That timed out in practice
// (3+ minutes, still running, near-zero CPU the whole time — i.e.
// genuinely I/O-bound on transferring tens of megabytes of vector data, not
// a hung process). Fixed the right way, not by giving up on semantic
// matching: compare the trend's embedding against category-level embeddings
// first (only ~50 categories, effectively instant) to find the few
// relevant categories, THEN only fetch and cosine-compare products within
// those categories. Preserves the whole point of semantic matching (a
// literal-keyword category filter would miss "back to school" -> uniforms)
// while cutting the per-match embedding fetch from the whole catalogue down
// to a few hundred products at most.
const SIMILARITY_THRESHOLD = 0.55; // Spec 10.6's literal threshold
const KEYWORD_BONUS = 0.1;
const MAX_CANDIDATES = 20;
const TOP_CATEGORIES = 3;
const CATEGORY_SIMILARITY_FLOOR = 0.25; // deliberately looser than the product threshold — this is a coarse pre-filter, not the final relevance judgement

function categoryEmbeddingText(category) {
  return [category.name, category.description || ''].filter(Boolean).join(' · ');
}

// Lazily embeds any category missing one (~50 categories total — a one-time
// cost per category, not a recurring backfill job like products need).
async function ensureCategoryEmbeddings() {
  const categories = await Category.find().select('+embedding name description');
  const missing = categories.filter((c) => !c.embedding || c.embedding.length === 0);
  for (const category of missing) {
    const vec = await embed(categoryEmbeddingText(category));
    if (vec) {
      category.embedding = vec;
      category.embeddingUpdatedAt = new Date();
      await category.save();
    }
  }
  return Category.find().select('+embedding name');
}

// Finds the categories most relevant to a trend's embedding. Returns an
// empty array (meaning "no narrowing possible") if no category clears even
// the loose floor — the caller falls back to a bounded, not unbounded, scan.
async function findRelevantCategories(trendVec) {
  const categories = await ensureCategoryEmbeddings();
  return categories
    .map((c) => ({ id: c._id, name: c.name, similarity: c.embedding ? cosineSimilarity(trendVec, c.embedding) : 0 }))
    .filter((c) => c.similarity >= CATEGORY_SIMILARITY_FLOOR)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_CATEGORIES);
}

async function ensureTrendEmbedding(trend, { force = false } = {}) {
  if (trend.embedding && trend.embedding.length > 0 && !force) return trend.embedding;
  const vec = await embed(trend.term);
  if (vec) {
    trend.embedding = vec;
    await trend.save();
  }
  return vec;
}

// Matches one trend against the catalogue, narrowed to relevant categories
// first, returning the top 20 candidates above the similarity threshold
// (Spec 10.6). Products whose name/description contain the trend term
// verbatim get a +0.1 bonus.
async function matchTrendToProducts(trendId) {
  const trend = await AutoposterTrend.findById(trendId).select('+embedding');
  if (!trend) throw new Error(`Trend ${trendId} not found`);

  const vec = await ensureTrendEmbedding(trend);
  if (!vec) {
    console.error(`[autoposter-trends] could not embed trend "${trend.term}" — no embedding provider configured`);
    return [];
  }

  const relevantCategories = await findRelevantCategories(vec);
  const productQuery = { isActive: true, embedding: { $exists: true, $ne: null } };
  if (relevantCategories.length > 0) {
    productQuery.categories = { $in: relevantCategories.map((c) => c.id) };
    console.log(`[autoposter-trends] "${trend.term}" narrowed to categories: ${relevantCategories.map((c) => c.name).join(', ')}`);
  } else {
    // No category cleared even the loose floor — bounded fallback (most
    // recently updated) rather than an unbounded full-catalogue scan.
    console.log(`[autoposter-trends] "${trend.term}" matched no category above the pre-filter floor — falling back to a bounded 500-product scan, not the full catalogue`);
  }

  const products = await Product.find(productQuery)
    .select('+embedding name slug regularPrice salePrice backendPrice stock outOfStock lowStockThreshold description shortDescription categories')
    .sort(relevantCategories.length > 0 ? undefined : { updatedAt: -1 })
    .limit(relevantCategories.length > 0 ? 0 : 500) // 0 = no limit when category-narrowed (already a small set)
    .lean();

  const termLower = trend.term.toLowerCase();
  const scored = products.map((p) => {
    let similarity = cosineSimilarity(vec, p.embedding);
    const haystack = `${p.name} ${p.shortDescription || ''}`.toLowerCase();
    if (haystack.includes(termLower)) similarity = Math.min(1, similarity + KEYWORD_BONUS);
    return { product: p, similarity };
  });

  const candidates = scored
    .filter((s) => s.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_CANDIDATES);

  // Replace this trend's candidate set (a re-run should reflect current
  // catalogue state, not accumulate stale rows from earlier runs).
  await AutoposterTrendCandidate.deleteMany({ trend: trend._id });
  if (candidates.length === 0) return [];

  const docs = await AutoposterTrendCandidate.insertMany(
    candidates.map((c) => ({
      trend: trend._id,
      product: c.product._id,
      similarity: Math.round(c.similarity * 1000) / 1000,
      lastEvaluated: new Date()
    }))
  );

  return docs;
}

module.exports = { matchTrendToProducts, ensureTrendEmbedding, findRelevantCategories, ensureCategoryEmbeddings, SIMILARITY_THRESHOLD };
