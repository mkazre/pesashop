// Phase 11 (Admin Trend Dashboard) — pure/mocked-DB logic only. The live
// dashboard UI (Live Trends table, Cultural Calendar, Insights, Configuration
// panel) was verified against the real server and database instead, same
// convention as every prior phase.
const { getActiveCulturalEventBoosts } = require('../../services/autoposterTrendIngestionRun');
const AutoposterCulturalEvent = require('../../models/AutoposterCulturalEvent');
const { computeCandidateWeight } = require('../../services/autoposterWeightedSampler');
const { checkHardCaps, checkCategoryShareCap } = require('../../services/autoposterCooldownGuard');
const AutoposterEngineConfig = require('../../models/AutoposterEngineConfig');
const AutoposterPostTarget = require('../../models/AutoposterPostTarget');
const AutoposterDecision = require('../../models/AutoposterDecision');
const AutoposterAccount = require('../../models/AutoposterAccount');
const AutoposterPost = require('../../models/AutoposterPost');
const AutoposterAuditLog = require('../../models/AutoposterAuditLog');
const Settings = require('../../models/Settings');
const { bulkApproveByPlatform, bulkRejectByTrend } = require('../../services/autoposterApprovalQueue');

describe('getActiveCulturalEventBoosts — "once" one-off events and lead-time ramp (Spec 12.3)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('matches a "once" event on its exact date', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([
      { active: true, recurrence: { type: 'once', date: '2026-08-15' }, boost: 1.6, leadTimeDays: 0 }
    ]);
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 7, 15)))).toEqual([1.6]);
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 7, 16)))).toEqual([]);
  });

  it('ramps a "once" event linearly across its lead-time window, reaching full boost on the day', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([
      { active: true, recurrence: { type: 'once', date: '2026-08-15' }, boost: 2.0, leadTimeDays: 4 }
    ]);
    // 2 days before: halfway through the 4-day ramp -> 1 + (2.0-1)*(1 - 2/4) = 1.5
    const [halfway] = await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 7, 13)));
    expect(halfway).toBeCloseTo(1.5);
    // exactly on day: full boost
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 7, 15)))).toEqual([2.0]);
    // outside the ramp window: nothing
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 7, 1)))).toEqual([]);
  });

  it('ramps an "annual" event the same way, wrapping to next year once the date has passed', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([
      { active: true, recurrence: { type: 'annual', month: 4, day: 18 }, boost: 1.4, leadTimeDays: 2 }
    ]);
    // 1 day before April 18 -> ramp fraction 1 - 1/2 = 0.5 -> 1 + 0.4*0.5 = 1.2
    const [ramped] = await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 3, 17)));
    expect(ramped).toBeCloseTo(1.2);
  });

  it('defaults leadTimeDays to 0, matching pre-Phase-11 exact-day-only behaviour', async () => {
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([
      { active: true, recurrence: { type: 'annual', month: 4, day: 18 }, boost: 1.3, leadTimeDays: 0 }
    ]);
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 3, 17)))).toEqual([]);
    expect(await getActiveCulturalEventBoosts(new Date(Date.UTC(2026, 3, 18)))).toEqual([1.3]);
  });
});

