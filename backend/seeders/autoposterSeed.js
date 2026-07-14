require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const AutoposterCulturalEvent = require('../models/AutoposterCulturalEvent');
const AutoposterBlocklistTerm = require('../models/AutoposterBlocklistTerm');
const AutoposterPostProfile = require('../models/AutoposterPostProfile');

// Idempotent, additive-only seed for the Social Auto-Poster module (Phase 1).
// Safe to run repeatedly: every insert is an upsert keyed on a natural unique
// field, never a deleteMany+recreate like seeders/index.js. Run with:
//   node seeders/autoposterSeed.js

// ─── Cultural events (Spec Section 10.5) ───────────────────────────────────
// categoryIds are left empty — real Category ObjectIds aren't known until an
// admin maps categoryHints to actual categories via the Cultural Calendar
// Manager (Spec Section 12.3). Don't guess IDs here.
const CULTURAL_EVENTS = [
  {
    name: 'Month-end payday',
    recurrence: { type: 'monthly', dayRange: [23, 30] },
    boost: 1.4,
    categoryHints: ['Electronics', 'Fashion', 'Appliances'],
    notes: 'Largest spending window each month; ramp up posting 24h before.'
  },
  {
    name: 'Diaspora return season',
    recurrence: { type: 'annual_range', startMonth: 12, startDay: 15, endMonth: 1, endDay: 15 },
    boost: 1.8,
    categoryHints: ['Gifts', 'Electronics', 'Fashion', 'Alcohol'],
    notes: 'Highest-value window; target global diaspora (UK, US, CA, AU, ZA, EU) ahead of arrival in Zim.'
  },
  {
    name: 'Back-to-school',
    recurrence: { type: 'annual_multi', months: [1, 5, 9] },
    boost: 1.3,
    categoryHints: ['Stationery', 'Uniforms', 'Shoes', 'Bags'],
    notes: 'Three Zim school terms; pre-term posting 2 weeks ahead.'
  },
  {
    name: 'Independence Day',
    recurrence: { type: 'annual', month: 4, day: 18 },
    boost: 1.3,
    categoryHints: ['Apparel', 'Flags', 'Decor'],
    notes: 'Patriotic-themed content; avoid political angles.'
  },
  {
    name: 'Heroes & Defence Forces',
    recurrence: { type: 'annual_nth_weekday', month: 8, weekday: 'monday', nth: 2 },
    boost: 1.2,
    categoryHints: ['Outdoor', 'Leisure', 'Food'],
    notes: 'Long weekend; travel and braai demand.'
  },
  {
    name: 'Unity Day',
    recurrence: { type: 'annual', month: 12, day: 22 },
    boost: 1.3,
    categoryHints: ['Gifts', 'Groceries', 'Alcohol'],
    notes: 'Kicks off festive buying.'
  },
  {
    name: 'Black Friday',
    recurrence: { type: 'annual_last_weekday', month: 11, weekday: 'friday' },
    boost: 2.0,
    categoryHints: [], // all categories
    notes: 'Highest single-day promotional volume. Plan campaigns separately.'
  },
  {
    name: 'Harvest season',
    recurrence: { type: 'annual_range', startMonth: 4, startDay: 1, endMonth: 6, endDay: 30 },
    boost: 1.1,
    categoryHints: ['Storage', 'Dry goods', 'Kitchen'],
    notes: 'Rural-leaning demand; less relevant if PesaShop is urban-only.'
  }
];

// ─── Brand safety blocklist (Spec Section 10.10) ───────────────────────────
// Seeded as category-level placeholders, not specific real-world names — which
// public figures, parties, or events count as politically sensitive is a
// judgment call for MK/an admin to make deliberately via the Blocklist editor
// (Spec Section 12.5), not something to guess here. A handful of generic
// economic/utility terms are included as exact matches since blocklisting them
// is a conservative safety action, not a claim about anyone.
const BLOCKLIST_TERMS = [
  { term: 'political_figures', type: 'category', reason: 'Placeholder category — admin to populate specific names via the Blocklist editor.' },
  { term: 'political_parties', type: 'category', reason: 'Placeholder category — admin to populate specific party names via the Blocklist editor.' },
  { term: 'opposition_movements', type: 'category', reason: 'Placeholder category — admin to populate specific movement names via the Blocklist editor.' },
  { term: 'currency_crisis', type: 'category', reason: 'Placeholder category — admin to populate specific currency-crisis terms via the Blocklist editor.' },
  { term: 'religious_controversy', type: 'category', reason: 'Placeholder category — admin to populate specific terms via the Blocklist editor.' },
  { term: 'tribal_references', type: 'category', reason: 'Placeholder category — admin to populate specific terms via the Blocklist editor.' },
  { term: 'sanctions', type: 'exact', reason: 'Frequently politically charged in Zimbabwean discourse.' },
  { term: 'fuel queue', type: 'exact', reason: 'Fuel-shortage references carry political blame narratives.' },
  { term: 'load shedding', type: 'exact', reason: 'ZESA outage references carry political blame narratives.' },
  { term: 'zesa outage', type: 'exact', reason: 'ZESA outage references carry political blame narratives.' }
];

