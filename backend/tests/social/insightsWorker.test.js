// Phase 12 (Insights Collection and Analytics) — pure/mocked-DB logic only.
// The live end-to-end worker run (a real published target, waiting for the
// 1h/24h/7d windows to actually elapse, fetching from a real platform) can't
// be verified live in any timeframe shorter than 7 real days AND a real
// submitted+approved platform app — neither exists yet. Verified instead:
// the worker's window-selection and aggregation logic against mocked data,
// plus every new endpoint against the real database.
const { classifyVariantStyle } = require('../../services/autoposterCaptionComposer');
const {
  windowsAlreadyCaptured,
  collectInsightsForTarget,
  recordVariantPerformance,
  WINDOWS
} = require('../../services/autoposterInsightsWorker');
const AutoposterInsight = require('../../models/AutoposterInsight');
const AutoposterPost = require('../../models/AutoposterPost');
const AutoposterVariantPerformance = require('../../models/AutoposterVariantPerformance');
const AutoposterAccount = require('../../models/AutoposterAccount');
const Product = require('../../models/Product');
const { getAdapter } = require('../../services/autoposterAdapterRegistry');
const { computeEngagementGovernor } = require('../../services/autoposterCooldownGuard');
const AutoposterPostTarget = require('../../models/AutoposterPostTarget');

jest.mock('../../services/autoposterAdapterRegistry');

describe('classifyVariantStyle (Spec 10.9.2 opening-hook grouping)', () => {
  it('classifies a question opening as question_hook', () => {
    expect(classifyVariantStyle('Ready for back-to-school savings?')).toBe('question_hook');
  });
  it('classifies a price-led opening as price_lead', () => {
    expect(classifyVariantStyle('R299 gets you this air fryer today')).toBe('price_lead');
  });
  it('defaults to story_lead for a plain statement opening', () => {
    expect(classifyVariantStyle('This air fryer is trending across Zimbabwe right now.')).toBe('story_lead');
  });
});

describe('windowsAlreadyCaptured', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns the set of windows already snapshotted for a target', async () => {
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({ select: () => Promise.resolve([{ raw: { window: '1h' } }, { raw: { window: '24h' } }]) });
    const captured = await windowsAlreadyCaptured('target1');
    expect(captured).toEqual(new Set(['1h', '24h']));
  });
});

describe('collectInsightsForTarget (window-selection scheduling)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does nothing for a target that has never been published', async () => {
    const result = await collectInsightsForTarget({ publishedAt: null });
    expect(result).toEqual({ fetched: 0 });
  });

  it('fetches only the windows that are due and not yet captured', async () => {
    const publishedAt = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25h ago -> 1h and 24h due, 7d not yet
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({ select: () => Promise.resolve([]) });
    jest.spyOn(AutoposterInsight, 'create').mockResolvedValue({});
    jest.spyOn(AutoposterAccount, 'findById').mockResolvedValue({ _id: 'acc1' });
    jest.spyOn(AutoposterPost, 'findById').mockResolvedValue({ variantStyle: null }); // no variant style -> recordVariantPerformance is a no-op
    const fetchInsights = jest.fn().mockResolvedValue({ likes: 5, comments: 1, shares: 0, clicks: 0 });
    getAdapter.mockReturnValue({ fetchInsights });

    const result = await collectInsightsForTarget({ _id: 't1', publishedAt, platform: 'facebook', account: 'acc1', post: 'post1', externalPostId: 'ext1' });

    expect(result.fetched).toBe(2);
    expect(fetchInsights).toHaveBeenCalledTimes(2);
    expect(AutoposterInsight.create).toHaveBeenCalledWith(expect.objectContaining({ raw: expect.objectContaining({ window: '1h' }) }));
    expect(AutoposterInsight.create).toHaveBeenCalledWith(expect.objectContaining({ raw: expect.objectContaining({ window: '24h' }) }));
  });

  it('skips a window already captured, even if due', async () => {
    const publishedAt = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2h ago -> only 1h due
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({ select: () => Promise.resolve([{ raw: { window: '1h' } }]) });
    const fetchInsights = jest.fn();
    getAdapter.mockReturnValue({ fetchInsights });

    const result = await collectInsightsForTarget({ _id: 't1', publishedAt, platform: 'facebook', account: 'acc1', post: 'post1', externalPostId: 'ext1' });
    expect(result.fetched).toBe(0);
    expect(fetchInsights).not.toHaveBeenCalled();
  });

  it('degrades gracefully when the adapter call throws (e.g. no real credentials)', async () => {
    const publishedAt = new Date(Date.now() - 2 * 60 * 60 * 1000);
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({ select: () => Promise.resolve([]) });
    jest.spyOn(AutoposterAccount, 'findById').mockResolvedValue({ _id: 'acc1' });
    getAdapter.mockReturnValue({ fetchInsights: jest.fn().mockRejectedValue(new Error('no real token')) });

    const result = await collectInsightsForTarget({ _id: 't1', publishedAt, platform: 'facebook', account: 'acc1', post: 'post1', externalPostId: 'ext1' });
    expect(result.fetched).toBe(0); // never throws, never crashes the caller
  });
});