describe('computeCandidateWeight — Pin action (Spec 12.1)', () => {
  const product = { _id: 'p1', regularPrice: 100, backendPrice: 60, stock: 10, categories: [], _similarity: 0.8 };

  afterEach(() => jest.restoreAllMocks());

  it('uses a forced high effective score for a currently-pinned trend, overriding a low trendScore', async () => {
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([]);
    jest.spyOn(AutoposterPostTarget, 'findOne').mockReturnValue({ sort: () => Promise.resolve(null) });
    jest.spyOn(AutoposterEngineConfig, 'getConfig').mockResolvedValue({ cooldown: { maxPostsPerProductRegionPer7d: 2, maxPostsPerProductGlobalPer7d: 6, minSpacingSameRegionMinutes: 90, minSpacingSamePlatformMinutes: 30, maxCategorySharePercent: 40 }, categories: [] });
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([]);

    const pinnedTrend = { trendScore: 0.05, pinnedUntil: new Date(Date.now() + 60 * 60 * 1000) };
    const { weight, breakdown } = await computeCandidateWeight(pinnedTrend, product, 'facebook', 'local_zw');
    expect(breakdown.pinned).toBe(true);
    expect(breakdown.trendScore).toBe(1.0);
    expect(weight).toBeGreaterThan(0);
  });

  it('ignores an expired pin and falls back to the real trendScore', async () => {
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([]);
    jest.spyOn(AutoposterPostTarget, 'findOne').mockReturnValue({ sort: () => Promise.resolve(null) });
    jest.spyOn(AutoposterEngineConfig, 'getConfig').mockResolvedValue({ cooldown: { maxPostsPerProductRegionPer7d: 2, maxPostsPerProductGlobalPer7d: 6, minSpacingSameRegionMinutes: 90, minSpacingSamePlatformMinutes: 30, maxCategorySharePercent: 40 }, categories: [] });
    jest.spyOn(AutoposterCulturalEvent, 'find').mockResolvedValue([]);

    const expiredPinTrend = { trendScore: 0.4, pinnedUntil: new Date(Date.now() - 60 * 60 * 1000) };
    const { breakdown } = await computeCandidateWeight(expiredPinTrend, product, 'facebook', 'local_zw');
    expect(breakdown.pinned).toBe(false);
    expect(breakdown.trendScore).toBe(0.4);
  });
});

describe('checkHardCaps / checkCategoryShareCap — admin-configurable cooldown thresholds (Spec 12.5)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('uses the schema default thresholds when no config override exists (unchanged from pre-Phase-11 behaviour)', async () => {
    jest.spyOn(AutoposterEngineConfig, 'getConfig').mockResolvedValue({ cooldown: { maxPostsPerProductRegionPer7d: 2, maxPostsPerProductGlobalPer7d: 6, minSpacingSameRegionMinutes: 90, minSpacingSamePlatformMinutes: 30, maxCategorySharePercent: 40 } });
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([{ n: 2 }]); // hits the region cap of 2
    const result = await checkHardCaps('prod1', 'facebook', 'local_zw');
    expect(result.blocked).toBe(true);
    expect(result.reason).toMatch(/2 times/);
  });

  it('respects an admin-lowered region cap', async () => {
    jest.spyOn(AutoposterEngineConfig, 'getConfig').mockResolvedValue({ cooldown: { maxPostsPerProductRegionPer7d: 1, maxPostsPerProductGlobalPer7d: 6, minSpacingSameRegionMinutes: 90, minSpacingSamePlatformMinutes: 30, maxCategorySharePercent: 40 } });
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([{ n: 1 }]); // would pass the default cap of 2, but not a lowered cap of 1
    const result = await checkHardCaps('prod1', 'facebook', 'local_zw');
    expect(result.blocked).toBe(true);
    expect(result.reason).toMatch(/1 times/);
  });

  it('applies a per-category maxSharePercent override instead of the global default', async () => {
    jest.spyOn(AutoposterEngineConfig, 'getConfig').mockResolvedValue({
      cooldown: { maxCategorySharePercent: 40 },
      categories: [{ category: 'cat1', maxSharePercent: 10 }]
    });
    // 2 of 5 recent posts (40%) match this category — clears the global 40% default but not a 10% override
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([
      { product: { categories: ['cat1'] } },
      { product: { categories: ['cat1'] } },
      { product: { categories: ['other'] } },
      { product: { categories: ['other'] } },
      { product: { categories: ['other'] } }
    ]);
    const result = await checkCategoryShareCap(['cat1'], 'facebook', 'local_zw');
    expect(result.blocked).toBe(true);
    expect(result.reason).toMatch(/cap: 10%/);
  });
});

