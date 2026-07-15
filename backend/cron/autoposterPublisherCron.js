const cron = require('node-cron');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterPost = require('../models/AutoposterPost');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const { rollupPostStatus } = require('../services/autoposterPostStatusRollup');
const publisherStub = require('../services/autoposterPublisherStub');
const { getAdapter } = require('../services/autoposterAdapterRegistry');
const { isKillSwitchEngaged } = require('../services/autoposterKillSwitch');
const AutoposterEngineConfig = require('../models/AutoposterEngineConfig');
const {
  AUTOPOSTER_ACCOUNT_STATUS,
  AUTOPOSTER_TARGET_STATUS,
  AUTOPOSTER_RATE_LIMITS,
  AUTOPOSTER_RETRY_BACKOFF_MINUTES,
  AUTOPOSTER_MAX_ATTEMPTS,
  AUTOPOSTER_STALLED_THRESHOLD_MINUTES
} = require('../config/constants');

// The Mongo-native scheduling engine (Spec Section 8), replacing BullMQ+Redis
// per the Phase 0 decision. AutoposterPostTarget documents ARE the job queue —
// there's no separate broker, just a poll loop over their status/scheduledFor
// fields. Every 30 seconds comfortably clears the spec's "fires within 60
// seconds" acceptance criterion (Spec 19.2) with margin to spare.
const BATCH_SIZE = 20;
let isRunning = false; // same overlap guard as the existing visualSearchCron

// Stalled-job recovery (Mongo-native equivalent of BullMQ's stalled-job
// detection, Spec 8.2): a target stuck in 'publishing' past the threshold
// means the process almost certainly crashed mid-job. Reset it to 'pending'
// so the next tick picks it up again, rather than leaving it stranded forever.
async function recoverStalledTargets() {
  const cutoff = new Date(Date.now() - AUTOPOSTER_STALLED_THRESHOLD_MINUTES * 60 * 1000);
  const stalled = await AutoposterPostTarget.find({
    status: AUTOPOSTER_TARGET_STATUS.PUBLISHING,
    processingStartedAt: { $lte: cutoff }
  });

  for (const target of stalled) {
    target.status = AUTOPOSTER_TARGET_STATUS.PENDING;
    target.processingStartedAt = undefined;
    await target.save();
    await AutoposterAuditLog.create({
      action: 'stalled_job_recovered',
      entityType: 'AutoposterPostTarget',
      entityId: String(target._id),
      payload: { platform: target.platform }
    });
  }
  return stalled.length;
}

// Rate-limit gate (Spec 8.3): counts recent published targets for this
// (platform, account) instead of a Redis token bucket. Being at/over the
// limit delays the job — it stays 'pending' untouched — it does not fail it.
async function isRateLimited(platform, accountId) {
  const limit = AUTOPOSTER_RATE_LIMITS[platform];
  if (!limit) return false;
  const since = new Date(Date.now() - limit.windowHours * 60 * 60 * 1000);
  const count = await AutoposterPostTarget.countDocuments({
    account: accountId,
    status: AUTOPOSTER_TARGET_STATUS.PUBLISHED,
    publishedAt: { $gte: since }
  });
  return count >= limit.max;
}

// Admin-configured per-platform hourly cap (Spec 12.5), on top of the
// existing AUTOPOSTER_RATE_LIMITS window — null/unset means no additional
// cap, so behaviour is unchanged unless an admin sets one.
async function isOverConfiguredHourlyCap(platform) {
  const config = await AutoposterEngineConfig.getConfig();
  const platformConfig = config.platforms?.get ? config.platforms.get(platform) : config.platforms?.[platform];
  const hourlyCap = platformConfig?.hourlyCap;
  if (!hourlyCap) return false;
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await AutoposterPostTarget.countDocuments({
    platform,
    status: AUTOPOSTER_TARGET_STATUS.PUBLISHED,
    publishedAt: { $gte: since }
  });
  return count >= hourlyCap;
}

// Classifies a publish failure and either schedules a backoff retry or marks
// the target permanently failed (Spec 8.2). Unclassified errors default to
// transient — safer to retry an unknown failure than to silently give up.
function classifyAndScheduleRetry(target, error) {
  target.attemptCount += 1;
  const isTransient = error?.transient !== false;
  target.errorCode = isTransient ? 'transient' : 'permanent';
  target.errorMessage = error?.message || 'Unknown publish error';

  if (isTransient && target.attemptCount < AUTOPOSTER_MAX_ATTEMPTS) {
    const backoffMinutes = AUTOPOSTER_RETRY_BACKOFF_MINUTES[target.attemptCount - 1]
      ?? AUTOPOSTER_RETRY_BACKOFF_MINUTES[AUTOPOSTER_RETRY_BACKOFF_MINUTES.length - 1];
    target.status = AUTOPOSTER_TARGET_STATUS.PENDING;
    target.nextAttemptAt = new Date(Date.now() + backoffMinutes * 60 * 1000);
    target.processingStartedAt = undefined;
    return { outcome: 'retry_scheduled', backoffMinutes };
  }

  target.status = AUTOPOSTER_TARGET_STATUS.FAILED;
  target.processingStartedAt = undefined;
  return { outcome: 'failed_permanently' };
}

