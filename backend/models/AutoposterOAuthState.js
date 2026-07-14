const mongoose = require('mongoose');

// Replaces the spec's Redis-backed OAuth state/PKCE store (Spec Section 5.1)
// with a Mongo TTL collection, per the Phase 0 decision to stay on node-cron +
// MongoDB rather than introduce Redis. The TTL index auto-expires entries after
// 10 minutes — the same window the spec uses for the Redis version.
const autoposterOAuthStateSchema = new mongoose.Schema({
  state: { type: String, required: true, unique: true }, // signed CSRF token
  platform: { type: String, required: true },
  codeVerifier: String, // PKCE verifier — only set for X (OAuth 2.0 + PKCE)
  // The callback route can't carry a JWT (the platform redirects the browser
  // there directly), so the admin who started the flow is captured here at
  // /start time and read back at /callback time for audit log attribution.
  initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false, versionKey: false });

autoposterOAuthStateSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 });

module.exports = mongoose.model('AutoposterOAuthState', autoposterOAuthStateSchema);
