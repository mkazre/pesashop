// One-time migration: replace the old unweighted text index
// ({ name: 'text', description: 'text' }) with the new weighted one declared
// in models/Product.js (name/brand/sku/tags outrank description).
//
// MongoDB allows only ONE text index per collection, so this can't just
// "appear" on deploy — the old one has to be dropped before the new one can
// be built. Mongoose's autoIndex will NOT do this for you (it only adds
// missing indexes; it won't drop a conflicting one), so this needs to be run
// once, manually, against each environment (staging first, then prod).
//
// Safe to re-run: if the correct index already exists, this is a no-op.
//
// Usage:
//   MONGODB_URI="<your uri>" node backend/scripts/migrate-product-search-index.js
// or, if backend/.env already has MONGODB_URI set:
//   node backend/scripts/migrate-product-search-index.js

require('dotenv').config();
const mongoose = require('mongoose');

const TARGET_NAME = 'ProductSearchIndex';
const TARGET_KEY = { name: 'text', brand: 'text', sku: 'text', tags: 'text', description: 'text' };
const TARGET_WEIGHTS = { name: 10, brand: 6, sku: 6, tags: 4, description: 1 };

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set. Aborting — refusing to guess a database to modify.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log(`Connected to ${mongoose.connection.name}.`);

  const coll = mongoose.connection.collection('products');
  const indexes = await coll.indexes();

  const sameWeights = (a, b) => {
    const ak = Object.keys(a || {}).sort();
    const bk = Object.keys(b || {}).sort();
    return ak.length === bk.length && ak.every((k, i) => k === bk[i] && a[k] === b[k]);
  };

  const existingText = indexes.find(i => i.key && i.key._fts === 'text');
  const alreadyCorrect =
    existingText &&
    existingText.name === TARGET_NAME &&
    sameWeights(existingText.weights, TARGET_WEIGHTS);

  if (alreadyCorrect) {
    console.log(`"${TARGET_NAME}" already exists with the correct weights — nothing to do.`);
    await mongoose.disconnect();
    return;
  }

  if (existingText) {
    console.log(`Dropping existing text index "${existingText.name}" (weights: ${JSON.stringify(existingText.weights || {})})...`);
    await coll.dropIndex(existingText.name);
  } else {
    console.log('No existing text index found.');
  }

  console.log(`Building "${TARGET_NAME}" (weights: ${JSON.stringify(TARGET_WEIGHTS)})...`);
  await coll.createIndex(TARGET_KEY, { name: TARGET_NAME, weights: TARGET_WEIGHTS });
  console.log('Done.');

  await mongoose.disconnect();
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
