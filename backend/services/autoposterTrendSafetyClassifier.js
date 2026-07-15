const axios = require('axios');
const { AUTOPOSTER_SENSITIVITY } = require('../config/constants');

// Brand safety, layer 3 of 3 (Spec Section 10.10): "any trend term that...
// the LLM classifies as politically sensitive is excluded from candidacy
// entirely." This classifies the trend TERM itself at ingestion/matching
// time — distinct from layer 2 (reviewing a generated CAPTION, which can't
// exist until Phase 10's composer worker generates one).
//
// Gated on ANTHROPIC_API_KEY exactly like every other external-credential
// dependency this build has hit (SerpAPI, the platform OAuth apps) — no key
// is configured yet, so this degrades gracefully rather than blocking the
// whole pipeline. Layer 1 (the static blocklist, Phase 8) keeps working
// regardless; this layer is additive on top of it, not a replacement.
async function classifyTrendSafety(term) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.log(`[autoposter-trends] LLM safety classifier skipped for "${term}" — ANTHROPIC_API_KEY not set (static blocklist, layer 1, still applies)`);
    return { classified: false, sensitive: false, reason: 'LLM classifier not configured' };
  }

  const prompt = `Is the search/social trend term "${term}" safe for a politically neutral commercial e-commerce brand in Zimbabwe to auto-post content near, in a Zimbabwean cultural context? Consider political figures, parties, currency crises, fuel shortages, ZESA/electricity outages, religious or tribal controversy. Reply with exactly one word, "yes" or "no", then a hyphen, then a one-sentence reason.`;

  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      {
        model: 'claude-haiku-4-5-20251001', // fast/cheap classification task, not a generation task
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      },
      { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
    );
    const text = res.data?.content?.[0]?.text?.trim() || '';
    const sensitive = /^no\b/i.test(text);
    return { classified: true, sensitive, reason: text };
  } catch (error) {
    console.error(`[autoposter-trends] LLM safety classification failed for "${term}":`, error.message);
    return { classified: false, sensitive: false, reason: `Classifier error: ${error.message}` };
  }
}

// Applies the classifier result to a trend document's sensitivityFlag,
// never downgrading an existing 'blocked' flag (e.g. from the static
// blocklist, layer 1) — layers only add restriction, never remove it.
async function applySafetyClassification(trend) {
  if (trend.sensitivityFlag === AUTOPOSTER_SENSITIVITY.BLOCKED) return trend; // already blocked by layer 1
  const result = await classifyTrendSafety(trend.term);
  if (result.classified && result.sensitive) {
    trend.sensitivityFlag = AUTOPOSTER_SENSITIVITY.BLOCKED;
    trend.blocklistReason = `LLM safety classifier: ${result.reason}`;
    await trend.save();
  }
  return trend;
}

module.exports = { classifyTrendSafety, applySafetyClassification };
