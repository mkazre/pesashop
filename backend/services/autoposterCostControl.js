const AutoposterCostLedger = require('../models/AutoposterCostLedger');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const { AUTOPOSTER_TARGET_STATUS } = require('../config/constants');

// Cost controls (Spec Section 28, Phase 13). Every figure here is a real,
// published per-token rate — not an estimate — applied to the real token
// counts each API response actually reports.
//
// Claude Haiku 4.5 (used throughout this module for captions + safety
// classification): $1.00 / 1M input tokens, $5.00 / 1M output tokens.
// OpenAI text-embedding-3-small (used for trend/product/category
// embeddings): $0.02 / 1M tokens — Spec 28's own cost table flags "confirm
// at implementation time"; this is OpenAI's own published rate as of this
// build, tracked separately from the Claude Console-sourced Haiku rate above.
const HAIKU_INPUT_USD_PER_MILLION = 1.0;
const HAIKU_OUTPUT_USD_PER_MILLION = 5.0;
const EMBEDDING_USD_PER_MILLION = 0.02;

function computeClaudeCostUSD(usage) {
  if (!usage) return 0;
  const inputCost = ((usage.input_tokens || 0) / 1_000_000) * HAIKU_INPUT_USD_PER_MILLION;
  const outputCost = ((usage.output_tokens || 0) / 1_000_000) * HAIKU_OUTPUT_USD_PER_MILLION;
  return inputCost + outputCost;
}

function computeEmbeddingCostUSD(totalTokens) {
  if (!totalTokens) return 0;
  return (totalTokens / 1_000_000) * EMBEDDING_USD_PER_MILLION;
}

// LLM_MONTHLY_BUDGET_USD is a soft cap (Spec 28.1) — unset means no cap, the
// only honest default given no admin has configured one.
async function isLLMBudgetExceeded() {
  const budget = parseFloat(process.env.LLM_MONTHLY_BUDGET_USD);
  if (!budget || Number.isNaN(budget)) return false;
  const ledger = await AutoposterCostLedger.getCurrentMonth();
  return ledger.llmSpendUSD >= budget;
}

async function recordLLMSpend(usage) {
  const cost = computeClaudeCostUSD(usage);
  if (cost <= 0) return 0;
  const ledger = await AutoposterCostLedger.getCurrentMonth();
  ledger.llmSpendUSD += cost;
  await ledger.save();
  return cost;
}

async function recordEmbeddingSpend(totalTokens) {
  const cost = computeEmbeddingCostUSD(totalTokens);
  if (cost <= 0) return 0;
  const ledger = await AutoposterCostLedger.getCurrentMonth();
  ledger.embeddingSpendUSD += cost;
  await ledger.save();
  return cost;
}

async function recordXPost() {
  const ledger = await AutoposterCostLedger.getCurrentMonth();
  ledger.xPostsThisMonth += 1;
  await ledger.save();
}

// X usage monitor (Spec 17, 28.1): % of the Basic-tier monthly post cap
// consumed. Counted from real published targets this calendar month, not
// the ledger's own running counter — so it's correct even if the ledger
// document was reset or created after some of this month's posts.
const X_MONTHLY_POST_CAP = parseInt(process.env.X_MONTHLY_POST_CAP, 10) || 3000; // Basic tier's documented monthly cap; confirm at implementation time per Spec 28

async function getXUsagePercent() {
  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  const count = await AutoposterPostTarget.countDocuments({
    platform: 'x',
    status: AUTOPOSTER_TARGET_STATUS.PUBLISHED,
    publishedAt: { $gte: monthStart }
  });
  return { count, cap: X_MONTHLY_POST_CAP, percent: Math.round((count / X_MONTHLY_POST_CAP) * 1000) / 10 };
}

// Average composer LLM latency (Spec 17's trend-engine metric). In-memory
// only — an operational gauge that's fine to reset on restart, not a
// historical record worth persisting.
const RECENT_LATENCIES_MAX = 50;
const recentLLMLatenciesMs = [];

function recordLLMLatency(ms) {
  if (typeof ms !== 'number' || ms < 0) return;
  recentLLMLatenciesMs.push(ms);
  if (recentLLMLatenciesMs.length > RECENT_LATENCIES_MAX) recentLLMLatenciesMs.shift();
}

function getAverageLLMLatencyMs() {
  if (recentLLMLatenciesMs.length === 0) return null;
  return Math.round(recentLLMLatenciesMs.reduce((s, v) => s + v, 0) / recentLLMLatenciesMs.length);
}

module.exports = {
  computeClaudeCostUSD,
  computeEmbeddingCostUSD,
  isLLMBudgetExceeded,
  recordLLMSpend,
  recordEmbeddingSpend,
  recordXPost,
  getXUsagePercent,
  recordLLMLatency,
  getAverageLLMLatencyMs,
  X_MONTHLY_POST_CAP
};
