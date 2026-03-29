const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },

  // Sender info
  senderType: {
    type: String,
    enum: ['visitor', 'agent', 'bot', 'system'],
    required: true
  },

  // For visitor messages
  visitorId: String,

  // For agent messages
  agentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  agentName: String,

  // Message content
  content: {
    type: String,
    required: true
  },

  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'typing', 'system'],
    default: 'text'
  },

  // File attachments
  attachments: [{
    url: String,
    name: String,
    size: Number,
    mimeType: String
  }],

  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },

  // Read receipts
  readAt: Date,
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // For canned responses
  isCanned: {
    type: Boolean,
    default: false
  },
  cannedId: String,

  // Edited messages
  editedAt: Date,
  originalContent: String,

  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Index for fast conversation loading
messageSchema.index({ conversation: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
