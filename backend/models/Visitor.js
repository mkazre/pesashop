const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  // Anonymous visitor ID (from cookie/localStorage)
  visitorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // IP and basic info
  ip: String,
  userAgent: String,

  // Geolocation
  country: String,
  city: String,

  // Current status
  isOnline: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },

  // Page tracking
  currentPage: String,
  pageHistory: [{
    url: String,
    title: String,
    timestamp: { type: Date, default: Date.now },
    timeSpent: Number // seconds spent on page
  }],

  // Referrer info
  referrer: String,
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,

  // Device info
  device: {
    type: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    browser: String,
    os: String
  },

  // Linked to user if logged in
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  // Customer info (if provided in pre-chat form)
  email: String,
  name: String,
  phone: String,

  // Session tracking
  socketId: String,
  sessions: [{
    startedAt: { type: Date, default: Date.now },
    endedAt: Date,
    pagesViewed: Number
  }]
}, {
  timestamps: true
});

// Index for querying online visitors
visitorSchema.index({ isOnline: 1, lastActivity: -1 });

// Method to mark visitor as active
visitorSchema.methods.markActive = function(pageUrl, pageTitle) {
  this.isOnline = true;
  this.lastActivity = new Date();

  if (pageUrl && this.currentPage !== pageUrl) {
    // Record time spent on previous page
    if (this.pageHistory.length > 0) {
      const lastPage = this.pageHistory[this.pageHistory.length - 1];
      lastPage.timeSpent = Math.floor((Date.now() - lastPage.timestamp) / 1000);
    }

    this.currentPage = pageUrl;
    this.pageHistory.push({
      url: pageUrl,
      title: pageTitle,
      timestamp: new Date()
    });

    // Keep only last 20 pages
    if (this.pageHistory.length > 20) {
      this.pageHistory = this.pageHistory.slice(-20);
    }
  }

  return this.save();
};

// Static method to clean up stale visitors
visitorSchema.statics.cleanupStale = async function(maxAgeMinutes = 5) {
  const cutoff = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

  const result = await this.updateMany(
    { lastActivity: { $lt: cutoff }, isOnline: true },
    { isOnline: false }
  );

  return result.modifiedCount;
};

module.exports = mongoose.model('Visitor', visitorSchema);
