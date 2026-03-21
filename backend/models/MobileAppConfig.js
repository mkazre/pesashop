const mongoose = require('mongoose');

const splashSlideSchema = new mongoose.Schema({
  image: { type: String, default: '' },
  heading: { type: String, default: '' },
  text: { type: String, default: '' },
  order: { type: Number, default: 0 },
}, { _id: true });

const splashScreenSchema = new mongoose.Schema({
  enabled: { type: Boolean, default: true },
  style: {
    type: String,
    enum: ['centered', 'fullImage', 'bottomCard', 'gradient', 'split'],
    default: 'centered',
  },
  slides: [splashSlideSchema],
  backgroundColor: { type: String, default: '#ffffff' },
  headingColor: { type: String, default: '#1f2937' },
  textColor: { type: String, default: '#6b7280' },
  buttonColor: { type: String, default: '#0F604B' },
  buttonTextColor: { type: String, default: '#ffffff' },
  skipButtonText: { type: String, default: 'Skip' },
  nextButtonText: { type: String, default: 'Next' },
  finishButtonText: { type: String, default: 'Get Started' },
  showDots: { type: Boolean, default: true },
  dotColor: { type: String, default: '#d1d5db' },
  dotActiveColor: { type: String, default: '#0F604B' },
  gradientFrom: { type: String, default: '#0F604B' },
  gradientTo: { type: String, default: '#1a8a6a' },
});

const mobileAppConfigSchema = new mongoose.Schema({
  splashScreen: { type: splashScreenSchema, default: () => ({}) },
}, {
  timestamps: true,
});

module.exports = mongoose.model('MobileAppConfig', mobileAppConfigSchema);
