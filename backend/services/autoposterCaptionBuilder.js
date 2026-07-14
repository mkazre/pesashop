// Resolves the effective caption for a target: its own override, falling back
// to the post's shared base caption, with hashtags appended (Spec Section 6.2).
// Shared across every adapter so caption resolution stays identical everywhere.
function buildCaption(target, post) {
  const base = target.captionOverride || post?.baseCaption || '';
  const hashtags = target.hashtags && target.hashtags.length > 0 ? target.hashtags : [];
  const hashtagString = hashtags.map((h) => `#${h.replace(/^#/, '')}`).join(' ');
  return hashtagString ? `${base}\n\n${hashtagString}` : base;
}

module.exports = { buildCaption };
