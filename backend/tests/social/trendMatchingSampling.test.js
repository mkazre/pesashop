// Pure logic only. The DB-dependent pieces (embedding + cosine matching,
// cool-down aggregation queries, a full sampling run) were verified live
// against the real database instead, consistent with this repo's testing
// convention throughout this build.
const { computeMarginFactor, computeStockFactor, computePlatformFit, weightedSampleWithoutReplacement } = require('../../services/autoposterWeightedSampler');
const { classifyTrendSafety } = require('../../services/autoposterTrendSafetyClassifier');

describe('computeMarginFactor', () => {
  it('favours high-margin products (>40%) with a 1.5x factor', () => {
    expect(computeMarginFactor({ regularPrice: 100, backendPrice: 50 })).toBe(1.5); // 50% margin
  });
  it('discourages thin-margin products (<20%) with a 0.5x factor', () => {
    expect(computeMarginFactor({ regularPrice: 100, backendPrice: 90 })).toBe(0.5); // 10% margin
  });
  it('stays neutral for typical retail margins (20-40%)', () => {
    expect(computeMarginFactor({ regularPrice: 100, backendPrice: 70 })).toBe(1.0); // 30% margin
  });
  it('stays neutral when cost data is missing, rather than guessing', () => {
    expect(computeMarginFactor({ regularPrice: 100 })).toBe(1.0);
  });
  it('uses the sale price over regular price when on sale', () => {
    expect(computeMarginFactor({ regularPrice: 100, salePrice: 60, backendPrice: 50 })).toBe(0.5); // 17% margin off sale price
  });
});

describe('computeStockFactor', () => {
  it('is 0 for out-of-stock products (Spec 10.7\'s literal anchor)', () => {
    expect(computeStockFactor({ outOfStock: true, stock: 0 })).toBe(0);
    expect(computeStockFactor({ outOfStock: false, stock: 0 })).toBe(0);
  });
  it('is 1.2 for high-stock products (Spec 10.7\'s literal anchor, >50)', () => {
    expect(computeStockFactor({ outOfStock: false, stock: 51 })).toBe(1.2);
  });
  it('stays neutral (1.0) for everything in between, rather than interpolating unspecified values', () => {
    expect(computeStockFactor({ outOfStock: false, stock: 25 })).toBe(1.0);
  });
});

describe('computePlatformFit', () => {
  it('defaults to neutral (1.0) — Spec 10.7 references a Section 9.8 that does not exist in the received spec', () => {
    expect(computePlatformFit()).toBe(1.0);
  });
});

describe('classifyTrendSafety — gating on missing ANTHROPIC_API_KEY', () => {
  const ORIGINAL = process.env.ANTHROPIC_API_KEY;
  afterEach(() => { process.env.ANTHROPIC_API_KEY = ORIGINAL; });

  it('degrades gracefully with a clear reason when no API key is configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await classifyTrendSafety('back to school');
    expect(result.classified).toBe(false);
    expect(result.sensitive).toBe(false); // never silently blocks everything just because the classifier can't run
    expect(result.reason).toMatch(/not configured/i);
  });
});

// Spec Section 26.3's explicit acceptance test: "run sampler 10,000 times
// against a fixed candidate set; assert that no single product wins more
// than expected probability + 3 sigma."
describe('weightedSampleWithoutReplacement — distribution test (Spec 26.3)', () => {
  it('selects each candidate proportionally to its weight across 10,000 trials, within 3 standard deviations', () => {
    const candidates = [
      { id: 'low', weight: 1 },
      { id: 'mid', weight: 1 },
      { id: 'high', weight: 8 }
    ];
    const totalWeight = 10;
    const trials = 10000;
    const counts = { low: 0, mid: 0, high: 0 };

    for (let i = 0; i < trials; i++) {
      const [picked] = weightedSampleWithoutReplacement(candidates, 1);
      counts[picked.id]++;
    }

    for (const c of candidates) {
      const expectedP = c.weight / totalWeight;
      const expectedCount = expectedP * trials;
      const stdDev = Math.sqrt(trials * expectedP * (1 - expectedP)); // binomial std dev
      const observed = counts[c.id];
      expect(Math.abs(observed - expectedCount)).toBeLessThan(3 * stdDev);
    }

    // The high-weight candidate should clearly dominate — sanity check
    // beyond the raw statistical bound.
    expect(counts.high).toBeGreaterThan(counts.low * 3);
  });

  it('excludes zero-weight candidates entirely, even under heavy repeated sampling', () => {
    const candidates = [{ id: 'blocked', weight: 0 }, { id: 'eligible', weight: 1 }];
    for (let i = 0; i < 100; i++) {
      const picked = weightedSampleWithoutReplacement(candidates, 1);
      expect(picked.map((p) => p.id)).not.toContain('blocked');
    }
  });

  it('never selects the same candidate twice in one draw (sampling without replacement)', () => {
    const candidates = [{ id: 'a', weight: 1 }, { id: 'b', weight: 1 }, { id: 'c', weight: 1 }];
    const picked = weightedSampleWithoutReplacement(candidates, 3);
    const ids = picked.map((p) => p.id);
    expect(new Set(ids).size).toBe(3);
  });

  it('stops early if fewer eligible candidates exist than requested', () => {
    const candidates = [{ id: 'a', weight: 1 }];
    const picked = weightedSampleWithoutReplacement(candidates, 5);
    expect(picked).toHaveLength(1);
  });

  // Regression test: a real bug found during Phase 9 live verification. The
  // function used to return shallow COPIES of candidates, which silently
  // broke runTrendSamplingRun.js's `selectedSet.has(candidate)` check (a Set
  // of the returned copies, tested against the ORIGINAL objects by
  // reference) — every real trend-matching run selected zero candidates
  // despite real positive weights, and no existing unit test caught it
  // because none of them checked reference identity.
  it('returns the exact same object references passed in, not copies', () => {
    const a = { id: 'a', weight: 1 };
    const b = { id: 'b', weight: 1 };
    const picked = weightedSampleWithoutReplacement([a, b], 2);
    const originalRefs = new Set([a, b]);
    for (const p of picked) {
      expect(originalRefs.has(p)).toBe(true);
    }
  });
});
