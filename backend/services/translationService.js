const crypto = require('crypto');
const axios = require('axios');
const TranslationCache = require('../models/TranslationCache');
const Settings = require('../models/Settings');

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';

// The full set of locales this codebase knows how to render — see
// frontend/src/i18n.js SUPPORTED_LANGUAGES. Northern (Zimbabwean) Ndebele is
// intentionally excluded: no translation API supports it (Google Cloud
// Translation only has Southern Ndebele, "nr", a related but distinct
// language) — it needs a human/community translator, not this pipeline.
// An admin can further narrow which of these are actually offered to
// customers via Settings → Translations (Settings.translation.enabledLanguages);
// that list is intersected with this one everywhere below.
const SUPPORTED_TARGET_LANGS = ['fr', 'sn', 'bem', 'ny', 'zu'];

const hashText = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');

// Short-lived in-process cache for the Settings document — translating a
// single product touches translateText() a dozen+ times per request, and we
// don't want a DB round-trip for every one of them just to read the API key.
let settingsCache = { value: null, expiresAt: 0 };
async function getTranslationSettings() {
  if (Date.now() < settingsCache.expiresAt) return settingsCache.value;
  const settings = await Settings.getSettings();
  const value = {
    apiKey: settings.translation?.apiKey || process.env.GOOGLE_TRANSLATE_API_KEY || '',
    enabledLanguages: settings.translation?.enabledLanguages?.length
      ? settings.translation.enabledLanguages.filter((l) => SUPPORTED_TARGET_LANGS.includes(l))
      : SUPPORTED_TARGET_LANGS,
  };
  settingsCache = { value, expiresAt: Date.now() + 60_000 };
  return value;
}

/**
 * Translate a single string via Google Cloud Translation, going through the
 * TranslationCache first so any given source text is only ever billed once
 * per target language. Returns the original text unchanged if the text is
 * empty, the language isn't one we support, or the API key isn't configured
 * (so the site degrades to English rather than erroring) or the API call
 * fails for any reason.
 */
async function translateText(text, targetLang) {
  if (!text || typeof text !== 'string' || !text.trim()) return text;

  const { apiKey, enabledLanguages } = await getTranslationSettings();
  if (!enabledLanguages.includes(targetLang)) return text;

  const sourceHash = hashText(text);

  const cached = await TranslationCache.findOne({ sourceHash, targetLang }).lean();
  if (cached) return cached.translatedText;

  if (!apiKey) {
    // No key configured yet — degrade gracefully to the source text instead
    // of erroring, so the storefront still works while translation is unfunded.
    return text;
  }

  try {
    const response = await axios.post(GOOGLE_TRANSLATE_URL, null, {
      params: {
        key: apiKey,
        q: text,
        target: targetLang,
        source: 'en',
        format: 'text',
      },
    });

    const translatedText = response.data?.data?.translations?.[0]?.translatedText;
    if (!translatedText) return text;

    // findOneAndUpdate + upsert instead of create, so a concurrent request
    // translating the same text doesn't throw on the unique index.
    await TranslationCache.findOneAndUpdate(
      { sourceHash, targetLang },
      { sourceHash, targetLang, sourceText: text, translatedText },
      { upsert: true, setDefaultsOnInsert: true }
    );

    return translatedText;
  } catch (error) {
    console.error(`Translation failed (lang=${targetLang}):`, error.response?.data || error.message);
    return text; // fail open — never break the page over a translation error
  }
}

async function translateMany(texts, targetLang) {
  return Promise.all(texts.map((text) => translateText(text, targetLang)));
}

/**
 * Translates only the customer-facing free-text fields of a product:
 * description, shortDescription, and each specification's key/value.
 * Explicitly leaves name, sku, and all price fields untouched.
 */
async function translateProductFields(product, targetLang) {
  const { enabledLanguages } = await getTranslationSettings();
  if (!enabledLanguages.includes(targetLang)) return product;

  const [description, shortDescription] = await Promise.all([
    translateText(product.description, targetLang),
    translateText(product.shortDescription, targetLang),
  ]);

  let specifications = product.specifications;
  if (Array.isArray(specifications) && specifications.length > 0) {
    specifications = await Promise.all(
      specifications.map(async (spec) => ({
        ...spec,
        key: await translateText(spec.key, targetLang),
        value: await translateText(spec.value, targetLang),
      }))
    );
  }

  return { ...product, description, shortDescription, specifications };
}

/**
 * Translates a category's name, description, and meta fields.
 */
async function translateCategoryFields(category, targetLang) {
  const { enabledLanguages } = await getTranslationSettings();
  if (!enabledLanguages.includes(targetLang)) return category;

  const [name, description, metaTitle, metaDescription] = await Promise.all([
    translateText(category.name, targetLang),
    translateText(category.description, targetLang),
    translateText(category.metaTitle, targetLang),
    translateText(category.metaDescription, targetLang),
  ]);

  return { ...category, name, description, metaTitle, metaDescription };
}

module.exports = {
  SUPPORTED_TARGET_LANGS,
  getTranslationSettings,
  translateText,
  translateMany,
  translateProductFields,
  translateCategoryFields,
};
