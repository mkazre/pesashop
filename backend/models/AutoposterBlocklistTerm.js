const mongoose = require('mongoose');
const { AUTOPOSTER_BLOCKLIST_TYPES } = require('../config/constants');

// Brand-safety blocklist, layer 1 of 3 (Spec Sections 10.10, 11.5). Maintained
// by admin and reviewable in the UI.
const autoposterBlocklistTermSchema = new mongoose.Schema({
  term: { type: String, required: true }, // exact string or regex source
  type: {
    type: String,
    enum: Object.values(AUTOPOSTER_BLOCKLIST_TYPES),
    default: AUTOPOSTER_BLOCKLIST_TYPES.EXACT
  },
  reason: String,
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false, versionKey: false });

module.exports = mongoose.model('AutoposterBlocklistTerm', autoposterBlocklistTermSchema);
