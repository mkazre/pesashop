const mongoose = require('mongoose');

const screensaverMediaSchema = new mongoose.Schema({
  url: { type: String, required: true },
  type: { type: String, enum: ['video', 'image'], default: 'image' },
  duration: { type: Number, default: 8 },
  order: { type: Number, default: 0 },
}, { _id: true });

const brandingSchema = new mongoose.Schema({
  primary: { type: String, default: '#0e604a' },
  secondary: { type: String, default: '#f7bd20' },
  font: { type: String, default: 'Inter' },
  logoUrl: { type: String, default: '' },
}, { _id: false });

const signupSchema = new mongoose.Schema({
  requirePhone: { type: Boolean, default: true },
  allowSocialLogin: { type: Boolean, default: false },
}, { _id: false });

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  name: { type: String, default: '' },
  location: { type: String, default: '' },
  lastHeartbeat: { type: Date, default: null },
  userAgent: { type: String, default: '' },
  screenWidth: { type: Number, default: 0 },
  screenHeight: { type: Number, default: 0 },
  overrides: { type: mongoose.Schema.Types.Mixed, default: {} },
  active: { type: Boolean, default: true },
}, { _id: true, timestamps: true });

const digitalKioskConfigSchema = new mongoose.Schema({
  screensaverEnabled: { type: Boolean, default: true },
  screensaverMedia: { type: [screensaverMediaSchema], default: [] },
  idleTimeoutSeconds: { type: Number, default: 60 },
  autoLogoutSeconds: { type: Number, default: 300 },
  branding: { type: brandingSchema, default: () => ({}) },
  signup: { type: signupSchema, default: () => ({}) },
  featuredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  featuredProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  devices: { type: [deviceSchema], default: [] },
  welcomeHeading: { type: String, default: 'Welcome to PESA Shop' },
  welcomeSubheading: { type: String, default: 'Tap anywhere to start shopping' },
  successAutoReturnSeconds: { type: Number, default: 30 },
}, {
  timestamps: true,
});

module.exports = mongoose.model('DigitalKioskConfig', digitalKioskConfigSchema);
