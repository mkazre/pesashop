const mongoose = require('mongoose');

const pageTemplateSchema = new mongoose.Schema({
  templateType: {
    type: String,
    enum: ['shop', 'category', 'single-product', 'product', 'cart', 'checkout', 'account', 'page', 'custom'],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  components: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  dynamicBindings: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  isHomepage: {
    type: Boolean,
    default: false,
  },
  isPublished: {
    type: Boolean,
    default: false,
  },
  seo: {
    title: String,
    description: String,
    keywords: String,
    ogImage: String,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  menuAssignments: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  version: {
    type: Number,
    default: 1,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Ensure only one homepage
pageTemplateSchema.pre('save', async function(next) {
  if (this.isHomepage && this.isModified('isHomepage')) {
    await mongoose.model('PageTemplate').updateMany(
      { _id: { $ne: this._id }, isHomepage: true },
      { isHomepage: false }
    );
  }
  next();
});

// Index for published pages
pageTemplateSchema.index({ isPublished: 1, slug: 1 });
pageTemplateSchema.index({ templateType: 1 });

module.exports = mongoose.model('PageTemplate', pageTemplateSchema);
