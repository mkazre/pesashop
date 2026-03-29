const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  // Conversation ID (shared with visitor for anonymous chats)
  conversationId: {
    type: String,
    unique: true,
    index: true
  },

  // Linked visitor
  visitor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true
  },
  visitorId: String,

  // Linked user if logged in
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Assigned agent
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: Date,

  // Conversation status
  status: {
    type: String,
    enum: ['active', 'closed', 'pending', 'waiting'],
    default: 'active'
  },

  // Source/page where chat started
  source: {
    page: String,
    referrer: String
  },

  // Pre-chat form data
  preChatData: {
    email: String,
    name: String,
    phone: String,
    question: String
  },

  // Message counts
  stats: {
    visitorMessages: { type: Number, default: 0 },
    agentMessages: { type: Number, default: 0 },
    totalMessages: { type: Number, default: 0 }
  },

  // Timing
  startedAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  lastMessageAt: {
    type: Date,
    default: Date.now
  },

  // Last message preview
  lastMessage: {
    content: String,
    senderType: String,
    timestamp: Date
  },

  // Visitor is typing
  visitorTyping: {
    isTyping: { type: Boolean, default: false },
    startedAt: Date
  },

  // Agent is typing
  agentTyping: {
    isTyping: { type: Boolean, default: false },
    startedAt: Date,
    agentId: mongoose.Schema.Types.ObjectId
  },

  // Rating
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: String,
    submittedAt: Date
  },

  // Tags
  tags: [String],

  // Notes for agents
  notes: [{
    content: String,
    agentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: { type: Date, default: Date.now }
  }],

  // Transcript email sent
  transcriptSent: {
    type: Boolean,
    default: false
  },

  // Conversation priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Indexes for common queries
conversationSchema.index({ visitor: 1, status: 1 });
conversationSchema.index({ assignedTo: 1, status: 1 });
conversationSchema.index({ status: 1, lastMessageAt: -1 });
conversationSchema.index({ createdAt: -1 });

// Pre-save middleware to generate conversationId
conversationSchema.pre('save', function(next) {
  if (!this.conversationId) {
    this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  next();
});

// Method to close conversation
conversationSchema.methods.close = function(agentId) {
  this.status = 'closed';
  this.endedAt = new Date();
  return this.save();
};

// Method to assign to agent
conversationSchema.methods.assign = function(agentId) {
  this.assignedTo = agentId;
  this.assignedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Conversation', conversationSchema);
