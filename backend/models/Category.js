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
