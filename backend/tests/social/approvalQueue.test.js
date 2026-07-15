// Pure/mocked-DB logic only. The real end-to-end flow (compose a real
// decision's captions, approve it, watch it flow through the Phase 4/5
// publisher pipeline) was verified live against the real database instead —
// consistent with this repo's testing convention (see trendEngine.test.js).
const {
  checkCaptionSafety,
  checkCaptionAgainstBlocklist,
  checkCaptionWithLLM
} = require('../../services/autoposterCaptionSafetyCheck');
const AutoposterBlocklistTerm = require('../../models/AutoposterBlocklistTerm');

describe('checkCaptionAgainstBlocklist (brand safety, layer 2 of 3 — Spec 10.10)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('flags a caption containing an exact blocklisted term, case-insensitively', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'exact', term: 'sanctions', reason: 'politically charged' }]);
    const result = await checkCaptionAgainstBlocklist('Beat the new US Sanctions with this deal!');
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/sanctions/i);
  });

  it('flags a caption matching a regex blocklist entry', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'regex', term: 'fuel\\s*queue', reason: 'fuel shortage' }]);
    const result = await checkCaptionAgainstBlocklist('No more fuel queue stress with our delivery');
    expect(result.safe).toBe(false);
  });

  it('does not crash on an admin-entered invalid regex, and does not flag', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'regex', term: '(unclosed', reason: 'broken' }]);
    const result = await checkCaptionAgainstBlocklist('anything at all');
    expect(result.safe).toBe(true);
  });

  it('passes a clean caption', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'exact', term: 'sanctions', reason: 'x' }]);
    const result = await checkCaptionAgainstBlocklist('Back to school shoes, now on sale');
    expect(result.safe).toBe(true);
  });
});

describe('checkCaptionWithLLM (brand safety, degrades gracefully without ANTHROPIC_API_KEY)', () => {
  const originalKey = process.env.ANTHROPIC_API_KEY;
  afterEach(() => { process.env.ANTHROPIC_API_KEY = originalKey; jest.restoreAllMocks(); });

  it('treats the LLM layer as not-checked (but safe) when no API key is configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    const result = await checkCaptionWithLLM('anything');
    expect(result.checked).toBe(false);
    expect(result.safe).toBe(true);
  });
});

describe('checkCaptionSafety (combined layer 2 — static blocklist is final, LLM only restricts)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('rejects on a blocklist hit without ever calling the LLM layer', async () => {
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([{ type: 'exact', term: 'zesa', reason: 'power cuts' }]);
    const result = await checkCaptionSafety('No ZESA load-shedding will stop this sale');
    expect(result.safe).toBe(false);
    expect(result.reason).toMatch(/zesa/i);
  });

  it('passes a clean caption through both layers when no LLM key is configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    jest.spyOn(AutoposterBlocklistTerm, 'find').mockResolvedValue([]);
    const result = await checkCaptionSafety('Fresh back-to-school deals, shop now');
    expect(result.safe).toBe(true);
  });
});

describe('autoposterKillSwitch', () => {
  const Settings = require('../../models/Settings');
  const AutoposterAuditLog = require('../../models/AutoposterAuditLog');
  const { isKillSwitchEngaged, setKillSwitch } = require('../../services/autoposterKillSwitch');

  afterEach(() => jest.restoreAllMocks());

  it('isKillSwitchEngaged reads the persisted Settings flag, defaulting to false when unset', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: undefined });
    expect(await isKillSwitchEngaged()).toBe(false);

    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: { killSwitchEnabled: true } });
    expect(await isKillSwitchEngaged()).toBe(true);
  });

  it('setKillSwitch persists the flag via a targeted update and writes an audit log entry', async () => {
    // A targeted findByIdAndUpdate, not load-then-.save() — this singleton
    // Settings document has legacy fields with corrupted types (e.g. a
    // createdAt stored as {} in production) that a full-document .save()
    // trips over but every other settings route in this codebase avoids by
    // using findOneAndUpdate/findByIdAndUpdate instead.
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ _id: 'settings-1', autoposter: { killSwitchEnabled: false } });
    jest.spyOn(Settings, 'findByIdAndUpdate').mockResolvedValue({});
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    const result = await setKillSwitch(true, 'admin-1');

    expect(result).toBe(true);
    expect(Settings.findByIdAndUpdate).toHaveBeenCalledWith(
      'settings-1',
      { $set: { 'autoposter.killSwitchEnabled': true } },
      { runValidators: false }
    );
    expect(AutoposterAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ actor: 'admin-1', action: 'kill_switch_engaged' })
    );
  });

  it('setKillSwitch(false, ...) logs a kill_switch_released action', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ _id: 'settings-1', autoposter: { killSwitchEnabled: true } });
    jest.spyOn(Settings, 'findByIdAndUpdate').mockResolvedValue({});
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    await setKillSwitch(false, 'admin-1');

    expect(AutoposterAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'kill_switch_released' })
    );
  });
});

