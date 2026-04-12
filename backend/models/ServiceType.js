const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
  },
  slug: {
    type: String,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  icon: {
    type: String,  // emoji or icon name
    default: '🔧',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  // Service modes offered
  serviceModes: [{
    type: String,
    enum: ['repair', 'install', 'maintain'],
  }],
  // Geographic areas
  areasServiced: [{
    type: String,
    trim: true,
  }],
  // Link to product categories (for widget matching)
  linkedCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  displayOrder: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

// Auto-generate slug from title
serviceTypeSchema.pre('save', function (next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
