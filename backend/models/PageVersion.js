const mongoose = require('mongoose');

const pageVersionSchema = new mongoose.Schema({
  pageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PageTemplate',
    required: true,
    index: true,
  },
  version: {
    type: Number,
    required: true,
  },
  components: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  dynamicBindings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  savedAt: {
    type: Date,
    default: Date.now,
  },
  savedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: String,
}, {
  timestamps: true,
});

// Index for quick version lookup
pageVersionSchema.index({ pageId: 1, version: -1 });

module.exports = mongoose.model('PageVersion', pageVersionSchema);
