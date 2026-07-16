// Phase 14 (Hardening and Production Rollout) — pure/mocked-DB logic only.
// The real feature-flag toggle, health endpoint, and graduation gate were
// also verified live against the real server/database (see the phase's
// context doc entry for what that covered).
const AutoposterAuditLog = require('../../models/AutoposterAuditLog');
const AutoposterDecision = require('../../models/AutoposterDecision');
const AutoposterPostTarget = require('../../models/AutoposterPostTarget');
const AutoposterInsight = require('../../models/AutoposterInsight');
const {
  computeGraduationStatus,
  computeCleanRunWeeks,
  computeApprovalRatePercent,
  computeEngagementCoveragePercent,
  CLEAN_RUN_WEEKS_REQUIRED
} = require('../../services/autoposterGraduationCriteria');

describe('isSocialModuleEnabled (Spec 24.3 feature flag)', () => {
  const ORIGINAL = process.env.SOCIAL_MODULE_ENABLED;
  afterEach(() => { process.env.SOCIAL_MODULE_ENABLED = ORIGINAL; jest.resetModules(); });

  it('defaults to enabled when unset (no behaviour change for anyone who never touches this)', () => {
    delete process.env.SOCIAL_MODULE_ENABLED;
    jest.resetModules();
    const { isSocialModuleEnabled } = require('../../services/autoposterModuleFlag');
    expect(isSocialModuleEnabled()).toBe(true);
  });

  it('is disabled only when explicitly set to the string "false"', () => {
    process.env.SOCIAL_MODULE_ENABLED = 'false';
    jest.resetModules();
    const { isSocialModuleEnabled } = require('../../services/autoposterModuleFlag');
    expect(isSocialModuleEnabled()).toBe(false);
  });

  it('treats any other value as enabled (fail open on a typo, not silently disabled)', () => {
    process.env.SOCIAL_MODULE_ENABLED = 'nope';
    jest.resetModules();
    const { isSocialModuleEnabled } = require('../../services/autoposterModuleFlag');
    expect(isSocialModuleEnabled()).toBe(true);
  });
});

describe('autoposterWorkerRegistry (Spec 27.5 drain-before-exit)', () => {
  it('reports no active workers when none are registered as running', () => {
    jest.resetModules();
    const { registerWorker, getActiveWorkers } = require('../../services/autoposterWorkerRegistry');
    registerWorker('test-worker-idle', () => false);
    expect(getActiveWorkers()).not.toContain('test-worker-idle');
  });

  it('reports a worker as active while its isRunning function returns true', () => {
    jest.resetModules();
    const { registerWorker, getActiveWorkers } = require('../../services/autoposterWorkerRegistry');
    registerWorker('test-worker-busy', () => true);
    expect(getActiveWorkers()).toContain('test-worker-busy');
  });

  it('waitForWorkersToFinish resolves immediately once the worker reports idle', async () => {
    jest.resetModules();
    const { registerWorker, waitForWorkersToFinish } = require('../../services/autoposterWorkerRegistry');
    let running = true;
    registerWorker('test-worker-timed', () => running);
    setTimeout(() => { running = false; }, 50);

    const result = await waitForWorkersToFinish(5000, 20);
    expect(result.drained).toBe(true);
  });

  it('waitForWorkersToFinish gives up at the cap and reports what is still active', async () => {
    jest.resetModules();
    const { registerWorker, waitForWorkersToFinish } = require('../../services/autoposterWorkerRegistry');
    registerWorker('test-worker-stuck', () => true);

    const result = await waitForWorkersToFinish(100, 20);
    expect(result.drained).toBe(false);
    expect(result.stillActive).toContain('test-worker-stuck');
  }, 10000);
});

describe('computeCleanRunWeeks (Spec 26.4: 4-week clean run)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('treats a platform with no failure-rate alert ever as clean for the full required window', async () => {
    jest.spyOn(AutoposterAuditLog, 'findOne').mockReturnValue({ sort: () => Promise.resolve(null) });
    const weeks = await computeCleanRunWeeks('facebook');
    expect(weeks).toBe(CLEAN_RUN_WEEKS_REQUIRED);
  });

  it('counts weeks since the most recent failure-rate alert', async () => {
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    jest.spyOn(AutoposterAuditLog, 'findOne').mockReturnValue({ sort: () => Promise.resolve({ createdAt: twoWeeksAgo }) });
    const weeks = await computeCleanRunWeeks('facebook');
    expect(weeks).toBe(2);
  });
});

