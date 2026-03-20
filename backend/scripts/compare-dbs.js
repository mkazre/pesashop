require('dotenv').config();
const mongoose = require('mongoose');

const LOCAL_URI = process.env.MONGODB_URI;
const ATLAS_URI = 'mongodb+srv://mngunimkhaliphi_db_user:npK8v8ADQRygBVh7@pesashop.cdllsfz.mongodb.net/pesashop?appName=PesaShop';

async function main() {
  const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
  const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
  const localDb = localConn.db;
  const atlasDb = atlasConn.db;

  // 1. Check users in both
  console.log('\n=== USERS (LOCAL) ===');
  const localUsers = await localDb.collection('users').find({}, { projection: { email: 1, role: 1, firstName: 1, lastName: 1 } }).toArray();
  localUsers.forEach(u => console.log(`  ${u.email} | ${u.role} | ${u.firstName} ${u.lastName}`));

  console.log('\n=== USERS (ATLAS) ===');
  const atlasUsers = await atlasDb.collection('users').find({}, { projection: { email: 1, role: 1, firstName: 1, lastName: 1 } }).toArray();
  atlasUsers.forEach(u => console.log(`  ${u.email} | ${u.role} | ${u.firstName} ${u.lastName}`));

  // 2. Check settings
  console.log('\n=== SETTINGS (LOCAL) ===');
  const localSettings = await localDb.collection('settings').findOne({});
  if (localSettings) {
    console.log('  storeName:', localSettings.storeName);
    console.log('  logo:', localSettings.logo ? localSettings.logo.substring(0, 80) : 'none');
    console.log('  currency:', localSettings.currency);
    console.log('  keys:', Object.keys(localSettings).join(', '));
  }

  console.log('\n=== SETTINGS (ATLAS) ===');
  const atlasSettings = await atlasDb.collection('settings').findOne({});
  if (atlasSettings) {
    console.log('  storeName:', atlasSettings.storeName);
    console.log('  logo:', atlasSettings.logo ? atlasSettings.logo.substring(0, 80) : 'none');
    console.log('  currency:', atlasSettings.currency);
    console.log('  keys:', Object.keys(atlasSettings).join(', '));
  }

  // 3. Check currencies
  console.log('\n=== CURRENCIES (LOCAL) ===');
  const localCurrencies = await localDb.collection('currencies').find({}).toArray();
  localCurrencies.forEach(c => console.log(`  ${c.code} | ${c.name} | rate: ${c.exchangeRate} | active: ${c.isActive} | default: ${c.isDefault}`));

  console.log('\n=== CURRENCIES (ATLAS) ===');
  const atlasCurrencies = await atlasDb.collection('currencies').find({}).toArray();
  atlasCurrencies.forEach(c => console.log(`  ${c.code} | ${c.name} | rate: ${c.exchangeRate} | active: ${c.isActive} | default: ${c.isDefault}`));

  // 4. Check productarchivesettings
  console.log('\n=== PRODUCT ARCHIVE SETTINGS (LOCAL) ===');
  const localArchive = await localDb.collection('productarchivesettings').findOne({});
  if (localArchive) console.log('  keys:', Object.keys(localArchive).join(', '));

  console.log('\n=== PRODUCT ARCHIVE SETTINGS (ATLAS) ===');
  const atlasArchive = await atlasDb.collection('productarchivesettings').findOne({});
  if (atlasArchive) console.log('  keys:', Object.keys(atlasArchive).join(', '));

  // 5. Check productpagesettings
  console.log('\n=== PRODUCT PAGE SETTINGS (LOCAL) ===');
  const localPage = await localDb.collection('productpagesettings').findOne({});
  if (localPage) console.log('  keys:', Object.keys(localPage).join(', '));

  console.log('\n=== PRODUCT PAGE SETTINGS (ATLAS) ===');
  const atlasPage = await atlasDb.collection('productpagesettings').findOne({});
  if (atlasPage) console.log('  keys:', Object.keys(atlasPage).join(', '));

  // 6. Check homepageconfig
  console.log('\n=== HOMEPAGE CONFIG (LOCAL) ===');
  const localHome = await localDb.collection('homepageconfig').findOne({});
  if (localHome) {
    console.log('  blocks count:', localHome.blocks ? localHome.blocks.length : 0);
    console.log('  keys:', Object.keys(localHome).join(', '));
  }

  console.log('\n=== HOMEPAGE CONFIG (ATLAS) ===');
  const atlasHome = await atlasDb.collection('homepageconfig').findOne({});
  if (atlasHome) {
    console.log('  blocks count:', atlasHome.blocks ? atlasHome.blocks.length : 0);
    console.log('  keys:', Object.keys(atlasHome).join(', '));
  }

  // 7. Check pagetemplates
  console.log('\n=== PAGE TEMPLATES (LOCAL) ===');
  const localTemplates = await localDb.collection('pagetemplates').find({}, { projection: { name: 1, slug: 1, status: 1, isHomePage: 1, isPublished: 1 } }).toArray();
  localTemplates.forEach(t => console.log(`  ${t.name} | slug: ${t.slug} | status: ${t.status} | home: ${t.isHomePage} | published: ${t.isPublished}`));

  console.log('\n=== PAGE TEMPLATES (ATLAS) ===');
  const atlasTemplates = await atlasDb.collection('pagetemplates').find({}, { projection: { name: 1, slug: 1, status: 1, isHomePage: 1, isPublished: 1 } }).toArray();
  atlasTemplates.forEach(t => console.log(`  ${t.name} | slug: ${t.slug} | status: ${t.status} | home: ${t.isHomePage} | published: ${t.isPublished}`));

  // 8. Check pricingrules
  console.log('\n=== PRICING RULES (LOCAL) ===');
  const localPricing = await localDb.collection('pricingrules').find({}).toArray();
  localPricing.forEach(p => console.log(`  ${p.name} | type: ${p.type} | value: ${p.value} | active: ${p.isActive}`));

  console.log('\n=== PRICING RULES (ATLAS) ===');
  const atlasPricing = await atlasDb.collection('pricingrules').find({}).toArray();
  atlasPricing.forEach(p => console.log(`  ${p.name} | type: ${p.type} | value: ${p.value} | active: ${p.isActive}`));

  // 9. Compare settings _id 
  console.log('\n=== ID COMPARISON ===');
  console.log('  Local settings _id:', localSettings?._id?.toString());
  console.log('  Atlas settings _id:', atlasSettings?._id?.toString());
  console.log('  Same?', localSettings?._id?.toString() === atlasSettings?._id?.toString());

  await localConn.close();
  await atlasConn.close();
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
