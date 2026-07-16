const axios = require('axios');
const { recordLLMSpend, isLLMBudgetExceeded, recordLLMLatency } = require('./autoposterCostControl');

// Per-Platform Format Generator (Spec Section 10.9). Same trend + product,
// rendered differently per platform, with region-aware framing (Spec
// 10.12.5). Gated gracefully on missing ANTHROPIC_API_KEY (same honest
// pattern as the trend-term safety classifier, Phase 9) — falls back to a
// single plain template caption rather than blocking the pipeline.
const PLATFORM_STYLE_GUIDES = {
  facebook: 'Slightly longer, community-oriented. Works for a diaspora audience — mention the Zim context explicitly. Link-preview friendly.',
  instagram: 'Visual-first caption, lifestyle framing, clear CTA. Hashtags belong in a first comment, not the caption itself — keep the caption itself hashtag-light. Zim slang sparingly and only where natural.',
  x: 'A single tweet, comfortably under 240 characters. Sharp, witty, current-events aware. One hashtag at most.',
  linkedin: 'Professional framing — an insights angle (what this trend says about Zimbabwean retail), with the product as a proof point, not a hard sell. 0-2 hashtags.',
  tiktok: 'A punchy hook in the first five words. 1-2 trending-feeling hashtags. Conversational, Gen-Z friendly. Consider ending with a question.'
};

// Spec 10.12.5's example framings, used as guidance for the model rather
// than templated verbatim (so real generations vary, not repeat the exact
// spec examples every time).
const REGION_FRAMING = {
  local_zw: 'Direct, local framing for Zimbabwean buyers already in-country — immediacy and convenience (e.g. "in stock now, collect tomorrow").',
  diaspora_za: '"Send it home" framing for the South African diaspora — ordering for family back in Zimbabwe, delivered to their door.',
  diaspora_uk: 'Cross-border framing for the UK diaspora — paying from abroad, delivered in Zimbabwe, no queues or hassle for family back home.',
  diaspora_us: 'Cross-border framing for the US diaspora — paying from abroad, delivered in Zimbabwe, no queues or hassle for family back home.',
  diaspora_ca: 'Cross-border framing for the Canadian diaspora — paying from abroad, delivered in Zimbabwe, no queues or hassle for family back home.',
  diaspora_au: 'Cross-border framing for the Australian diaspora — paying from abroad, delivered in Zimbabwe, no queues or hassle for family back home.',
  diaspora_eu: 'Cross-border framing for the continental European diaspora — paying from abroad, delivered in Zimbabwe.',
  diaspora_bw: 'Cross-border framing for the Botswana diaspora, similar to South Africa but a smaller, more local-feeling community.',
  global: 'Broad, universal framing — let the platform\'s own audience-finding do the targeting.'
};

// In-memory cache, 24h TTL (Spec 9.9.2 / 28.1's cost control), keyed on
// (trend, product, platform, region). In-memory rather than Redis, per the
// Phase 0 no-Redis decision — a cache losing its warm state on a process
// restart is a cost/latency concern, not a correctness one.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const captionCache = new Map();

function cacheKey(trendId, productId, platform, region) {
  return `${trendId}:${productId}:${platform}:${region}`;
}

// Classifies a caption's opening-hook style (Spec 10.9.2's "differ in
// opening hook" requirement, and Phase 12's A/B feedback loop needs a label
// to group performance by). Deterministic and heuristic rather than another
// LLM call — cheap, and only needs to be roughly right to group variants,
// not perfectly right for any single caption.
function classifyVariantStyle(caption) {
  const opening = (caption || '').trim().slice(0, 40);
  if (/\?/.test(opening)) return 'question_hook';
  if (/^[R$£€]?\s*\d/.test(opening)) return 'price_lead';
  return 'story_lead';
}

function buildTemplateFallbackCaption(trend, product, platform) {
  const price = product.salePrice || product.regularPrice;
  const priceText = price ? ` — now R${Number(price).toFixed(2)}` : '';
  return `${product.name} is trending right now${priceText}. Shop it today at PesaShop.`;
}

async function callClaude(prompt, apiKey) {
  const startedAt = Date.now();
  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    { model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] },
    { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
  );
  recordLLMLatency(Date.now() - startedAt); // Spec 17's "average composer LLM latency" metric
  await recordLLMSpend(res.data?.usage); // Spec 28: real spend, from this response's own reported token usage
  return res.data?.content?.[0]?.text?.trim() || '';
}

// Generates 2-3 A/B caption variants (Spec 10.9.2) that must differ in
// opening hook, not just word choice.
async function generateCaptionVariants({ trend, product, platform, region = 'local_zw' }) {
  const key = cacheKey(trend._id, product._id, platform, region);
  const cached = captionCache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.variants;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`[autoposter-composer] ANTHROPIC_API_KEY not set — using a plain template caption for ${platform} (no real variant generation)`);
    const fallback = [buildTemplateFallbackCaption(trend, product, platform)];
    captionCache.set(key, { variants: fallback, at: Date.now() });
    return fallback;
  }

  // Cost control (Spec 28.1): "engine pauses LLM-driven composition when
  // [the monthly budget is] exceeded, falling back to template-only
  // captions" — same fallback path as a missing API key.
  if (await isLLMBudgetExceeded()) {
    console.log(`[autoposter-composer] LLM_MONTHLY_BUDGET_USD exceeded — using a plain template caption for ${platform}`);
    const fallback = [buildTemplateFallbackCaption(trend, product, platform)];
    captionCache.set(key, { variants: fallback, at: Date.now() });
    return fallback;
  }

  const price = product.salePrice || product.regularPrice;
  const prompt = [
    'You are writing a social media caption for PesaShop, a Zimbabwean e-commerce brand serving both local Zimbabwean shoppers and the global Zimbabwean diaspora.',
    `Platform: ${platform}`,
    `Platform style guide: ${PLATFORM_STYLE_GUIDES[platform] || ''}`,
    `Regional framing: ${REGION_FRAMING[region] || REGION_FRAMING.local_zw}`,
    `Trending topic driving this post: "${trend.term}"`,
    `Product: ${product.name}${price ? `, priced around R${Number(price).toFixed(2)}` : ''}`,
    'Write exactly 2 distinct caption variants for this post. The two variants must differ in their OPENING HOOK, not just minor word choice — e.g. one could lead with a question, the other with a statement.',
    'Never reference Zimbabwean politics, elections, currency crises, fuel shortages, ZESA/electricity outages, or religious/tribal topics, even tangentially.',
    'Return ONLY the two captions, one per line, with no numbering, headers, or extra commentary.'
  ].join('\n');

  try {
    const text = await callClaude(prompt, apiKey);
    const variants = text.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3);
    const result = variants.length > 0 ? variants : [buildTemplateFallbackCaption(trend, product, platform)];
    captionCache.set(key, { variants: result, at: Date.now() });
    return result;
  } catch (error) {
    console.error(`[autoposter-composer] Claude caption generation failed for "${trend.term}" / ${platform}:`, error.message);
    return [buildTemplateFallbackCaption(trend, product, platform)];
  }
}

module.exports = { generateCaptionVariants, PLATFORM_STYLE_GUIDES, REGION_FRAMING, buildTemplateFallbackCaption, classifyVariantStyle };
