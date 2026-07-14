const AutoposterPostTarget = require('../models/AutoposterPostTarget');
const AutoposterPost = require('../models/AutoposterPost');
const { AUTOPOSTER_POST_STATUS, AUTOPOSTER_TARGET_STATUS } = require('../config/constants');

// Pure decision logic, kept separate from the DB I/O below so it can be unit
// tested without a database connection (same pattern as validateCaptionLengths
// in routes/autoposter.js). Given the current post status and its targets'
// statuses, returns what the post status should become.
function computeNextPostStatus(currentStatus, targetStatuses) {
  if (currentStatus === AUTOPOSTER_POST_STATUS.CANCELLED) return currentStatus; // a cancelled post stays cancelled
  if (targetStatuses.length === 0) return currentStatus;

  const isDone = s => [AUTOPOSTER_TARGET_STATUS.PUBLISHED, AUTOPOSTER_TARGET_STATUS.FAILED, AUTOPOSTER_TARGET_STATUS.SKIPPED].includes(s);
  const allDone = targetStatuses.every(isDone);

  if (!allDone) {
    // Still waiting on a future scheduledFor unless something is actively
    // mid-publish, in which case reflect that on the post too.
    return targetStatuses.includes(AUTOPOSTER_TARGET_STATUS.PUBLISHING)
      ? AUTOPOSTER_POST_STATUS.PUBLISHING
      : currentStatus;
  }
  if (targetStatuses.every(s => s === AUTOPOSTER_TARGET_STATUS.PUBLISHED)) return AUTOPOSTER_POST_STATUS.PUBLISHED;
  if (targetStatuses.includes(AUTOPOSTER_TARGET_STATUS.PUBLISHED)) return AUTOPOSTER_POST_STATUS.PARTIAL;
  return AUTOPOSTER_POST_STATUS.FAILED;
}

// Recomputes and persists a post's overall status (Spec 4.2) from its
// targets' individual statuses (Spec 4.3). Called after any target changes.
async function rollupPostStatus(postId) {
  const post = await AutoposterPost.findById(postId);
  if (!post) return;

  const targets = await AutoposterPostTarget.find({ post: postId }).select('status');
  const nextStatus = computeNextPostStatus(post.status, targets.map(t => t.status));

  if (nextStatus !== post.status) {
    post.status = nextStatus;
    await post.save();
  }
}

module.exports = { rollupPostStatus, computeNextPostStatus };
