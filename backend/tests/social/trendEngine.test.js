// Pure logic only. The actual ingestion run (real network calls to
// SerpAPI/X, real DB reads/writes) was verified live against the real
// database instead — consistent with this repo's testing convention.
const {
  normaliseVolume,
  computeVelocityScore,
  computeSourceConfidence,
  computeCulturalEventBoost,
  computeCrossSourceValidation,
  computeTrendScore
} = require('../../services/autoposterTrendScoring');
const { checkBlocklist, getActiveCulturalEventBoosts, slugify } = require('../../services/autoposterTrendIngestionRun');

describe('trend scoring', () => {
  it('normaliseVolume scales against the run\'s max volume', () => {
    expect(normaliseVolume(50, 100)).toBe(0.5);
    expect(normaliseVolume(100, 100)).toBe(1);
    expect(normaliseVolume(5, 0)).toBe(0);
  });

  it('computeVelocityScore treats a brand-new trend (no prior volume) as maximum velocity', () => {
    expect(computeVelocityScore(10, 0)).toBe(1);
    expect(computeVelocityScore(0, 0)).toBe(0);
  });

  it('computeVelocityScore computes and caps rate of change', () => {
    expect(computeVelocityScore(15, 10)).toBeCloseTo(0.5); // +50%
    expect(computeVelocityScore(5, 10)).toBe(0); // decline floors at 0, not negative
    expect(computeVelocityScore(100, 10)).toBe(1); // huge spike caps at 1
  });

  it('computeSourceConfidence takes the highest confidence among reporting sources', () => {
    expect(computeSourceConfidence(['firstparty_search', 'google_trends_scraper'])).toBe(1.0);
    expect(computeSourceConfidence(['serpapi', 'x'])).toBe(0.8);
    expect(computeSourceConfidence(['tiktok'])).toBe(0.5);
    expect(computeSourceConfidence([])).toBe(0);
  });

  it('computeCulturalEventBoost normalises the 1.0-2.0 boost range to 0-1', () => {
    expect(computeCulturalEventBoost([])).toBe(0);
    expect(computeCulturalEventBoost([1.0])).toBe(0);
    expect(computeCulturalEventBoost([2.0])).toBe(1);
    expect(computeCulturalEventBoost([1.4, 1.8])).toBeCloseTo(0.8); // takes the max
  });

  it('computeCrossSourceValidation normalises against 5 possible sources', () => {
    expect(computeCrossSourceValidation(1)).toBeCloseTo(0.2);
    expect(computeCrossSourceValidation(5)).toBe(1);
    expect(computeCrossSourceValidation(10)).toBe(1); // caps at 1 even if impossible in practice
  });

  it('computeTrendScore combines every factor per the Spec 10.4 weights (sum to 1.0)', () => {
    const score = computeTrendScore({
      volumeNormalised: 1, velocityScore: 1, sourceConfidence: 1, culturalEventBoost: 1, crossSourceValidation: 1
    });
    expect(score).toBeCloseTo(1.0); // all factors maxed -> score should be 1.0 (weights sum to 1.0)
  });

  it('velocity is weighted more heavily than raw volume, per the spec\'s own stated intent', () => {
    // A low-volume, high-velocity trend should outscore a high-volume, flat one.
    const risingSmallTrend = computeTrendScore({ volumeNormalised: 0.2, velocityScore: 1, sourceConfidence: 0.5, culturalEventBoost: 0, crossSourceValidation: 0.2 });
    const saturatedLargeTrend = computeTrendScore({ volumeNormalised: 1, velocityScore: 0.1, sourceConfidence: 0.5, culturalEventBoost: 0, crossSourceValidation: 0.2 });
    expect(risingSmallTrend).toBeGreaterThan(saturatedLargeTrend);
  });
});

describe('slugify', () => {
  it('normalises terms consistently regardless of case/punctuation', () => {
    expect(slugify('Back to School!')).toBe('back-to-school');
    expect(slugify('  Load-Shedding  ')).toBe('load-shedding');
  });
});

describe('checkBlocklist (brand safety, layer 1 of 3 — Spec 10.10)', () => {
  const AutoposterBlocklistTerm = require('../../models/AutoposterBlocklistTerm');

  it('flags a term containing an exact blocklist match, case-insensitively', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'exact', term: 'sanctions', reason: 'politically charged' }]);
    const result = await checkBlocklist('New US Sanctions Impact');
    expect(result.flagged).toBe(true);
    expect(result.reason).toMatch(/sanctions/i);
  });

  it('flags a term matching a regex blocklist entry', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'regex', term: 'fuel\\s*queue', reason: 'fuel shortage' }]);
    const result = await checkBlocklist('long fuel queue in Harare');
    expect(result.flagged).toBe(true);
  });

  it('does not crash on an admin-entered invalid regex, and does not flag', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'regex', term: '(unclosed', reason: 'broken' }]);
    const result = await checkBlocklist('anything');
    expect(result.flagged).toBe(false);
  });

  it('does not flag an unrelated term', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'exact', term: 'sanctions', reason: 'x' }]);
    const result = await checkBlocklist('back to school shoes');
    expect(result.flagged).toBe(false);
  });

  afterEach(() => jest.restoreAllMocks());
});

describe('getActiveCulturalEventBoosts (Spec 10.5 recurrence matching)', () => {
  const AutoposterCulturalEvent = require('../../models/AutoposterCulturalEvent');

  it('matches an annual event on its exact date', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([{ active: true, recurrence: { type: 'annual', month: 4, day: 18 }, boost: 1.3 }]);
    const boosts = await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 3, 18))); // April 18
    expect(boosts).toEqual([1.3]);
  });

  it('does not match an annual event on any other date', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([{ active: true, recurrence: { type: 'annual', month: 4, day: 18 }, boost: 1.3 }]);
    const boosts = await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 3, 19))); // April 19
    expect(boosts).toEqual([]);
  });

  it('matches a monthly day-range event (e.g. month-end payday)', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([{ active: true, recurrence: { type: 'monthly', dayRange: [23, 30] }, boost: 1.4 }]);
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 5, 25)))).toEqual([1.4]);
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 5, 15)))).toEqual([]);
  });

  it('matches an annual_range event that spans a year boundary (diaspora return season)', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([{ active: true, recurrence: { type: 'annual_range', startMonth: 12, startDay: 15, endMonth: 1, endDay: 15 }, boost: 1.8 }]);
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2025, 11, 20)))).toEqual([1.8]); // Dec 20
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 0, 5)))).toEqual([1.8]);   // Jan 5
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 5, 1)))).toEqual([]);       // June — well outside
  });

  afterEach(() => jest.restoreAllMocks());
});
