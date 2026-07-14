// Phase 4 stand-in for the real Phase 5 platform adapters (Spec Section 2.2's
// PlatformAdapter interface: publish/refreshToken/fetchInsights). Never calls
// a real API — logs what it would have sent and returns a fake success, so
// the scheduling engine can be built and proven correct before any adapter
// exists. Replace this file's role (not necessarily the file itself) once
// real adapters land — the worker only depends on the publish() shape below.

class TransientPublishError extends Error {
  constructor(message) {
    super(message);
    this.transient = true;
  }
}

class PermanentPublishError extends Error {
  constructor(message) {
    super(message);
    this.transient = false;
  }
}

// Test-only failure simulation, so retry/backoff/permanent-failure logic can
// be exercised against something without a real adapter to call. Trigger by
// putting these exact markers in a post's `title` (never in the caption, so
// it can never leak into a real publish). Remove this block in Phase 5.
async function publish(platform, target, account, post) {
  if (post?.title?.includes('FORCE_TRANSIENT_FAIL')) {
    throw new TransientPublishError('Simulated transient failure (e.g. rate limit or 5xx) — test marker in post title');
  }
  if (post?.title?.includes('FORCE_PERMANENT_FAIL')) {
    throw new PermanentPublishError('Simulated permanent failure (e.g. validation or content policy) — test marker in post title');
  }

  const caption = target.captionOverride || post?.baseCaption || '';
  console.log(`[autoposter] STUB publish -> ${platform} / ${account.displayName}: "${caption.slice(0, 80)}"`);

  return {
    externalPostId: `stub-${platform}-${Date.now()}`,
    externalUrl: null
  };
}

module.exports = { publish, TransientPublishError, PermanentPublishError };
