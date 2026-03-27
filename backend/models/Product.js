const mongoose = require('mongoose');

const variationSchema = new mongoose.Schema({
  attributes: {
    type: Map,
    of: String,
    required: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  regularPrice: {
    type: Number,
    required: true
  },
  salePrice: Number,
  backendPrice: {
    type: Number,
    default: 0 // Cost price / purchase price for B2B markups
  },
  stock: {
    type: Number,
    default: 0
  },
  image: String,
  isActive: {
    type: Boolean,
    default: true
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [200, 'Name cannot exceed 200 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  sku: {
    type: String,
    required: false, // Will be auto-generated if not provided
    unique: true,
    sparse: true,
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide product description']
  },
  shortDescription: {
    type: String,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },
  regularPrice: {
    type: Number,
    required: [true, 'Please provide regular price']
  },
  backendPrice: {
    type: Number,
    default: 0 // Cost price / purchase price for B2B markups
  },
  salePrice: {
    type: Number,
    validate: {
      validator: function(value) {
        return !value || value < this.regularPrice;
      },
      message: 'Sale price must be less than regular price'
    }
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  images: [{
    type: String
  }],
  featuredImage: {
    type: String
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isNew: {
    type: Boolean,
    default: false
  },
  brand: String,
  weight: Number,
  dimensions: String,
  material: String,
  tags: [String],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  totalSold: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  attributes: {
    type: Map,
    of: [String]
  },
  variations: [variationSchema],
  productType: {
    type: String,
    enum: ['simple', 'variable'],
    default: 'simple'
  },
  customAttributes: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  },
  specifications: [{
    key: { type: String, required: true },
    value: { type: String, required: true },
  }],
  seoTitle: String,
  seoDescription: String,
  seoKeywords: [String],
  status: {
    type: String,
    enum: ['active', 'draft', 'trash'],
    default: 'active'
  },
  trashedAt: Date,
  aiGenerated: {
    description: {
      type: Boolean,
      default: false
    },
    shortDescription: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ categories: 1 });
productSchema.index({ status: 1 });
productSchema.index({ isActive: 1, isFeatured: 1 });

// Get price for a customer group (B2B pricing support)
productSchema.methods.getPriceForCustomerGroup = function(customerGroup, quantity) {
  // If there's a sale price, use it; otherwise use regular price
  return this.salePrice || this.regularPrice;
};

// Decrement stock by the given quantity
productSchema.methods.updateStock = async function(quantity) {
  this.stock = Math.max(0, (this.stock || 0) - quantity);
  await this.save();
};

// Generate slug before saving
productSchema.pre('save', async function(next) {
  if (this.isModified('name') && !this.slug) {
    let baseSlug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    let slug = baseSlug;
    let counter = 1;
    
    while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    this.slug = slug;
  }
  
  next();
});

// Auto-generate SKU if not provided
productSchema.pre('save', async function(next) {
  if (!this.sku) {
    const count = await mongoose.model('Product').countDocuments();
    const skuNumber = String(count + 1).padStart(3, '0');
    this.sku = `PS-${skuNumber}`;
    
    // Ensure uniqueness
    let counter = 1;
    let existingProduct = await mongoose.model('Product').findOne({ sku: this.sku, _id: { $ne: this._id } });
    while (existingProduct) {
      const newSkuNumber = String(count + 1 + counter).padStart(3, '0');
      this.sku = `PS-${newSkuNumber}`;
      existingProduct = await mongoose.model('Product').findOne({ sku: this.sku, _id: { $ne: this._id } });
      counter++;
    }
  }
  next();
});

// Static method to get next SKU
productSchema.statics.getNextSKU = async function() {
  const count = await this.countDocuments();
  const skuNumber = String(count + 1).padStart(3, '0');
  return `PS-${skuNumber}`;
};

module.exports = mongoose.model('Product', productSchema);
