const axios = require('axios');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterDecision = require('../models/AutoposterDecision');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const emailService = require('./emailService');
const { getXUsagePercent } = require('./autoposterCostControl');
const { AUTOPOSTER_TARGET_STATUS, AUTOPOSTER_ACCOUNT_STATUS } = require('../config/constants');
const { socialLogger } = require('./autoposterLogger');
const log = socialLogger('alerts');

// Alert thresholds (Spec Section 17), each checked independently every run
// so one condition firing never suppresses the others.
const FAILURE_THRESHOLD_PER_HOUR = 5;
const APPROVAL_QUEUE_THRESHOLD = 50;
const X_USAGE_ALERT_PERCENT = 80;
const CHECK_WINDOW_MINUTES = 15; // matches the alerts cron's own schedule — each condition looks back exactly one tick

// Dispatches one alert via Slack (if SLACK_WEBHOOK_URL is configured) and
// email (if an admin address is configured), and always records it in the
// audit log regardless of whether either channel is actually configured —
// the audit log entry is the one channel that's never optional, so an
// alert's occurrence is always verifiable even with zero real channels set
// up (same honest degradation pattern as every other missing credential in
// this build).
async function dispatchAlert(type, message) {
  const results = { slack: null, email: null };

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await axios.post(webhookUrl, { text: `:rotating_light: *PesaShop Auto-Poster Alert*\n${message}` });
      results.slack = 'sent';
    } catch (error) {
      results.slack = `failed: ${error.message}`;
    }
  } else {
    results.slack = 'not configured (SLACK_WEBHOOK_URL unset)';
  }

  const emailResult = await emailService.sendAdminAlert(type, message);
  results.email = emailResult.sent ? 'sent' : `not sent (${emailResult.reason})`;

  await AutoposterAuditLog.create({
    action: 'alert_fired',
    entityType: 'AutoposterAlert',
    entityId: type,
    payload: { message, dispatch: results }
  });

  log.warn({ type, ...results }, message);
  return results;
}

// De-dupes by checking whether this exact alert type already fired within
// the check window — otherwise every 15-minute tick would re-fire the same
// still-true condition indefinitely.
async function alreadyFiredRecently(type) {
  const since = new Date(Date.now() - CHECK_WINDOW_MINUTES * 60 * 1000);
  const existing = await AutoposterAuditLog.findOne({ action: 'alert_fired', entityId: type, createdAt: { $gte: since } });
  return !!existing;
}

async function checkPlatformFailureRates() {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const results = await AutoposterPostTarget.aggregate([
    { $match: { status: AUTOPOSTER_TARGET_STATUS.FAILED, updatedAt: { $gte: since } } },
    { $group: { _id: '$platform', count: { $sum: 1 } } }
  ]);
  const fired = [];
  for (const r of results) {
    if (r.count > FAILURE_THRESHOLD_PER_HOUR) {
      const type = `platform_failures:${r._id}`;
      if (await alreadyFiredRecently(type)) continue;
      await dispatchAlert(type, `${r.count} publish failures on ${r._id} in the last hour (threshold: ${FAILURE_THRESHOLD_PER_HOUR}).`);
      fired.push(type);
    }
  }
  return fired;
}

async function checkNeedsReauthAccounts() {
  const since = new Date(Date.now() - CHECK_WINDOW_MINUTES * 60 * 1000);
  const accounts = await AutoposterAccount.find({ status: AUTOPOSTER_ACCOUNT_STATUS.NEEDS_REAUTH, updatedAt: { $gte: since } });
  const fired = [];
  for (const account of accounts) {
    const type = `needs_reauth:${account._id}`;
    if (await alreadyFiredRecently(type)) continue;
    await dispatchAlert(type, `Account "${account.displayName}" (${account.platform}) needs re-authentication. Dependent posts are paused until reconnected.`);
    fired.push(type);
  }
  return fired;
}

async function checkXUsage() {
  const { percent, count, cap } = await getXUsagePercent();
  if (percent <= X_USAGE_ALERT_PERCENT) return [];
  const type = 'x_usage_threshold';
  if (await alreadyFiredRecently(type)) return [];
  await dispatchAlert(type, `X API usage is at ${percent}% of the monthly cap (${count}/${cap} posts).`);
  return [type];
}

async function checkApprovalQueueDepth() {
  const depth = await AutoposterDecision.countDocuments({ approvalStatus: 'pending', variants: { $ne: [] } });
  if (depth <= APPROVAL_QUEUE_THRESHOLD) return [];
  const type = 'approval_queue_depth';
  if (await alreadyFiredRecently(type)) return [];
  await dispatchAlert(type, `The approval queue has ${depth} pending item(s), over the ${APPROVAL_QUEUE_THRESHOLD}-item threshold.`);
  return [type];
}

async function checkTrendIngestionFailures() {
  const since = new Date(Date.now() - CHECK_WINDOW_MINUTES * 60 * 1000);
  const failure = await AutoposterAuditLog.findOne({ action: 'trend_ingestion_primary_source_failed', createdAt: { $gte: since } });
  if (!failure) return [];
  const type = 'trend_ingestion_primary_source_failed';
  if (await alreadyFiredRecently(type)) return [];
  await dispatchAlert(type, 'The primary trend ingestion source (SerpAPI) failed on its most recent real attempt.');
  return [type];
}

async function runAlertChecks() {
  const fired = (await Promise.all([
    checkPlatformFailureRates(),
    checkNeedsReauthAccounts(),
    checkXUsage(),
    checkApprovalQueueDepth(),
    checkTrendIngestionFailures()
  ])).flat();
  return { fired };
}

module.exports = {
  runAlertChecks,
  checkPlatformFailureRates,
  checkNeedsReauthAccounts,
  checkXUsage,
  checkApprovalQueueDepth,
  checkTrendIngestionFailures,
  dispatchAlert,
  FAILURE_THRESHOLD_PER_HOUR,
  APPROVAL_QUEUE_THRESHOLD,
  X_USAGE_ALERT_PERCENT
};
