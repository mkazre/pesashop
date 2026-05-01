const mongoose = require('mongoose');

const serviceProviderCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  icon: mongoose.Schema.Types.Mixed, // emoji string OR { type: 'emoji'|'icon'|'image', value }
  description: String,
  // Keywords used for AI contextual ad matching
  keywords: [{ type: String }],
  aiContextKeywords: [{ type: String }],
  // Product category IDs that contextually match this service category
  relatedProductCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

serviceProviderCategorySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

serviceProviderCategorySchema.index({ slug: 1 });
serviceProviderCategorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('ServiceProviderCategory', serviceProviderCategorySchema);