describe('computeApprovalRatePercent (Spec 26.4: >90% admin approval)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns null (not zero, not a fabricated rate) when there is no real data yet', async () => {
    jest.spyOn(AutoposterDecision, 'find').mockReturnValue({ select: () => Promise.resolve([]) });
    const result = await computeApprovalRatePercent('facebook');
    expect(result.percent).toBe(null);
    expect(result.sampleSize).toBe(0);
  });

  it('computes the real approval rate from decided (non-pending) decisions', async () => {
    const decisions = [
      { approvalStatus: 'approved' }, { approvalStatus: 'approved' }, { approvalStatus: 'auto_published' },
      { approvalStatus: 'rejected' }
    ];
    jest.spyOn(AutoposterDecision, 'find').mockReturnValue({ select: () => Promise.resolve(decisions) });
    const result = await computeApprovalRatePercent('facebook');
    expect(result.percent).toBe(75);
    expect(result.sampleSize).toBe(4);
  });
});

describe('computeEngagementCoveragePercent (Spec 26.4: >0 engagement on >80% of posts)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns null with no published posts yet', async () => {
    jest.spyOn(AutoposterPostTarget, 'find').mockReturnValue({ select: () => Promise.resolve([]) });
    const result = await computeEngagementCoveragePercent('facebook');
    expect(result.percent).toBe(null);
  });

  it('computes the real % of posts with non-zero engagement', async () => {
    jest.spyOn(AutoposterPostTarget, 'find').mockReturnValue({ select: () => Promise.resolve([{ _id: 't1' }, { _id: 't2' }, { _id: 't3' }, { _id: 't4' }]) });
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({
      select: () => Promise.resolve([
        { postTarget: 't1', likes: 5, comments: 0, shares: 0, clicks: 0 },
        { postTarget: 't2', likes: 0, comments: 0, shares: 0, clicks: 0 },
        { postTarget: 't3', likes: 1, comments: 1, shares: 0, clicks: 0 }
        // t4 has no insight snapshot at all -> counts as zero engagement
      ])
    });
    const result = await computeEngagementCoveragePercent('facebook');
    expect(result.percent).toBe(50); // 2 of 4 posts have real non-zero engagement
    expect(result.sampleSize).toBe(4);
  });
});

describe('computeGraduationStatus — the hard gate (Spec 26.4 STOP AND CONFIRM)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('is never met when there is not enough real data, even if the clean-run criterion alone would pass (the only real state right now)', async () => {
    jest.spyOn(AutoposterAuditLog, 'findOne').mockReturnValue({ sort: () => Promise.resolve(null) }); // no failures ever -> clean run "passes"
    jest.spyOn(AutoposterDecision, 'find').mockReturnValue({ select: () => Promise.resolve([]) }); // no decision data
    jest.spyOn(AutoposterPostTarget, 'find').mockReturnValue({ select: () => Promise.resolve([]) }); // no published posts

    const status = await computeGraduationStatus('facebook');
    expect(status.cleanRunMet).toBe(true);
    expect(status.approvalRateMet).toBe(false);
    expect(status.engagementMet).toBe(false);
    expect(status.allCriteriaMet).toBe(false);
  });

  it('is met only when all three real criteria genuinely clear their thresholds', async () => {
    jest.spyOn(AutoposterAuditLog, 'findOne').mockReturnValue({ sort: () => Promise.resolve(null) });
    jest.spyOn(AutoposterDecision, 'find').mockReturnValue({
      select: () => Promise.resolve(Array.from({ length: 20 }, (_, i) => ({ approvalStatus: i < 19 ? 'approved' : 'rejected' }))) // 95%
    });
    jest.spyOn(AutoposterPostTarget, 'find').mockReturnValue({
      select: () => Promise.resolve(Array.from({ length: 10 }, (_, i) => ({ _id: `t${i}` })))
    });
    jest.spyOn(AutoposterInsight, 'find').mockReturnValue({
      select: () => Promise.resolve(Array.from({ length: 9 }, (_, i) => ({ postTarget: `t${i}`, likes: 1, comments: 0, shares: 0, clicks: 0 }))) // 9/10 = 90%
    });

    const status = await computeGraduationStatus('facebook');
    expect(status.allCriteriaMet).toBe(true);
  });
});
