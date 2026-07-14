const mongoose = require('mongoose');

// Immutable record of all admin actions and adapter responses for compliance
// and debugging (Spec Section 4.5). Never dropped, even if the module is
// disabled or rolled back (Spec Section 24.3) — no updatedAt, no TTL index.
const autoposterAuditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true }, // 'connect_account', 'publish_attempt', ...
  entityType: String,
  entityId: String,
  payload: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false, versionKey: false });

autoposterAuditLogSchema.index({ action: 1, createdAt: -1 });
autoposterAuditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });

module.exports = mongoose.model('AutoposterAuditLog', autoposterAuditLogSchema);
