const mongoose = require('mongoose');

const pinEventSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  pinnedAt: { type: Date, default: Date.now },
  unpinnedAt: Date,
  durationSec: { type: Number, default: 60 },
  videoTimestamp: Number, // seconds into the recording, populated when VOD is generated
  taps: { type: Number, default: 0 },
  addToCarts: { type: Number, default: 0 }
}, { _id: true });

const liveStreamSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: String,
  posterImage: String,

  hostName: String,
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  scheduledStart: { type: Date, required: true, index: true },
  scheduledEnd: Date,

  actualStart: Date,
  actualEnd: Date,

  // Video transport
  source: { type: String, enum: ['hls', 'youtube', 'mux', 'cloudflare'], default: 'hls' },
  playbackUrl: String, // HLS .m3u8 url, or YouTube embed url
  vodPlaybackUrl: String, // populated after stream ends
  embedHtml: String,

  // Curated product list
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

  // Currently pinned product
  currentPin: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  currentPinExpiresAt: Date,

  // Historical pin events (for VOD anchors)
  pinEvents: [pinEventSchema],

  status: { type: String, enum: ['scheduled', 'live', 'ended', 'cancelled'], default: 'scheduled', index: true },

  // Engagement metrics
  stats: {
    peakViewers: { type: Number, default: 0 },
    totalViewers: { type: Number, default: 0 },
    cartAdds: { type: Number, default: 0 },
    purchases: { type: Number, default: 0 },
    revenue: { type: Number, default: 0 }
  },

  // Promotion / discount applied during live window
  liveDiscountPercent: { type: Number, default: 0, min: 0, max: 80 },

  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

liveStreamSchema.index({ status: 1, scheduledStart: 1 });

module.exports = mongoose.model('LiveStream', liveStreamSchema);
