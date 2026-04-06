const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Not required if guest reviews are allowed
  },
  guestName: {
    type: String,
    // Required if user is not provided (guest review)
  },
  guestEmail: {
    type: String,
    // Required if user is not provided (guest review)
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  
  // Review Content
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  // Category Ratings
  categoryRatings: {
    productQuality: {
      type: Number,
      min: 1,
      max: 5
    },
    valueForMoney: {
      type: Number,
      min: 1,
      max: 5
    },
    accuracyOfDescription: {
      type: Number,
      min: 1,
      max: 5
    },
    shippingPackaging: {
      type: Number,
      min: 1,
      max: 5
    },
    customerService: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  title: String,
  content: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    maxlength: 60,
    // Optional comment field
  },
  
  // Images
  images: [{
    url: String,
    alt: String
  }],
  
  // Verification
  isVerifiedPurchase: {
    type: Boolean,
    default: false
  },
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Helpfulness
  helpfulCount: {
    type: Number,
    default: 0
  },
  unhelpfulCount: {
    type: Number,
    default: 0
  },
  helpfulVotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    vote: {
      type: String,
      enum: ['helpful', 'unhelpful']
    }
  }],
  
  // Admin Response
  adminResponse: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  },
  
  // Loyalty
  pointsAwarded: {
    type: Boolean,
    default: false
  },

  // Moderation
  reportedCount: {
    type: Number,
    default: 0
  },
  reports: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    date: {
      type: Date,
      default: Date.now
    }
  }]
  
}, {
  timestamps: true
});

// Indexes
reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });

// Compound indexes - only unique if user is provided
reviewSchema.index({ product: 1, user: 1 }, { 
  unique: true,
  partialFilterExpression: { user: { $exists: true } }
});

// Auto-approve reviews with 4+ stars
reviewSchema.pre('save', async function() {
  // Only auto-approve if status is pending and rating is 4 or higher
  if (this.isNew && this.status === 'pending' && this.rating >= 4) {
    this.status = 'approved';
  }
});

// Update product rating after review save
reviewSchema.post('save', async function() {
  if (this.status === 'approved') {
    await this.updateProductRating();
  }
});

// Update product rating after review update
reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc && doc.status === 'approved') {
    await doc.updateProductRating();
  }
});

// Method to update product rating
reviewSchema.methods.updateProductRating = async function() {
  const Review = this.constructor;
  const Product = mongoose.model('Product');
  
  const stats = await Review.aggregate([
    {
      $match: {
        product: this.product,
        status: 'approved'
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      averageRating: stats[0].averageRating,
      ratingCount: stats[0].count
    });
  }
};

// Method to vote helpful/unhelpful
reviewSchema.methods.vote = async function(userId, voteType) {
  const existingVote = this.helpfulVotes.find(v => v.user.toString() === userId.toString());
  
  if (existingVote) {
    // Remove old vote count
    if (existingVote.vote === 'helpful') {
      this.helpfulCount = Math.max(0, this.helpfulCount - 1);
    } else {
      this.unhelpfulCount = Math.max(0, this.unhelpfulCount - 1);
    }
    
    // Update vote
    existingVote.vote = voteType;
  } else {
    // Add new vote
    this.helpfulVotes.push({ user: userId, vote: voteType });
  }
  
  // Add new vote count
  if (voteType === 'helpful') {
    this.helpfulCount += 1;
  } else {
    this.unhelpfulCount += 1;
  }
  
  await this.save();
};

// Static method to check if user can review product
reviewSchema.statics.canUserReview = async function(userId, productId) {
  const Order = mongoose.model('Order');
  
  // Check if user has purchased this product
  const hasPurchased = await Order.findOne({
    customer: userId,
    'items.product': productId,
    status: 'completed'
  });
  
  // Check if user already reviewed
  const existingReview = await this.findOne({
    user: userId,
    product: productId
  });
  
  return {
    canReview: hasPurchased && !existingReview,
    hasPurchased: !!hasPurchased,
    hasReviewed: !!existingReview
  };
};

module.exports = mongoose.model('Review', reviewSchema);
