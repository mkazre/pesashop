// Phase 13 alerts — pure/mocked-DB logic only. Real Slack/email dispatch
// against real (missing) credentials was verified live instead.
jest.mock('axios');
const axios = require('axios');
const AutoposterPostTarget = require('../../models/AutoposterPostTarget');
const AutoposterAccount = require('../../models/AutoposterAccount');
const AutoposterDecision = require('../../models/AutoposterDecision');
const AutoposterAuditLog = require('../../models/AutoposterAuditLog');
const emailService = require('../../services/emailService');
const {
  checkPlatformFailureRates,
  checkNeedsReauthAccounts,
  checkXUsage,
  checkApprovalQueueDepth,
  checkTrendIngestionFailures,
  dispatchAlert,
  FAILURE_THRESHOLD_PER_HOUR,
  APPROVAL_QUEUE_THRESHOLD,
  X_USAGE_ALERT_PERCENT
} = require('../../services/autoposterAlerts');

describe('dispatchAlert', () => {
  const ORIGINAL_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
  afterEach(() => { process.env.SLACK_WEBHOOK_URL = ORIGINAL_WEBHOOK; jest.restoreAllMocks(); });

  it('records an audit log entry even when no Slack/email channel is configured (the only real state right now)', async () => {
    delete process.env.SLACK_WEBHOOK_URL;
    jest.spyOn(emailService, 'sendAdminAlert').mockResolvedValue({ sent: false, reason: 'no admin email configured' });
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    const results = await dispatchAlert('test_alert', 'Something happened');

    expect(results.slack).toMatch(/not configured/);
    expect(results.email).toMatch(/not sent/);
    expect(AutoposterAuditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'alert_fired', entityId: 'test_alert' })
    );
  });

  it('posts to the Slack webhook when configured', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.example/test';
    axios.post.mockResolvedValue({});
    jest.spyOn(emailService, 'sendAdminAlert').mockResolvedValue({ sent: true });
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});

    const results = await dispatchAlert('test_alert', 'Something happened');

    expect(axios.post).toHaveBeenCalledWith('https://hooks.slack.example/test', expect.objectContaining({ text: expect.stringContaining('Something happened') }));
    expect(results.slack).toBe('sent');
  });
});

describe('checkPlatformFailureRates (>5 failures in 1h on any platform)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fires when a platform exceeds the threshold and has not already fired recently', async () => {
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([{ _id: 'facebook', count: FAILURE_THRESHOLD_PER_HOUR + 1 }]);
    jest.spyOn(AutoposterAuditLog, 'findOne').mockResolvedValue(null); // not fired recently
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});
    jest.spyOn(emailService, 'sendAdminAlert').mockResolvedValue({ sent: false, reason: 'x' });

    const fired = await checkPlatformFailureRates();
    expect(fired).toEqual(['platform_failures:facebook']);
  });

  it('does not fire at or under the threshold', async () => {
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([{ _id: 'facebook', count: FAILURE_THRESHOLD_PER_HOUR }]);
    const fired = await checkPlatformFailureRates();
    expect(fired).toEqual([]);
  });

  it('does not re-fire if already fired within the check window', async () => {
    jest.spyOn(AutoposterPostTarget, 'aggregate').mockResolvedValue([{ _id: 'facebook', count: 999 }]);
    jest.spyOn(AutoposterAuditLog, 'findOne').mockResolvedValue({ _id: 'already-fired' });
    const fired = await checkPlatformFailureRates();
    expect(fired).toEqual([]);
  });
});

describe('checkNeedsReauthAccounts', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fires once per newly-needs_reauth account', async () => {
    jest.spyOn(AutoposterAccount, 'find').mockResolvedValue([{ _id: 'acc1', displayName: 'PesaShop FB', platform: 'facebook' }]);
    jest.spyOn(AutoposterAuditLog, 'findOne').mockResolvedValue(null);
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});
    jest.spyOn(emailService, 'sendAdminAlert').mockResolvedValue({ sent: false, reason: 'x' });

    const fired = await checkNeedsReauthAccounts();
    expect(fired).toEqual(['needs_reauth:acc1']);
  });
});

describe('checkXUsage (>80% of monthly cap)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fires when usage exceeds the alert threshold', async () => {
    jest.spyOn(AutoposterPostTarget, 'countDocuments').mockResolvedValue(2500); // with default cap 3000 -> 83.3%
    jest.spyOn(AutoposterAuditLog, 'findOne').mockResolvedValue(null);
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});
    jest.spyOn(emailService, 'sendAdminAlert').mockResolvedValue({ sent: false, reason: 'x' });

    const fired = await checkXUsage();
    expect(fired).toEqual(['x_usage_threshold']);
  });

  it('does not fire under the threshold', async () => {
    jest.spyOn(AutoposterPostTarget, 'countDocuments').mockResolvedValue(100);
    const fired = await checkXUsage();
    expect(fired).toEqual([]);
  });
});

describe('checkApprovalQueueDepth (>50 items)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fires when the queue is over threshold', async () => {
    jest.spyOn(AutoposterDecision, 'countDocuments').mockResolvedValue(APPROVAL_QUEUE_THRESHOLD + 1);
    jest.spyOn(AutoposterAuditLog, 'findOne').mockResolvedValue(null);
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});
    jest.spyOn(emailService, 'sendAdminAlert').mockResolvedValue({ sent: false, reason: 'x' });

    const fired = await checkApprovalQueueDepth();
    expect(fired).toEqual(['approval_queue_depth']);
  });

  it('does not fire at or under threshold', async () => {
    jest.spyOn(AutoposterDecision, 'countDocuments').mockResolvedValue(APPROVAL_QUEUE_THRESHOLD);
    const fired = await checkApprovalQueueDepth();
    expect(fired).toEqual([]);
  });
});

describe('checkTrendIngestionFailures (primary source)', () => {
  afterEach(() => jest.restoreAllMocks());

  it('fires when a recent primary-source-failed audit entry exists', async () => {
    jest.spyOn(AutoposterAuditLog, 'findOne')
      .mockResolvedValueOnce({ _id: 'failure-entry' }) // the failure lookup
      .mockResolvedValueOnce(null); // alreadyFiredRecently check
    jest.spyOn(AutoposterAuditLog, 'create').mockResolvedValue({});
    jest.spyOn(emailService, 'sendAdminAlert').mockResolvedValue({ sent: false, reason: 'x' });

    const fired = await checkTrendIngestionFailures();
    expect(fired).toEqual(['trend_ingestion_primary_source_failed']);
  });

  it('does not fire when no recent failure exists (the current real state)', async () => {
    jest.spyOn(AutoposterAuditLog, 'findOne').mockResolvedValue(null);
    const fired = await checkTrendIngestionFailures();
    expect(fired).toEqual([]);
  });
});
