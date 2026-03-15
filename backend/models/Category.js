const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: String,
  
  // Hierarchy
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null
  },
  
  // Display
  image: {
    url: String,
    alt: String
  },
  icon: String,
  // Category icon (1:1 favicon-style for carousels/grids)
  iconImage: {
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  // Category banner (landscape rectangle for archive page header)
  bannerImage: {
    url: { type: String, default: '' },
    alt: { type: String, default: '' },
  },
  // Banner display settings
  bannerSettings: {
    overlayColor: { type: String, default: 'rgba(0,0,0,0.45)' },
    textColor: { type: String, default: '#ffffff' },
    textAlign: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
    showTitle: { type: Boolean, default: true },
    showDescription: { type: Boolean, default: true },
    showProductCount: { type: Boolean, default: true },
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  
  // SEO
  metaTitle: String,
  metaDescription: String,
  metaKeywords: [String],
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Product count (cached)
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ displayOrder: 1 });

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Virtual for subcategories
categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Method to get full path
categorySchema.methods.getPath = async function() {
  const path = [this];
  let current = this;
  
  while (current.parent) {
    current = await this.model('Category').findById(current.parent);
    if (current) {
      path.unshift(current);
    } else {
      break;
    }
  }
  
  return path;
};

// Method to get all descendant IDs
categorySchema.methods.getDescendantIds = async function() {
  const descendants = [this._id];
  
  const findDescendants = async (parentId) => {
    const children = await this.model('Category').find({ parent: parentId });
    for (const child of children) {
      descendants.push(child._id);
      await findDescendants(child._id);
    }
  };
  
  await findDescendants(this._id);
  return descendants;
};

module.exports = mongoose.model('Category', categorySchema);