async function processTarget(target) {
  const account = await AutoposterAccount.findById(target.account);
  const post = await AutoposterPost.findById(target.post);

  // Kill switch (Spec 10.11) pauses trend-driven publishing specifically —
  // manually composed posts and product auto-posts are left alone, since
  // the admin explicitly created those themselves rather than the trend
  // engine picking them autonomously.
  if (post?.source === 'trend' && (await isKillSwitchEngaged())) {
    return 'kill_switch_engaged'; // left pending, untouched — resumes automatically once released
  }

  const engineConfig = await AutoposterEngineConfig.getConfig();
  const platformConfig = engineConfig.platforms?.get ? engineConfig.platforms.get(target.platform) : engineConfig.platforms?.[target.platform];
  if (platformConfig?.enabled === false) {
    return 'platform_disabled'; // left pending, untouched — Spec 12.5's per-platform master ON/OFF
  }
  if (await isOverConfiguredHourlyCap(target.platform)) {
    return 'hourly_cap_reached'; // left pending, untouched — retried next tick once the hour rolls over
  }

  if (!account || account.status !== AUTOPOSTER_ACCOUNT_STATUS.ACTIVE) {
    target.status = AUTOPOSTER_TARGET_STATUS.FAILED;
    target.errorCode = 'account_unavailable';
    target.errorMessage = account ? `Account status is "${account.status}", not active` : 'Account no longer exists';
    target.processingStartedAt = undefined;
    await target.save();
    await rollupPostStatus(target.post);
    return 'account_unavailable';
  }

  if (await isRateLimited(target.platform, target.account)) {
    return 'rate_limited'; // left pending, untouched — retried next tick
  }

  target.status = AUTOPOSTER_TARGET_STATUS.PUBLISHING;
  target.processingStartedAt = new Date();
  await target.save();

  try {
    // AUTOPOSTER_DRY_RUN=true uses the Phase 4 stub (including its
    // FORCE_TRANSIENT_FAIL/FORCE_PERMANENT_FAIL test markers) instead of
    // calling a real platform — for local testing without needing real,
    // approved developer-app credentials. Real adapters (Phase 5) are the
    // default path otherwise.
    const result = process.env.AUTOPOSTER_DRY_RUN === 'true'
      ? await publisherStub.publish(target.platform, target, account, post)
      : await getAdapter(target.platform).publish(target, account, post);
    target.status = AUTOPOSTER_TARGET_STATUS.PUBLISHED;
    target.externalPostId = result.externalPostId;
    target.externalUrl = result.externalUrl;
    target.publishedAt = new Date();
    target.processingStartedAt = undefined;
    await target.save();

    await AutoposterAuditLog.create({
      action: 'publish_success',
      entityType: 'AutoposterPostTarget',
      entityId: String(target._id),
      payload: { platform: target.platform, externalPostId: result.externalPostId }
    });

    await rollupPostStatus(target.post);
    return 'published';
  } catch (error) {
    const outcome = classifyAndScheduleRetry(target, error);
    await target.save();

    await AutoposterAuditLog.create({
      action: outcome.outcome === 'retry_scheduled' ? 'publish_retry_scheduled' : 'publish_failed',
      entityType: 'AutoposterPostTarget',
      entityId: String(target._id),
      payload: { platform: target.platform, attemptCount: target.attemptCount, error: error.message, ...outcome }
    });

    await rollupPostStatus(target.post);
    return outcome.outcome;
  }
}

async function runPublisherTick() {
  const recovered = await recoverStalledTargets();

  const now = new Date();
  const dueTargets = await AutoposterPostTarget.find({
    status: AUTOPOSTER_TARGET_STATUS.PENDING,
    scheduledFor: { $lte: now },
    $or: [{ nextAttemptAt: { $exists: false } }, { nextAttemptAt: null }, { nextAttemptAt: { $lte: now } }]
  }).sort({ scheduledFor: 1 }).limit(BATCH_SIZE);

  for (const target of dueTargets) {
    await processTarget(target);
  }

  return { recovered, processed: dueTargets.length };
}

function initAutoposterPublisherCron() {
  cron.schedule('*/30 * * * * *', async () => {
    if (isRunning) return;
    isRunning = true;
    try {
      const { recovered, processed } = await runPublisherTick();
      if (recovered > 0) console.log(`[autoposter] publisher: recovered ${recovered} stalled target(s)`);
      if (processed > 0) console.log(`[autoposter] publisher: processed ${processed} target(s)`);
    } catch (e) {
      console.error('[autoposter] publisher cron error:', e.message);
    } finally {
      isRunning = false;
    }
  });

  console.log('✅ Autoposter publisher cron initialized (every 30s)');
}

module.exports = {
  initAutoposterPublisherCron,
  runPublisherTick,
  recoverStalledTargets,
  isRateLimited,
  isOverConfiguredHourlyCap,
  classifyAndScheduleRetry
};
