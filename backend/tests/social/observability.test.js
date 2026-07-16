// Phase 13 (Observability, Alerts, Cost Controls) — pure/mocked-DB logic
// only. The full metrics aggregation pipelines and the real alert dispatch
// (Slack/email) were verified live against the real database instead, same
// convention as every prior phase.
const {
  computeClaudeCostUSD,
  computeEmbeddingCostUSD,
  isLLMBudgetExceeded,
  recordLLMSpend,
  recordLLMLatency,
  getAverageLLMLatencyMs,
  getXUsagePercent
} = require('../../services/autoposterCostControl');
const AutoposterCostLedger = require('../../models/AutoposterCostLedger');
const AutoposterPostTarget = require('../../models/AutoposterPostTarget');

describe('computeClaudeCostUSD (Haiku 4.5: $1.00/$5.00 per 1M input/output tokens)', () => {
  it('computes real cost from reported token usage', () => {
    const cost = computeClaudeCostUSD({ input_tokens: 1_000_000, output_tokens: 1_000_000 });
    expect(cost).toBeCloseTo(6.0);
  });

  it('returns 0 for missing/empty usage', () => {
    expect(computeClaudeCostUSD(null)).toBe(0);
    expect(computeClaudeCostUSD({})).toBe(0);
  });

  it('weights input and output tokens differently (output is 5x input)', () => {
    const inputOnly = computeClaudeCostUSD({ input_tokens: 1_000_000, output_tokens: 0 });
    const outputOnly = computeClaudeCostUSD({ input_tokens: 0, output_tokens: 1_000_000 });
    expect(outputOnly).toBeCloseTo(inputOnly * 5);
  });
});

describe('computeEmbeddingCostUSD (text-embedding-3-small: $0.02 per 1M tokens)', () => {
  it('computes real cost from total tokens', () => {
    expect(computeEmbeddingCostUSD(1_000_000)).toBeCloseTo(0.02);
  });
  it('returns 0 for falsy input', () => {
    expect(computeEmbeddingCostUSD(0)).toBe(0);
    expect(computeEmbeddingCostUSD(undefined)).toBe(0);
  });
});

describe('isLLMBudgetExceeded (Spec 28.1 soft cap)', () => {
  const ORIGINAL = process.env.LLM_MONTHLY_BUDGET_USD;
  afterEach(() => { process.env.LLM_MONTHLY_BUDGET_USD = ORIGINAL; jest.restoreAllMocks(); });

  it('is never exceeded when no budget env var is set (the only real state right now)', async () => {
    delete process.env.LLM_MONTHLY_BUDGET_USD;
    expect(await isLLMBudgetExceeded()).toBe(false);
  });

  it('returns true once the ledger reaches the configured budget', async () => {
    process.env.LLM_MONTHLY_BUDGET_USD = '10';
    jest.spyOn(AutoposterCostLedger, 'getCurrentMonth').mockResolvedValue({ llmSpendUSD: 12 });
    expect(await isLLMBudgetExceeded()).toBe(true);
  });

  it('returns false while under the configured budget', async () => {
    process.env.LLM_MONTHLY_BUDGET_USD = '10';
    jest.spyOn(AutoposterCostLedger, 'getCurrentMonth').mockResolvedValue({ llmSpendUSD: 3 });
    expect(await isLLMBudgetExceeded()).toBe(false);
  });
});

describe('recordLLMSpend', () => {
  afterEach(() => jest.restoreAllMocks());

  it('adds real computed cost to the current month ledger and persists it', async () => {
    const ledger = { llmSpendUSD: 1, save: jest.fn().mockResolvedValue(undefined) };
    jest.spyOn(AutoposterCostLedger, 'getCurrentMonth').mockResolvedValue(ledger);

    const cost = await recordLLMSpend({ input_tokens: 1_000_000, output_tokens: 0 });

    expect(cost).toBeCloseTo(1.0);
    expect(ledger.llmSpendUSD).toBeCloseTo(2.0);
    expect(ledger.save).toHaveBeenCalled();
  });

  it('does nothing (no DB write) when usage is missing', async () => {
    jest.spyOn(AutoposterCostLedger, 'getCurrentMonth');
    await recordLLMSpend(null);
    expect(AutoposterCostLedger.getCurrentMonth).not.toHaveBeenCalled();
  });
});

describe('recordLLMLatency / getAverageLLMLatencyMs', () => {
  it('returns null with no recorded latencies yet', () => {
    // Fresh module instance to avoid cross-test pollution of the in-memory buffer.
    jest.resetModules();
    const fresh = require('../../services/autoposterCostControl');
    expect(fresh.getAverageLLMLatencyMs()).toBe(null);
  });

  it('averages recorded latencies', () => {
    jest.resetModules();
    const fresh = require('../../services/autoposterCostControl');
    fresh.recordLLMLatency(100);
    fresh.recordLLMLatency(200);
    fresh.recordLLMLatency(300);
    expect(fresh.getAverageLLMLatencyMs()).toBe(200);
  });

  it('ignores invalid values', () => {
    jest.resetModules();
    const fresh = require('../../services/autoposterCostControl');
    fresh.recordLLMLatency(-5);
    fresh.recordLLMLatency('not a number');
    expect(fresh.getAverageLLMLatencyMs()).toBe(null);
  });
});

describe('getXUsagePercent (Spec 17 X usage monitor)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('computes real percent of the monthly cap from published X targets this month', async () => {
    jest.spyOn(AutoposterPostTarget, 'countDocuments').mockResolvedValue(1500);
    const result = await getXUsagePercent();
    expect(result.count).toBe(1500);
    expect(result.cap).toBeGreaterThan(0);
    expect(result.percent).toBeCloseTo((1500 / result.cap) * 100, 1);
  });
});
