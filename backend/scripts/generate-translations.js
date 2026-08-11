/**
 * One-off batch translator for the storefront's static UI string catalogue.
 *
 * Usage: node backend/scripts/generate-translations.js
 *
 * Reads frontend/src/locales/en/translation.json (the hand-authored source of
 * truth), flattens it, and for each of the six target languages calls the
 * Google Cloud Translation API to fill in ONLY the keys missing from that
 * language's translation.json — existing entries are never overwritten, so
 * re-running this after a human has hand-corrected some strings is always
 * safe.
 *
 * Requires GOOGLE_TRANSLATE_API_KEY in backend/.env.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const GOOGLE_TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const LOCALES_DIR = path.join(__dirname, '../../frontend/src/locales');
const TARGET_LANGS = ['fr', 'sn', 'bem', 'ny', 'zu', 'nd'];

function flatten(obj, prefix = '', out = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      flatten(value, fullKey, out);
    } else {
      out[fullKey] = value;
    }
  }
  return out;
}

function unflatten(flat) {
  const out = {};
  for (const [flatKey, value] of Object.entries(flat)) {
    const parts = flatKey.split('.');
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      node = node[parts[i]] ??= {};
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}

async function translateBatch(texts, targetLang, apiKey) {
  // Google's v2 endpoint accepts an array in `q` for batch translation.
  const response = await axios.post(GOOGLE_TRANSLATE_URL, null, {
    params: { key: apiKey, q: texts, target: targetLang, source: 'en', format: 'text' },
  });
  return response.data.data.translations.map((t) => t.translatedText);
}

async function main() {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.error('GOOGLE_TRANSLATE_API_KEY is not set in backend/.env — nothing to do.');
    console.error('See the setup steps you were given for creating a Google Cloud Translation API key.');
    process.exit(1);
  }

  const enPath = path.join(LOCALES_DIR, 'en/translation.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const flatEn = flatten(en);
  const allKeys = Object.keys(flatEn);

  let totalCharsUsed = 0;

  for (const lang of TARGET_LANGS) {
    const targetPath = path.join(LOCALES_DIR, lang, 'translation.json');
    const existing = fs.existsSync(targetPath) ? JSON.parse(fs.readFileSync(targetPath, 'utf8')) : {};
    const flatExisting = flatten(existing);

    const missingKeys = allKeys.filter((k) => !(k in flatExisting) || !flatExisting[k]);
    if (missingKeys.length === 0) {
      console.log(`[${lang}] up to date (${allKeys.length} keys) — nothing to translate.`);
      continue;
    }

    console.log(`[${lang}] translating ${missingKeys.length} missing key(s)...`);
    const missingTexts = missingKeys.map((k) => flatEn[k]);

    // Google's REST API has a practical request-size limit — chunk into
    // batches of 100 strings to stay well under it.
    const BATCH_SIZE = 100;
    const translatedTexts = [];
    for (let i = 0; i < missingTexts.length; i += BATCH_SIZE) {
      const chunk = missingTexts.slice(i, i + BATCH_SIZE);
      const translatedChunk = await translateBatch(chunk, lang, apiKey);
      translatedTexts.push(...translatedChunk);
      totalCharsUsed += chunk.join('').length;
    }

    missingKeys.forEach((key, idx) => {
      flatExisting[key] = translatedTexts[idx];
    });

    const merged = unflatten(flatExisting);
    fs.writeFileSync(targetPath, JSON.stringify(merged, null, 2) + '\n');
    console.log(`[${lang}] wrote ${missingKeys.length} translated key(s) to ${targetPath}`);
  }

  console.log(`\nDone. Approx ${totalCharsUsed} characters sent to the Translation API this run`
    + ' (well within the 500,000/month free tier for a UI string catalogue this size).');
  console.log('Review the generated files before shipping — machine translation for');
  console.log('lower-resource languages (Bemba, Ndebele especially) benefits from a native-speaker pass.');
}

main().catch((err) => {
  console.error('generate-translations.js failed:', err.response?.data || err.message);
  process.exit(1);
});
