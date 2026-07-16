// Feature flag (Spec Section 24.3): "SOCIAL_MODULE_ENABLED toggles all
// routes and workers without requiring schema rollback. Use this for fast
// disable in production incidents." Defaults to enabled — an admin who
// never sets this env var sees no behaviour change, same pattern as every
// other optional config in this build.
function isSocialModuleEnabled() {
  return process.env.SOCIAL_MODULE_ENABLED !== 'false';
}

module.exports = { isSocialModuleEnabled };
