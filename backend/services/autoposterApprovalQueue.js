const AutoposterDecision = require('../models/AutoposterDecision');
const AutoposterPost = require('../models/AutoposterPost');
const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterAccount = require('../models/AutoposterAccount');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');
const { generateCaptionVariants } = require('./autoposterCaptionComposer');
const { checkCaptionSafety } = require('./autoposterCaptionSafetyCheck');
const { isKillSwitchEngaged, setKillSwitch } = require('./autoposterKillSwitch');
const AutoposterEngineConfig = require('../models/AutoposterEngineConfig');
const {
  AUTOPOSTER_APPROVAL_STATUS,
  AUTOPOSTER_ACCOUNT_STATUS,
  AUTOPOSTER_POST_STATUS,
  AUTOPOSTER_SENSITIVITY
} = require('../config/constants');

// Creates the real AutoposterPost + AutoposterPostTarget for a decision —
// shared by both the human approval path and the per-platform auto-publish
// path (Spec 12.5's "auto-publish vs approval-required" toggle), so both
// connect to the existing Phase 4/5 scheduling/publishing pipeline the same
// way. Returns null if no active account exists for the platform.
async function createPostFromDecision(decision, caption, createdBy) {
  const account = await AutoposterAccount.findOne({ platform: decision.platform, status: AUTOPOSTER_ACCOUNT_STATUS.ACTIVE });
  if (!account) return null;

  const post = await AutoposterPost.create({
    title: `Trend: ${decision.trend.term}`,
    baseCaption: caption,
    linkUrl: `${process.env.FRONTEND_URL || 'https://pesashop.com'}/product/${decision.product.slug}`,
    source: 'trend',
    sourceRef: String(decision.product._id),
    status: AUTOPOSTER_POST_STATUS.SCHEDULED,
    scheduledFor: new Date(),
    createdBy
  });
  await AutoposterPostTarget.create({ post: post._id, account: account._id, platform: decision.platform, scheduledFor: new Date() });
  return post;
}

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
  const engineConfig = await AutoposterEngineConfig.getConfig();

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
    if (firstSafeIndex === -1) {
      decision.approvalStatus = AUTOPOSTER_APPROVAL_STATUS.REJECTED;
    } else {
      // Per-platform "auto-publish vs approval-required" (Spec 12.5) — only
      // reachable for a decision that already passed the safety check above;
      // defaults to false (every decision waits for a human), unchanged
      // from Phase 10 behaviour unless an admin opts a platform in.
      const platformConfig = engineConfig.platforms?.get ? engineConfig.platforms.get(decision.platform) : engineConfig.platforms?.[decision.platform];
      if (platformConfig?.autoPublish) {
        const post = await createPostFromDecision(decision, variants[firstSafeIndex]);
        if (post) {
          decision.approvalStatus = AUTOPOSTER_APPROVAL_STATUS.AUTO_PUBLISHED;
          decision.actedAt = new Date();
          await AutoposterAuditLog.create({
            action: 'trend_decision_auto_published',
            entityType: 'AutoposterDecision',
            entityId: String(decision._id),
            payload: { postId: String(post._id), platform: decision.platform }
          });
        }
        // No active account yet: leave it pending in the human queue rather
        // than silently dropping it — same "don't crash, degrade gracefully"
        // pattern as every other missing-credential path in this module.
      }
    }

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

  const caption = editedCaption || decision.variants[decision.chosenVariant ?? 0];
  if (editedCaption) {
    const safety = await checkCaptionSafety(editedCaption);
    if (!safety.safe) {
      const err = new Error(`Edited caption failed the safety check: ${safety.reason}`);
      err.statusCode = 400;
      throw err;
    }
  }

  const post = await createPostFromDecision(decision, caption, adminId);
  if (!post) {
    const err = new Error(`No active connected ${decision.platform} account to publish to`);
    err.statusCode = 400;
    throw err;
  }

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

// Bulk actions (Spec 12.2): "approve all under one platform", "reject all
// from one trend". Each item is approved/rejected independently — one
// failure (e.g. no active account for that platform) doesn't abort the rest,
// it's just reported back per-decision.
async function bulkApproveByPlatform(platform, adminId) {
  const decisions = await AutoposterDecision.find({
    platform,
    approvalStatus: AUTOPOSTER_APPROVAL_STATUS.PENDING,
    variants: { $ne: [] }
  });
  const results = [];
  for (const decision of decisions) {
    try {
      await approveDecision(decision._id, adminId);
      results.push({ decisionId: String(decision._id), ok: true });
    } catch (error) {
      results.push({ decisionId: String(decision._id), ok: false, error: error.message });
    }
  }
  return results;
}

async function bulkRejectByTrend(trendId, adminId, { reason } = {}) {
  const decisions = await AutoposterDecision.find({
    trend: trendId,
    approvalStatus: AUTOPOSTER_APPROVAL_STATUS.PENDING,
    variants: { $ne: [] }
  });
  const results = [];
  for (const decision of decisions) {
    try {
      await rejectDecision(decision._id, adminId, { reason });
      results.push({ decisionId: String(decision._id), ok: true });
    } catch (error) {
      results.push({ decisionId: String(decision._id), ok: false, error: error.message });
    }
  }
  return results;
}

module.exports = {
  isKillSwitchEngaged,
  setKillSwitch,
  composeOutstandingDecisions,
  listApprovalQueue,
  approveDecision,
  rejectDecision,
  snoozeDecision,
  bulkApproveByPlatform,
  bulkRejectByTrend
};
