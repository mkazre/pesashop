const axios = require('axios');
const AutoposterBlocklistTerm = require('../models/AutoposterBlocklistTerm');
const { recordLLMSpend, isLLMBudgetExceeded } = require('./autoposterCostControl');

// Brand safety, layer 2 of 3 (Spec 10.10): "every generated caption is
// reviewed by Claude." Distinct from Phase 9's layer 3 (which classifies
// the trend TERM before a caption ever exists) — this reviews the actual
// generated text. The static blocklist (layer 1) is re-checked here too,
// against the caption text itself, since a caption could reference a
// blocklisted term even if the trend term that inspired it didn't.

async function checkCaptionAgainstBlocklist(caption) {
  const blocklist = await AutoposterBlocklistTerm.find({ type: { $in: ['exact', 'regex'] } });
  for (const entry of blocklist) {
    if (entry.type === 'exact' && caption.toLowerCase().includes(entry.term.toLowerCase())) {
      return { safe: false, reason: `Caption contains blocklisted term: "${entry.term}"` };
    }
    if (entry.type === 'regex') {
      try {
        if (new RegExp(entry.term, 'i').test(caption)) return { safe: false, reason: `Caption matches blocklist pattern: ${entry.term}` };
      } catch { /* invalid admin-entered regex shouldn't crash the safety check */ }
    }
  }
  return { safe: true };
}

async function checkCaptionWithLLM(caption) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { checked: false, safe: true, reason: 'LLM classifier not configured (static blocklist check still applied)' };
  }
  // Cost control (Spec 28.1) — skipping this layer under budget pressure
  // never makes a caption LESS safe (it can only widen to "not checked,
  // static blocklist still applies"), same shape as the missing-API-key path.
  if (await isLLMBudgetExceeded()) {
    return { checked: false, safe: true, reason: 'LLM monthly budget exceeded (static blocklist check still applied)' };
  }
  const prompt = `Is this caption safe for a politically neutral commercial e-commerce brand in Zimbabwe to publish? Consider political figures, parties, currency crises, fuel shortages, ZESA/electricity outages, religious or tribal controversy. Caption: "${caption}"\nReply with exactly one word, "yes" or "no", then a hyphen, then a one-sentence reason.`;
  try {
    const res = await axios.post(
      'https://api.anthropic.com/v1/messages',
      { model: 'claude-haiku-4-5-20251001', max_tokens: 100, messages: [{ role: 'user', content: prompt }] },
      { headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' } }
    );
    await recordLLMSpend(res.data?.usage);
    const text = res.data?.content?.[0]?.text?.trim() || '';
    return { checked: true, safe: /^yes\b/i.test(text), reason: text };
  } catch (error) {
    console.error('[autoposter-composer] LLM caption safety check failed:', error.message);
    return { checked: false, safe: true, reason: `Classifier error: ${error.message}` };
  }
}

// Combines both layers. The static blocklist can only make a caption
// unsafe, never safe on its own merits — a caption that clears it still
// goes through the LLM layer if one is configured.
async function checkCaptionSafety(caption) {
  const staticResult = await checkCaptionAgainstBlocklist(caption);
  if (!staticResult.safe) return staticResult;

  const llmResult = await checkCaptionWithLLM(caption);
  if (llmResult.checked && !llmResult.safe) return { safe: false, reason: llmResult.reason };
  return { safe: true, reason: llmResult.checked ? llmResult.reason : 'Passed static blocklist (LLM layer not configured)' };
}

module.exports = { checkCaptionSafety, checkCaptionAgainstBlocklist, checkCaptionWithLLM };
