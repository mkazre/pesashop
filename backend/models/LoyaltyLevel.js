const mongoose = require('mongoose');

const loyaltyLevelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  
  // Level Requirements
  minPoints: {
    type: Number,
    required: true,
    min: 0
  },
  maxPoints: {
    type: Number,
    min: 0
  }, // If not set, it's the last level
  
  // Visual
  color: {
    type: String,
    default: '#0e604a'
  },
  badgeImage: String, // URL to badge image
  badgeIcon: mongoose.Schema.Types.Mixed, // emoji string OR { type: 'emoji'|'icon'|'image', value }
  
  // Benefits
  extraPointsOnAchievement: {
    type: Number,
    default: 0
  },
  redemptionMultiplier: {
    type: Number,
    default: 1 // Multiplier for redemption rate
  },
  pointsEarningMultiplier: {
    type: Number,
    default: 1 // Multiplier for earning rate
  },
  
  // Display
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Statistics
  usersCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
loyaltyLevelSchema.index({ minPoints: 1 });
loyaltyLevelSchema.index({ displayOrder: 1 });
loyaltyLevelSchema.index({ isActive: 1 });

// Static method to get level by points
loyaltyLevelSchema.statics.getLevelByPoints = async function(points) {
  const level = await this.findOne({
    isActive: true,
    minPoints: { $lte: points },
    $or: [
      { maxPoints: { $gte: points } },
      { maxPoints: null }
    ]
  }).sort({ minPoints: -1 });
  
  return level;
};

// Static method to get next level
loyaltyLevelSchema.statics.getNextLevel = async function(currentLevel) {
  if (!currentLevel) {
    return await this.findOne({ isActive: true }).sort({ minPoints: 1 });
  }
  
  return await this.findOne({
    isActive: true,
    minPoints: { $gt: currentLevel.minPoints }
  }).sort({ minPoints: 1 });
};

module.exports = mongoose.model('LoyaltyLevel', loyaltyLevelSchema);