// ─── Starter product post profiles (Spec Section 9.5.3) ───────────────────
const POST_PROFILES = [
  {
    name: 'Default',
    isDefault: true,
    config: {
      images: 'featured_only',
      productName: 'include',
      price: 'show',
      currency: 'ZAR',
      discountInfo: 'show',
      shortDescription: 'include',
      categoryTags: 'hashtags',
      productUrl: 'shortened',
      utmTracking: 'auto_tag',
      ctaPhrase: 'shop_now'
    }
  },
  {
    name: 'Diaspora',
    isDefault: false,
    config: {
      images: 'featured_plus_gallery',
      galleryCount: 2,
      productName: 'include',
      price: 'show',
      currency: 'multi',
      stockStatus: 'hide',
      productUrl: 'shortened',
      utmTracking: 'auto_tag',
      deliveryInfo: 'region_aware',
      ctaPhrase: 'send_to_family'
    }
  },
  {
    name: 'Premium / High-Ticket',
    isDefault: false,
    config: {
      images: 'featured_plus_gallery',
      galleryCount: 4,
      productName: 'include',
      price: 'hide', // drives DM enquiry
      fullDescription: 'include',
      ratingReviews: 'show',
      ratingThreshold: 4,
      brandWatermark: 'on'
    }
  },
  {
    name: 'Flash Sale',
    isDefault: false,
    config: {
      images: 'featured_only',
      productName: 'abbreviate',
      price: 'show',
      discountInfo: 'show',
      stockStatus: 'show_if_low',
      shortDescription: 'exclude',
      ctaPhrase: 'custom',
      customCtaText: 'Limited — grab today'
    }
  },
  {
    name: 'Stealth',
    isDefault: false,
    config: {
      images: 'featured_only',
      productName: 'exclude',
      price: 'hide',
      shortDescription: 'exclude',
      fullDescription: 'exclude',
      categoryTags: 'exclude',
      stockStatus: 'hide',
      productUrl: 'hide',
      ctaPhrase: 'none'
    }
  }
];

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const admin = await User.findOne({ role: 'admin' });

    console.log('🗓️  Seeding cultural events...');
    let eventsCreated = 0;
    for (const event of CULTURAL_EVENTS) {
      const res = await AutoposterCulturalEvent.updateOne(
        { name: event.name },
        { $setOnInsert: event },
        { upsert: true }
      );
      if (res.upsertedCount) eventsCreated++;
    }
    console.log(`   ${eventsCreated} created, ${CULTURAL_EVENTS.length - eventsCreated} already present`);

    console.log('🚫 Seeding brand-safety blocklist...');
    let blocklistCreated = 0;
    for (const entry of BLOCKLIST_TERMS) {
      const res = await AutoposterBlocklistTerm.updateOne(
        { term: entry.term, type: entry.type },
        { $setOnInsert: { ...entry, addedBy: admin?._id } },
        { upsert: true }
      );
      if (res.upsertedCount) blocklistCreated++;
    }
    console.log(`   ${blocklistCreated} created, ${BLOCKLIST_TERMS.length - blocklistCreated} already present`);

    console.log('📋 Seeding starter post profiles...');
    let profilesCreated = 0;
    for (const profile of POST_PROFILES) {
      const res = await AutoposterPostProfile.updateOne(
        { name: profile.name },
        { $setOnInsert: { ...profile, createdBy: admin?._id } },
        { upsert: true }
      );
      if (res.upsertedCount) profilesCreated++;
    }
    console.log(`   ${profilesCreated} created, ${POST_PROFILES.length - profilesCreated} already present`);

    console.log('✅ Autoposter seed complete');
    process.exit(0);
  } catch (error) {
    console.error('Autoposter seed error:', error);
    process.exit(1);
  }
}

run();
