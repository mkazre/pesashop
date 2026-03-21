/**
 * Re-seed email templates only (without touching any other data).
 * Run:  node scripts/reseed-emails.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/database');
const seedEmailTemplates = require('../seeders/emailTemplates');

(async () => {
  try {
    await connectDB();
    console.log('📧 Re-seeding email templates...');
    await seedEmailTemplates();
    console.log('✅ Done! Email templates have been updated.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
})();
