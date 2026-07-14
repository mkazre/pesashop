const mongoose = require('mongoose');
const { AUTOPOSTER_POST_SOURCE, AUTOPOSTER_POST_STATUS } = require('../config/constants');

// The canonical post record (Spec Section 4.2). One post may fan out to multiple
// platforms; each fan-out is tracked in AutoposterPostTarget.
const autoposterPostSchema = new mongoose.Schema({
  title: String, // internal label only
  baseCaption: String,
  mediaRefs: [{
    type: { type: String, enum: ['image', 'video'] },
    url: String,
    alt: String
  }],
  linkUrl: String, // e.g. product URL

  source: {
    type: String,
    enum: Object.values(AUTOPOSTER_POST_SOURCE),
    required: true,
    index: true
  },
  // productId when source='product_auto', trend id when source='trend', etc.
  sourceRef: { type: String, index: true },

  scheduledFor: Date,
  status: {
    type: String,
    enum: Object.values(AUTOPOSTER_POST_STATUS),
    default: AUTOPOSTER_POST_STATUS.DRAFT,
    index: true
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

autoposterPostSchema.index({ status: 1, scheduledFor: 1 });

module.exports = mongoose.model('AutoposterPost', autoposterPostSchema);
