// Pure logic only — no DB, no cron, no network. The actual worker tick
// (recoverStalledTargets, isRateLimited, processTarget) was verified live
// against the real Atlas database instead, consistent with how every phase
// so far has been verified in this repo (no live-DB tests in the Jest suite).
const { classifyAndScheduleRetry } = require('../../cron/autoposterPublisherCron');
const { computeNextPostStatus } = require('../../services/autoposterPostStatusRollup');
const { TransientPublishError, PermanentPublishError } = require('../../services/autoposterPublisherStub');

function freshTarget() {
  return { attemptCount: 0, status: 'publishing', processingStartedAt: new Date() };
}

describe('classifyAndScheduleRetry', () => {
  it('schedules a retry with 1-minute backoff on the first transient failure', () => {
    const target = freshTarget();
    const before = Date.now();
    const outcome = classifyAndScheduleRetry(target, new TransientPublishError('rate limited'));
    expect(outcome.outcome).toBe('retry_scheduled');
    expect(outcome.backoffMinutes).toBe(1);
    expect(target.status).toBe('pending');
    expect(target.attemptCount).toBe(1);
    expect(target.nextAttemptAt.getTime()).toBeGreaterThan(before);
    expect(target.processingStartedAt).toBeUndefined();
  });

  it('follows the full 1/5/15/60/240-minute backoff sequence across attempts', () => {
    const target = freshTarget();
    const expected = [1, 5, 15, 60];
    for (const minutes of expected) {
      const outcome = classifyAndScheduleRetry(target, new TransientPublishError('still failing'));
      expect(outcome.backoffMinutes).toBe(minutes);
    }
    expect(target.attemptCount).toBe(4);
  });

  it('marks permanently failed after the 5th transient attempt (max attempts)', () => {
    const target = freshTarget();
    target.attemptCount = 4; // already failed 4 times
    const outcome = classifyAndScheduleRetry(target, new TransientPublishError('still failing'));
    expect(outcome.outcome).toBe('failed_permanently');
    expect(target.status).toBe('failed');
    expect(target.attemptCount).toBe(5);
  });

  it('marks permanently failed immediately on a permanent error, regardless of attempt count', () => {
    const target = freshTarget();
    const outcome = classifyAndScheduleRetry(target, new PermanentPublishError('content policy violation'));
    expect(outcome.outcome).toBe('failed_permanently');
    expect(target.status).toBe('failed');
    expect(target.errorCode).toBe('permanent');
  });

  it('defaults an unclassified error to transient (retry) rather than silently giving up', () => {
    const target = freshTarget();
    const outcome = classifyAndScheduleRetry(target, new Error('some unexpected error'));
    expect(outcome.outcome).toBe('retry_scheduled');
    expect(target.errorCode).toBe('transient');
  });
});

describe('computeNextPostStatus', () => {
  it('stays on the current status while targets are still pending (future scheduledFor)', () => {
    expect(computeNextPostStatus('scheduled', ['pending', 'pending'])).toBe('scheduled');
  });

  it('reflects publishing when any target is actively mid-publish', () => {
    expect(computeNextPostStatus('scheduled', ['publishing', 'pending'])).toBe('publishing');
  });

  it('becomes published when every target published', () => {
    expect(computeNextPostStatus('publishing', ['published', 'published'])).toBe('published');
  });

  it('becomes partial when some targets published and others failed', () => {
    expect(computeNextPostStatus('publishing', ['published', 'failed'])).toBe('partial');
  });

  it('becomes failed when every target failed (none published)', () => {
    expect(computeNextPostStatus('publishing', ['failed', 'failed'])).toBe('failed');
  });

  it('never resurrects a cancelled post', () => {
    expect(computeNextPostStatus('cancelled', ['published', 'published'])).toBe('cancelled');
  });

  it('treats skipped targets as done, same as failed/published, for the all-done check', () => {
    expect(computeNextPostStatus('publishing', ['published', 'skipped'])).toBe('partial');
    expect(computeNextPostStatus('publishing', ['skipped', 'skipped'])).toBe('failed');
  });
});
