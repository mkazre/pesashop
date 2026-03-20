require('dotenv').config();
const mongoose = require('mongoose');

const LOCAL_URI = process.env.MONGODB_URI;
const ATLAS_URI = 'mongodb+srv://mngunimkhaliphi_db_user:npK8v8ADQRygBVh7@pesashop.cdllsfz.mongodb.net/pesashop?appName=PesaShop';

async function listCollections(uri, label) {
  const conn = await mongoose.createConnection(uri).asPromise();
  const db = conn.db;
  console.log(`\n=== ${label}: ${db.databaseName} ===`);
  const cols = await db.listCollections().toArray();
  for (const col of cols.sort((a, b) => a.name.localeCompare(b.name))) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  ${col.name}: ${count}`);
  }
  await conn.close();
}

async function main() {
  await listCollections(LOCAL_URI, 'LOCAL');
  await listCollections(ATLAS_URI, 'ATLAS (pesashop)');
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
