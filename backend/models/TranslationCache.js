const mongoose = require('mongoose');

// Caches machine-translated storefront content (product/category description,
// specifications, etc.) keyed by a hash of the exact source text plus the
// target language. This means each unique piece of text is only ever sent to
// the Google Cloud Translation API once per language, ever — repeat views and
// text shared across products (e.g. spec keys like "Color") are free cache
// hits. A cache entry is only replaced when the source text itself changes
// (different sourceHash), which happens naturally when an admin edits a
// product — no TTL, translations don't go stale on their own.
const translationCacheSchema = new mongoose.Schema({
  sourceHash: { type: String, required: true }, // sha256 of the exact source text
  targetLang: { type: String, required: true }, // 'fr' | 'sn' | 'bem' | 'ny' | 'zu' | 'nd'
  sourceText: { type: String, required: true }, // kept for debugging/admin review
  translatedText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: false, versionKey: false });

translationCacheSchema.index({ sourceHash: 1, targetLang: 1 }, { unique: true });

module.exports = mongoose.model('TranslationCache', translationCacheSchema);
