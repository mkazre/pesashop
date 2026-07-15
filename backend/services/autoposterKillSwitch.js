const Settings = require('../models/Settings');
const AutoposterAuditLog = require('../models/AutoposterAuditLog');

// Engine-wide kill switch (Spec Sections 10.11, 12.5). Persisted on the
// existing singleton Settings document — not an env var or in-memory flag —
// specifically so it survives a worker restart, per the spec's explicit
// requirement, and can be toggled from the admin UI at runtime. Shared
// between the composer (stops generating new content) and the publisher
// (stops actually posting trend-driven content) so both check the same flag.
async function isKillSwitchEngaged() {
  const settings = await Settings.getSettings();
  return !!settings.autoposter?.killSwitchEnabled;
}

async function setKillSwitch(enabled, actorId) {
  // A targeted update, not load-then-.save() — this singleton document has
  // legacy fields with bad types (e.g. a corrupted `createdAt`) that nothing
  // else trips over because every other settings route in this codebase
  // also uses findOneAndUpdate rather than full-document validation on save.
  const settings = await Settings.getSettings();
  await Settings.findByIdAndUpdate(settings._id, { $set: { 'autoposter.killSwitchEnabled': enabled } }, { runValidators: false });
  await AutoposterAuditLog.create({
    actor: actorId,
    action: enabled ? 'kill_switch_engaged' : 'kill_switch_released',
    entityType: 'Settings',
    entityId: 'autoposter'
  });
  return enabled;
}

module.exports = { isKillSwitchEngaged, setKillSwitch };
