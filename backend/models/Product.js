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
  saleStartDate: {
    type: Date,
    default: null,
  },
  saleEndDate: {
    type: Date,
    default: null,
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
  videos: [{
    type: {
      type: String,
      enum: ['upload', 'embed'],
      default: 'upload'
    },
    url: {
      type: String,
      required: true
    },
    title: {
      type: String
    }
  }],
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative']
  },
  lowStockThreshold: {
    type: Number,
    default: 5
  },
  // Set when the admin low-stock alert has been sent for the current dip —
  // cleared once stock is restocked back above the threshold, so admin
  // doesn't get spammed on every subsequent unit sold.
  lowStockAlertSentAt: {
    type: Date,
    default: null
  },
  outOfStock: {
    type: Boolean,
    default: false
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
// Weighted so a name (or brand/sku/tag) match ranks far above an incidental
// description mention — e.g. searching "iphone" should surface iPhone-named
// products before an unrelated charger whose description merely says "also
// works with iPhone". NOTE: MongoDB allows only one text index per
// collection — replacing this one in production requires an explicit index
// migration (drop the old one, build this one), it will NOT happen
// automatically on deploy. See the migration script shipped alongside this
// change.
productSchema.index(
  { name: 'text', brand: 'text', sku: 'text', tags: 'text', description: 'text' },
  { weights: { name: 10, brand: 6, sku: 6, tags: 4, description: 1 }, name: 'ProductSearchIndex' }
);
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

  const threshold = this.lowStockThreshold || 5;
  if (this.stock > 0 && this.stock <= threshold && !this.lowStockAlertSentAt) {
    this.lowStockAlertSentAt = new Date();
    await this.save();
    const emailService = require('../services/emailService');
    emailService.sendAdminLowStock(this).catch(err => console.error('Error sending low stock alert:', err));
  }
};

// Restocking above the threshold re-arms the low-stock alert for next time
productSchema.pre('save', function(next) {
  if (this.isModified('stock') && this.stock > (this.lowStockThreshold || 5) && this.lowStockAlertSentAt) {
    this.lowStockAlertSentAt = null;
  }
  next();
});

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

// Visual / semantic search embedding (text-embedding-3-small dimensions = 1536)
productSchema.add({
  embedding: { type: [Number], select: false, default: undefined },
  embeddingUpdatedAt: { type: Date, select: false }
});

// When searchable text changes, invalidate the embedding so the cron re-embeds it.
productSchema.pre('save', function (next) {
  const watched = ['name', 'brand', 'shortDescription', 'description', 'categories'];
  if (watched.some(f => this.isModified(f))) {
    this.embedding = undefined;
    this.embeddingUpdatedAt = undefined;
  }
  next();
});

// Social Auto-Poster additive fields (Spec Section 9.5.2). Optional, defaulted,
// purely additive — existing documents are unaffected until explicitly set.
productSchema.add({
  postProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterPostProfile', default: null },
  autoPostEnabled: { type: Boolean, default: false },
  autoPostPlatforms: { type: [String], default: [] },
  captionTemplateId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutoposterCaptionTemplate', default: null }
});

module.exports = mongoose.model('Product', productSchema);
