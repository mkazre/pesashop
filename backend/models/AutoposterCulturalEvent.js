const mongoose = require('mongoose');

// Recurring or one-off Zimbabwe-specific demand events with a boost multiplier
// (Spec Sections 10.5, 11.3). categoryIds references the existing Category
// collection, matching how other PesaShop models reference categories.
const autoposterCulturalEventSchema = new mongoose.Schema({
  name: { type: String, required: true },
  // {type:'annual', month:4, day:18} or {type:'monthly', dayRange:[23,30]}
  recurrence: { type: mongoose.Schema.Types.Mixed, required: true },
  boost: { type: Number, min: 1.0, max: 2.0, default: 1.0 },
  // Lead-time ramp (Spec 12.3): how many days before the event the boost
  // starts scaling up linearly, reaching full strength on the event day
  // itself. 0 = no ramp, full boost only on the exact matching day(s).
  leadTimeDays: { type: Number, min: 0, default: 0 },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  // Free-text category names from the seed data, before an admin maps them to
  // real Category documents via the Cultural Calendar Manager (Spec Section 12.3).
  // categoryIds is the authoritative field once mapped; this is just a hint.
  categoryHints: [String],
  active: { type: Boolean, default: true, index: true },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('AutoposterCulturalEvent', autoposterCulturalEventSchema);
