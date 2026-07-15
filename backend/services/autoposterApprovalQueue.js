const AutoposterDecision = require('../models/AutoposterDecision');
const AutoposterPost = require('../models/AutoposterPost');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const { generateCaptionVariants } = require('./autoposterCaptionComposer');
const { checkCaptionSafety } = require('./autoposterCaptionSafetyCheck');
const { isKillSwitchEngaged, setKillSwitch } = require('./autoposterKillSwitch');
const {
  AUTOPOSTER_APPROVAL_STATUS,
  AUTOPOSTER_ACCOUNT_STATUS,
  AUTOPOSTER_POST_STATUS,
  AUTOPOSTER_SENSITIVITY
} = require('../config/constants');

// Human-in-the-Loop Approval Queue (Spec Section 10.11). The kill switch
// itself lives in autoposterKillSwitch.js (shared with the publisher cron,
// which also needs to check it — see that file for why it's a persisted
// Settings field rather than an env var or in-memory flag).

// Generates captions + runs the caption-level safety check (layer 2) for
// every selected decision that doesn't have variants yet. Scoped to a
// specific run if given, otherwise processes every outstanding decision —
// this is what the composer cron calls on its own schedule.
async function composeOutstandingDecisions({ runId } = {}) {
  if (await isKillSwitchEngaged()) {
    console.log('[autoposter-composer] kill switch engaged — skipping composition');
    return { composed: 0, killSwitchEngaged: true };
  }

  const query = { selected: true, variants: { $size: 0 }, approvalStatus: AUTOPOSTER_APPROVAL_STATUS.PENDING };
  if (runId) query.runId = runId;

  const decisions = await AutoposterDecision.find(query).populate('trend').populate('product');

  let composed = 0;
  for (const decision of decisions) {
    if (!decision.trend || !decision.product) continue; // referenced doc deleted since the decision was recorded

    const variants = await generateCaptionVariants({ trend: decision.trend, product: decision.product, platform: decision.platform });
    const safetyResults = await Promise.all(variants.map((v) => checkCaptionSafety(v)));
    const firstSafeIndex = safetyResults.findIndex((r) => r.safe);

    decision.variants = variants;
    decision.chosenVariant = firstSafeIndex !== -1 ? firstSafeIndex : undefined;
    decision.safetyPassed = firstSafeIndex !== -1;
    decision.safetyReason = firstSafeIndex !== -1 ? safetyResults[firstSafeIndex].reason : safetyResults.map((r) => r.reason).join('; ');
    // A candidate with no safe variant at all never reaches a human — it's
    // auto-rejected right here, consistent with "never auto-publish
    // high-risk" (Spec 18's risk table).
    if (firstSafeIndex === -1) decision.approvalStatus = AUTOPOSTER_APPROVAL_STATUS.REJECTED;

    await decision.save();
    composed++;
  }

  return { composed, killSwitchEngaged: false };
}

async function listApprovalQueue() {
  return AutoposterDecision.find({
    approvalStatus: AUTOPOSTER_APPROVAL_STATUS.PENDING,
    variants: { $ne: [] },
    $or: [{ snoozedUntil: { $exists: false } }, { snoozedUntil: null }, { snoozedUntil: { $lte: new Date() } }]
  })
    .populate('trend', 'term trendScore')
    .populate('product', 'name slug featuredImage regularPrice salePrice')
    .sort({ weight: -1 });
}

// Approve: creates the real AutoposterPost + AutoposterPostTarget, which
// then flows through the existing Phase 4 scheduling engine and Phase 5
// real adapters — this is the point where the whole trend-engine pipeline
// actually connects to publishing.
async function approveDecision(decisionId, adminId, { editedCaption } = {}) {
  if (await isKillSwitchEngaged()) {
    const err = new Error('The auto-poster kill switch is engaged — re-enable the engine before approving anything');
    err.statusCode = 400;
    throw err;
  }

  const decision = await AutoposterDecision.findById(decisionId).populate('trend').populate('product');
  if (!decision) throw new Error('Decision not found');
  if (decision.approvalStatus !== AUTOPOSTER_APPROVAL_STATUS.PENDING) {
    const err = new Error(`Cannot approve a decision with status "${decision.approvalStatus}"`);
    err.statusCode = 400;
    throw err;
  }

  const account = await AutoposterAccount.findOne({ platform: decision.platform, status: AUTOPOSTER_ACCOUNT_STATUS.ACTIVE });
  if (!account) {
    const err = new Error(`No active connected ${decision.platform} account to publish to`);
    err.statusCode = 400;
    throw err;
  }

  const caption = editedCaption || decision.variants[decision.chosenVariant ?? 0];
  if (editedCaption) {
    const safety = await checkCaptionSafety(editedCaption);
    if (!safety.safe) {
      const err = new Error(`Edited caption failed the safety check: ${safety.reason}`);
      err.statusCode = 400;
      throw err;
    }
  }

  const post = await AutoposterPost.create({
    title: `Trend: ${decision.trend.term}`,
    baseCaption: caption,
    linkUrl: `${process.env.FRONTEND_URL || 'https://pesashop.com'}/product/${decision.product.slug}`,
    source: 'trend',
    sourceRef: String(decision.product._id),
    status: AUTOPOSTER_POST_STATUS.SCHEDULED,
    scheduledFor: new Date(),
    createdBy: adminId
  });
  await AutoposterPostTarget.create({ post: post._id, account: account._id, platform: decision.platform, scheduledFor: new Date() });

  decision.approvalStatus = AUTOPOSTER_APPROVAL_STATUS.APPROVED;
  decision.approvalActor = adminId;
  decision.actedAt = new Date();
  if (editedCaption) decision.variants.push(editedCaption);
  await decision.save();

  await AutoposterAuditLog.create({
    actor: adminId,
    action: 'trend_decision_approved',
    entityType: 'AutoposterDecision',
    entityId: String(decision._id),
    payload: { postId: String(post._id), platform: decision.platform, edited: !!editedCaption }
  });

  return { decision, post };
}

async function rejectDecision(decisionId, adminId, { reason, banTrend = false } = {}) {
  const decision = await AutoposterDecision.findById(decisionId).populate('trend');
  if (!decision) throw new Error('Decision not found');

  decision.approvalStatus = AUTOPOSTER_APPROVAL_STATUS.REJECTED;
  decision.approvalActor = adminId;
  decision.actedAt = new Date();
  if (reason) decision.safetyReason = reason;
  await decision.save();

  if (banTrend && decision.trend) {
    decision.trend.sensitivityFlag = AUTOPOSTER_SENSITIVITY.BLOCKED;
    decision.trend.blocklistReason = `Rejected and banned via approval queue: ${reason || 'no reason given'}`;
    await decision.trend.save();
  }

  await AutoposterAuditLog.create({
    actor: adminId,
    action: 'trend_decision_rejected',
    entityType: 'AutoposterDecision',
    entityId: String(decision._id),
    payload: { reason, banTrend }
  });

  return decision;
}

async function snoozeDecision(decisionId, minutes = 60) {
  const decision = await AutoposterDecision.findById(decisionId);
  if (!decision) throw new Error('Decision not found');
  decision.snoozedUntil = new Date(Date.now() + minutes * 60 * 1000);
  await decision.save();
  return decision;
}

module.exports = {
  isKillSwitchEngaged,
  setKillSwitch,
  composeOutstandingDecisions,
  listApprovalQueue,
  approveDecision,
  rejectDecision,
  snoozeDecision
};
