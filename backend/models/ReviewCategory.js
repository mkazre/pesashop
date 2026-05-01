const mongoose = require('mongoose');

// Admin-defined review rating categories (e.g. Value for Money, Delivery Speed)
const reviewCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  icon: mongoose.Schema.Types.Mixed, // emoji string OR { type: 'emoji'|'icon'|'image', value }
  description: String, // Tooltip shown to reviewer
  isActive: { type: Boolean, default: true },
  displayOrder: { type: Number, default: 0 }
}, {
  timestamps: true
});

reviewCategorySchema.index({ isActive: 1, displayOrder: 1 });

module.exports = mongoose.model('ReviewCategory', reviewCategorySchema);
