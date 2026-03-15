const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  isAdminAnswer: {
    type: Boolean,
    default: false,
  },
  isAccepted: {
    type: Boolean,
    default: false,
  },
  helpfulCount: {
    type: Number,
    default: 0,
  },
  helpfulVotes: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    vote: { type: String, enum: ['helpful', 'unhelpful'] },
  }],
  status: {
    type: String,
    enum: ['visible', 'hidden', 'deleted'],
    default: 'visible',
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  deletedAt: Date,
}, {
  timestamps: true,
});

const productQuestionSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  question: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  answers: [answerSchema],
  
  // Moderation
  status: {
    type: String,
    enum: ['visible', 'hidden', 'deleted'],
    default: 'visible',
  },
  
  // Stats
  viewCount: {
    type: Number,
    default: 0,
  },
  answerCount: {
    type: Number,
    default: 0,
  },
  
  // Flags
  isPinned: {
    type: Boolean,
    default: false,
  },
  isResolved: {
    type: Boolean,
    default: false,
  },
  
  // Tags for categorization
  tags: [String],
  
}, {
  timestamps: true,
});

// Indexes
productQuestionSchema.index({ product: 1, createdAt: -1 });
productQuestionSchema.index({ product: 1, status: 1 });
productQuestionSchema.index({ user: 1 });
productQuestionSchema.index({ status: 1, createdAt: -1 });

// Virtual: visible answer count
productQuestionSchema.pre('save', function () {
  this.answerCount = this.answers.filter(a => a.status === 'visible').length;
});

module.exports = mongoose.model('ProductQuestion', productQuestionSchema);
