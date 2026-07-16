const axios = require('axios');
const Product = require('../models/Product');
const Settings = require('../models/Settings');

const EMBEDDING_MODEL = 'text-embedding-3-small'; // 1536 dimensions

async function getApiKey() {
  const settings = await Settings.getSettings();
  return settings?.openaiApiKey || process.env.OPENAI_API_KEY;
}

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
}

async function embed(text) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('OpenAI API key not configured');
  const res = await axios.post('https://api.openai.com/v1/embeddings', {
    model: EMBEDDING_MODEL,
    input: text.slice(0, 8000)
  }, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 30000
  });
  // Cost tracking (Social Auto-Poster Phase 13, Spec 28.1) — this function is
  // shared with the pre-existing visual search feature, so recording spend
  // is a side-effect only, wrapped defensively: a ledger write failure must
  // never break embedding generation for either caller.
  try {
    const { recordEmbeddingSpend } = require('./autoposterCostControl');
    await recordEmbeddingSpend(res.data?.usage?.total_tokens);
  } catch { /* never let cost tracking break the actual embedding feature */ }
  return res.data?.data?.[0]?.embedding || null;
}

async function describeImage(imageUrlOrBase64) {
  const apiKey = await getApiKey();
  if (!apiKey) throw new Error('OpenAI API key not configured');

  const imageContent = imageUrlOrBase64.startsWith('http')
    ? { type: 'image_url', image_url: { url: imageUrlOrBase64 } }
    : { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageUrlOrBase64}` } };

  const res = await axios.post('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: 'Describe this product in 1-2 sentences focusing on category, color, material, style, and likely use. Be specific so it can be used to search a product catalogue.' },
        imageContent
      ]
    }],
    max_tokens: 120
  }, {
    headers: { Authorization: `Bearer ${apiKey}` },
    timeout: 30000
  });

  return res.data?.choices?.[0]?.message?.content?.trim() || '';
}

function productEmbeddingText(product) {
  const parts = [
    product.name,
    product.brand,
    product.shortDescription || '',
    (product.description || '').replace(/<[^>]+>/g, '').slice(0, 800),
    Array.isArray(product.categories) ? product.categories.map(c => c.name || c).filter(Boolean).join(' ') : ''
  ];
  return parts.filter(Boolean).join(' · ');
}

async function backfillEmbeddings({ limit = 50, force = false } = {}) {
  const query = force ? { isActive: true } : { isActive: true, embedding: { $exists: false } };
  const products = await Product.find(query).select('+embedding name brand shortDescription description').populate('categories', 'name').limit(limit);
  let updated = 0, failed = 0;
  for (const p of products) {
    try {
      const text = productEmbeddingText(p);
      if (!text || text.length < 5) continue;
      const vec = await embed(text);
      if (vec) {
        p.embedding = vec;
        p.embeddingUpdatedAt = new Date();
        await p.save({ validateBeforeSave: false });
        updated++;
      }
    } catch (e) {
      console.error(`Embed product ${p._id} failed:`, e.message);
      failed++;
    }
  }
  return { processed: products.length, updated, failed };
}

// Natural sentences ("I am looking for a Defy Fridge") embed quite differently
// from the terse catalog-style text products are embedded with ("Defy Fridge
// Freezer ..."), which dilutes similarity below the relevance threshold.
// Rewrite conversational queries down to their core search terms first —
// mirrors the image path, which already goes through describeImage() before
// embedding. Short queries are left as-is to skip the extra API round trip.
async function rewriteTextQuery(query) {
  if (query.trim().split(/\s+/).length <= 3) return query;
  const apiKey = await getApiKey();
  if (!apiKey) return query;
  try {
    const res = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Extract the core product search terms from this shopper's message as a short phrase — brand, product type, and key attributes only, no filler words like "I am looking for" or "do you have". Reply with ONLY the phrase.\n\nMessage: "${query}"`
      }],
      max_tokens: 30,
      temperature: 0,
    }, {
      headers: { Authorization: `Bearer ${apiKey}` },
      timeout: 15000,
    });
    const rewritten = res.data?.choices?.[0]?.message?.content?.trim();
    return rewritten || query;
  } catch (e) {
    return query; // fail open — fall back to the raw query on any error
  }
}

async function searchByText(query, { limit = 12 } = {}) {
  const rewritten = await rewriteTextQuery(query);
  const vec = await embed(rewritten);
  if (!vec) return [];
  return rankByEmbedding(vec, limit);
}

async function searchByImage(imageInput, { limit = 12 } = {}) {
  const description = await describeImage(imageInput);
  if (!description) return [];
  const vec = await embed(description);
  const results = await rankByEmbedding(vec, limit);
  return { description, results };
}

async function findSimilar(productId, { limit = 8 } = {}) {
  const source = await Product.findById(productId).select('+embedding');
  if (!source) return [];
  if (!source.embedding || !source.embedding.length) {
    // generate on demand
    const text = productEmbeddingText(source);
    const vec = await embed(text);
    if (vec) {
      source.embedding = vec;
      source.embeddingUpdatedAt = new Date();
      await source.save({ validateBeforeSave: false });
    }
  }
  if (!source.embedding) return [];
  const results = await rankByEmbedding(source.embedding, limit + 1);
  return results.filter(r => String(r._id) !== String(source._id)).slice(0, limit);
}

// Minimum cosine similarity for a result to be considered relevant.
// text-embedding-3-small typically gives 0.30+ for true semantic matches and
// hovers around 0.15-0.20 for unrelated products. 0.30 strips most noise.
const SIMILARITY_THRESHOLD = parseFloat(process.env.VISUAL_SEARCH_MIN_SIMILARITY) || 0.30;

async function rankByEmbedding(vec, limit) {
  const products = await Product.find({ isActive: true, embedding: { $exists: true, $ne: null } })
    .select('+embedding name slug regularPrice salePrice images brand stock')
    .lean();
  const scored = products.map(p => ({ ...p, similarity: cosineSimilarity(vec, p.embedding) }));
  scored.sort((a, b) => b.similarity - a.similarity);
  return scored
    .filter(s => s.similarity >= SIMILARITY_THRESHOLD)
    .slice(0, limit)
    .map(s => ({ _id: s._id, name: s.name, slug: s.slug, regularPrice: s.regularPrice, salePrice: s.salePrice, images: s.images, brand: s.brand, stock: s.stock, similarity: Math.round(s.similarity * 100) / 100 }));
}

module.exports = {
  embed,
  describeImage,
  productEmbeddingText,
  backfillEmbeddings,
  searchByText,
  searchByImage,
  findSimilar,
  cosineSimilarity // exported for reuse by the Social Auto-Poster's trend-product matcher (Phase 9)
};
