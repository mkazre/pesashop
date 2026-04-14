const mongoose = require('mongoose');

const importBatchSchema = new mongoose.Schema({
  // Job reference
  jobId: { type: String, required: true, unique: true, index: true },
  type: { type: String, enum: ['products', 'categories', 'customers', 'orders'], default: 'products' },

  // File metadata
  originalFilename: { type: String, default: '' },
  importMode: { type: String, default: 'add' }, // 'add' | 'update' | 'replace'

  // Results
  status: { type: String, enum: ['running', 'completed', 'failed', 'rolled_back', 'rolling_back', 'rollback_failed'], default: 'running' },
  results: {
    created: { type: Number, default: 0 },
    updated: { type: Number, default: 0 },
    merged:  { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    errors:  { type: Number, default: 0 },
  },

  // Product IDs created in this batch (for rollback)
  createdProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Categories that products were imported into (derived from products)
  categories: [{ type: String }],

  // Error info
  errorMessage: { type: String, default: '' },

  // Rollback result (populated after background deletion completes)
  rollbackResult: {
    deleted:          { type: Number },
    cloudinaryDeleted:{ type: Number },
    cloudinaryFailed: { type: Number },
    error:            { type: String },
    completedAt:      { type: Date },
  },

  // Who imported
  importedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  startedAt: { type: Date, default: Date.now },
  completedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ImportBatch', importBatchSchema);
