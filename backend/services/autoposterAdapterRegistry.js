// Maps platform -> its real PlatformAdapter (Spec 2.2: publish/refreshToken/
// fetchInsights). Each adapter file also handles its own OAuth mechanics
// (Phase 2), so this registry is just a lookup table, not a new abstraction.
const REGISTRY = {
  facebook: require('./autoposterOAuthFacebook'),
  instagram: require('./autoposterOAuthInstagram'),
  x: require('./autoposterOAuthX'),
  linkedin: require('./autoposterOAuthLinkedIn'),
  tiktok: require('./autoposterOAuthTikTok')
};

function getAdapter(platform) {
  const adapter = REGISTRY[platform];
  if (!adapter) throw new Error(`No adapter registered for platform: ${platform}`);
  return adapter;
}

module.exports = { getAdapter };