describe('recordVariantPerformance (Phase 12 feedback loop)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('does nothing for a post with no variantStyle (e.g. manually composed)', async () => {
    jest.spyOn(AutoposterPost, 'findById').mockResolvedValue({ variantStyle: null });
    jest.spyOn(AutoposterVariantPerformance, 'findOneAndUpdate');
    await recordVariantPerformance({ post: 'post1', platform: 'facebook' }, { likes: 10 });
    expect(AutoposterVariantPerformance.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('does nothing when the product has no category to group by', async () => {
    jest.spyOn(AutoposterPost, 'findById').mockResolvedValue({ variantStyle: 'question_hook', sourceRef: 'prod1' });
    jest.spyOn(Product, 'findById').mockReturnValue({ select: () => Promise.resolve({ categories: [] }) });
    jest.spyOn(AutoposterVariantPerformance, 'findOneAndUpdate');
    await recordVariantPerformance({ post: 'post1', platform: 'facebook' }, { likes: 10 });
    expect(AutoposterVariantPerformance.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('upserts the (platform, category, style) aggregate with real engagement, summed across metrics', async () => {
    jest.spyOn(AutoposterPost, 'findById').mockResolvedValue({ variantStyle: 'question_hook', sourceRef: 'prod1' });
    jest.spyOn(Product, 'findById').mockReturnValue({ select: () => Promise.resolve({ categories: ['cat1'] }) });
    jest.spyOn(AutoposterVariantPerformance, 'findOneAndUpdate').mockResolvedValue({});

    await recordVariantPerformance({ post: 'post1', platform: 'facebook' }, { likes: 10, comments: 2, shares: 1, clicks: 0 });

    expect(AutoposterVariantPerformance.findOneAndUpdate).toHaveBeenCalledWith(
      { platform: 'facebook', category: 'cat1', variantStyle: 'question_hook' },
      expect.objectContaining({ $inc: { postsCount: 1, totalEngagement: 13 } }),
      { upsert: true }
    );
  });
});

describe('computeEngagementGovernor (Spec 18 risk table — throttle on declining performance)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('stays neutral (1.0) with no category to evaluate', async () => {
    expect(await computeEngagementGovernor('facebook', [])).toBe(1.0);
  });

  it('stays neutral (1.0) when there is not enough real history yet (the only real outcome right now)', async () => {
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([{ _id: 't1' }, { _id: 't2' }]); // well under the batch threshold
    expect(await computeEngagementGovernor('facebook', ['cat1'])).toBe(1.0);
  });

  it('dampens weight when recent engagement has genuinely dropped versus the prior batch', async () => {
    const ids = Array.from({ length: 13 }, (_, i) => ({ _id: `t${i}` }));
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue(ids);
    // Recent 5 targets (t0-t4) engagement near-zero; prior batch (t5-t12) high engagement.
    const insights = [
      ...['t0', 't1', 't2', 't3', 't4'].map((id) => ({ postTarget: id, likes: 1, comments: 0, shares: 0, clicks: 0 })),
      ...['t5', 't6', 't7', 't8', 't9', 't10', 't11', 't12'].map((id) => ({ postTarget: id, likes: 50, comments: 10, shares: 5, clicks: 0 }))
    ];
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({ select: () => Promise.resolve(insights) });

    const factor = await computeEngagementGovernor('facebook', ['cat1']);
    expect(factor).toBeLessThan(1.0);
  });

  it('stays neutral when recent performance is flat or improving', async () => {
    const ids = Array.from({ length: 13 }, (_, i) => ({ _id: `t${i}` }));
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue(ids);
    const insights = Array.from({ length: 13 }, (_, i) => ({ postTarget: `t${i}`, likes: 20, comments: 5, shares: 2, clicks: 0 }));
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({ select: () => Promise.resolve(insights) });

    expect(await computeEngagementGovernor('facebook', ['cat1'])).toBe(1.0);
  });
});