describe('autoposterApprovalQueue', () => {
  const AutoposterDecision = require('../../models/AutoposterDecision');
  const AutoposterAccount = require('../../models/AutoposterAccount');
  const AutoposterPost = require('../../models/AutoposterPost');
  const AutoposterPostTarget = require('../../models/AutoposterPostTarget');
  const AutoposterAuditLog = require('../../models/AutoposterAuditLog');
  const Settings = require('../../models/Settings');
  const { approveDecision, rejectDecision, snoozeDecision } = require('../../services/autoposterApprovalQueue');

  afterEach(() => jest.restoreAllMocks());

  it('approveDecision refuses when the kill switch is engaged', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: { killSwitchEnabled: true } });
    await expect(approveDecision('decision-1', 'admin-1')).rejects.toThrow(/kill switch/i);
  });

  it('approveDecision refuses a decision that is not pending', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: { killSwitchEnabled: false } });
    const decision = { approvalStatus: 'approved' };
    const chain = { populate: jest.fn() };
    chain.populate.mockImplementation(() => chain);
    chain.then = (resolve) => resolve(decision);
    jest.spyOn(AutoposterDecision, 'findById').mockReturnValue(chain);

    await expect(approveDecision('decision-1', 'admin-1')).rejects.toThrow(/Cannot approve/);
  });

  it('approveDecision refuses when no active account exists for the platform', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: { killSwitchEnabled: false } });
    const decision = {
      approvalStatus: 'pending',
      platform: 'facebook',
      variants: ['Caption A'],
      trend: { term: 'Back to school' },
      product: { _id: 'prod-1', slug: 'some-product' }
    };
    const chain = { populate: jest.fn() };
    chain.populate.mockImplementation(() => chain);
    chain.then = (resolve) => resolve(decision);
    jest.spyOn(AutoposterDecision, 'findById').mockReturnValue(chain);
    jest.spyOn(AutoposterAccount, 'findOne').mockResolvedValue(null);

    await expect(approveDecision('decision-1', 'admin-1')).rejects.toThrow(/No active connected/);
  });

  it('approveDecision creates a real AutoposterPost + AutoposterPostTarget and marks the decision approved', async () => {
    jest.spyOn(Settings, 'getSettings').mockResolvedValue({ autoposter: { killSwitchEnabled: false } });
    const decision = {
      _id: 'decision-1',
      approvalStatus: 'pending',
      platform: 'facebook',
      variants: ['Caption A'],
      chosenVariant: 0,
      trend: { term: 'Back to school' },
      product: { _id: 'prod-1', slug: 'some-product' },
      save: jest.fn().mockResolvedValue(undefined)
    };
    const chain = { populate: jest.fn() };
    chain.populate.mockImplementation(() => chain);
    chain.then = (resolve) => resolve(decision);
    jest.spyOn(AutoposterDecision, 'findById').mockReturnValue(chain);
    jest.spyOn(AutoposterAccount, 'findOne').mockResolvedValue({ _id: 'account-1' });
    jest.spyOn(AutoposterPost, 'create').mockResolvedValue({ _id: 'post-1' });
    jest.spyOn(AutoposterPostTarget, 'create').mockResolvedValue({ _id: 'target-1' });
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    const { decision: updated, post } = await approveDecision('decision-1', 'admin-1');

    expect(AutoposterPost.create).toHaveBeenCalledWith(expect.objectContaining({ baseCaption: 'Caption A', source: 'trend' }));
    expect(AutoposterPostTarget.create).toHaveBeenCalledWith(expect.objectContaining({ post: 'post-1', account: 'account-1', platform: 'facebook' }));
    expect(updated.approvalStatus).toBe('approved');
    expect(post._id).toBe('post-1');
    expect(AutoposterAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'trend_decision_approved' }));
  });

  it('rejectDecision marks the decision rejected and optionally bans the trend', async () => {
    const trend = { sensitivityFlag: 'safe', save: jest.fn().mockResolvedValue(undefined) };
    const decision = { approvalStatus: 'pending', trend, save: jest.fn().mockResolvedValue(undefined) };
    const chain = { populate: jest.fn() };
    chain.populate.mockImplementation(() => chain);
    chain.then = (resolve) => resolve(decision);
    jest.spyOn(AutoposterDecision, 'findById').mockReturnValue(chain);
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    await rejectDecision('decision-1', 'admin-1', { reason: 'not on-brand', banTrend: true });

    expect(decision.approvalStatus).toBe('rejected');
    expect(trend.sensitivityFlag).toBe('blocked');
    expect(AutoposterAuditLog.create).toHaveBeenCalledWith(expect.objectContaining({ action: 'trend_decision_rejected' }));
  });

  it('snoozeDecision sets snoozedUntil in the future by the given number of minutes', async () => {
    const decision = { save: jest.fn().mockResolvedValue(undefined) };
    jest.spyOn(AutoposterDecision, 'findById').mockResolvedValue(decision);

    const before = Date.now();
    await snoozeDecision('decision-1', 30);
    const after = Date.now();

    expect(decision.snoozedUntil.getTime()).toBeGreaterThanOrEqual(before + 30 * 60 * 1000 - 1000);
    expect(decision.snoozedUntil.getTime()).toBeLessThanOrEqual(after + 30 * 60 * 1000 + 1000);
    expect(decision.save).toHaveBeenCalled();
  });
});
