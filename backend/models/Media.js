const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  thumbnailUrl: {
    type: String
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  width: {
    type: Number
  },
  height: {
    type: Number
  },
  alt: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  caption: {
    type: String,
    default: ''
  },
  folder: {
    type: String,
    default: 'general'
  },
  tags: [{
    type: String
  }],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  usedIn: [{
    type: {
      type: String,
      enum: ['product', 'category', 'page', 'post', 'menu', 'other']
    },
    refId: mongoose.Schema.Types.ObjectId,
    refName: String
  }]
}, {
  timestamps: true
});

mediaSchema.index({ filename: 1 });
mediaSchema.index({ folder: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ mimeType: 1 });
mediaSchema.index({ createdAt: -1 });
mediaSchema.index({ originalName: 'text', title: 'text', alt: 'text', caption: 'text' });

module.exports = mongoose.model('Media', mediaSchema);