describe('bulkApproveByPlatform / bulkRejectByTrend (Spec 12.2 bulk actions)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('bulkApproveByPlatform approves every pending decision for that platform independently, reporting per-decision success', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: { killSwitchEnabled: false } });
    const decisions = [
      { _id: 'd1', platform: 'facebook' },
      { _id: 'd2', platform: 'facebook' }
    ];
    jest.spyOn(AutoposterDecision, 'find').mockResolvedValue(decisions);

    const makeChain = (doc) => { const c = { populate: jest.fn() }; c.populate.mockImplementation(() => c); c.then = (resolve) => resolve(doc); return c; };
    jest.spyOn(AutoposterDecision, 'findById')
      .mockReturnValueOnce(makeChain({ _id: 'd1', approvalStatus: 'pending', platform: 'facebook', variants: ['cap1'], trend: { term: 't' }, product: { _id: 'p1', slug: 's1' }, save: jest.fn().mockResolvedValue(undefined) }))
      .mockReturnValueOnce(makeChain({ _id: 'd2', approvalStatus: 'pending', platform: 'facebook', variants: ['cap2'], trend: { term: 't' }, product: { _id: 'p2', slug: 's2' }, save: jest.fn().mockResolvedValue(undefined) }));

    jest.spyOn(AutoposterAccount, 'findOne').mockResolvedValue({ _id: 'acc1' });
    jest.spyOn(AutoposterPost, 'create').mockResolvedValue({ _id: 'post1' });
    const AutoposterPostTargetModel = require('../../models/AutoposterPostTarget');
    jest.spyOn(AutoposterPostTargetModel, 'create').mockResolvedValue({ _id: 'target1' });
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    const results = await bulkApproveByPlatform('facebook', 'admin1');
    expect(results).toEqual([
      { decisionId: 'd1', ok: true },
      { decisionId: 'd2', ok: true }
    ]);
  });

  it('bulkApproveByPlatform reports a per-decision failure without aborting the rest', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: { killSwitchEnabled: false } });
    jest.spyOn(AutoposterDecision, 'find').mockResolvedValue([{ _id: 'd1', platform: 'facebook' }]);
    const makeChain = (doc) => { const c = { populate: jest.fn() }; c.populate.mockImplementation(() => c); c.then = (resolve) => resolve(doc); return c; };
    jest.spyOn(AutoposterDecision, 'findById').mockReturnValue(makeChain({ _id: 'd1', approvalStatus: 'pending', platform: 'facebook', variants: ['cap'], trend: { term: 't' }, product: { _id: 'p1', slug: 's1' } }));
    jest.spyOn(AutoposterAccount, 'findOne').mockResolvedValue(null); // no active account -> approveDecision throws

    const results = await bulkApproveByPlatform('facebook', 'admin1');
    expect(results).toEqual([{ decisionId: 'd1', ok: false, error: expect.stringContaining('No active connected') }]);
  });

  it('bulkRejectByTrend rejects every pending decision for that trend', async () => {
    jest.spyOn(AutoposterDecision, 'find').mockResolvedValue([{ _id: 'd1' }, { _id: 'd2' }]);
    const makeChain = (doc) => { const c = { populate: jest.fn() }; c.populate.mockImplementation(() => c); c.then = (resolve) => resolve(doc); return c; };
    jest.spyOn(AutoposterDecision, 'findById')
      .mockReturnValueOnce(makeChain({ _id: 'd1', approvalStatus: 'pending', save: jest.fn().mockResolvedValue(undefined) }))
      .mockReturnValueOnce(makeChain({ _id: 'd2', approvalStatus: 'pending', save: jest.fn().mockResolvedValue(undefined) }));
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    const results = await bulkRejectByTrend('trend1', 'admin1', { reason: 'bulk reject test' });
    expect(results).toEqual([
      { decisionId: 'd1', ok: true },
      { decisionId: 'd2', ok: true }
    ]);
  });
});
