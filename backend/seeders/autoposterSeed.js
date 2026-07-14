require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const AutoposterCulturalEvent = require('../models/AutoposterCulturalEvent');
const AutoposterBlocklistTerm = require('../models/AutoposterBlocklistTerm');
const AutoposterPostProfile = require('../models/AutoposterPostProfile');
const AutoposterDesign = require('../models/AutoposterDesign');

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

// ─── Visual Post Designer starter templates (Spec Section 7.6) ────────────
// Simple, real, editable layer trees — not empty placeholders — using
// PesaShop's admin-UI brand tokens (Phase 0 decision: existing Tailwind
// primary/secondary, not the spec's email-only hex values). Each is a real
// AutoposterDesign document with templateFlag:true, ready to duplicate and
// customise from the Designer (Spec 7.6, 7.9).
const BRAND_GREEN = '#0e604a';
const BRAND_GOLD = '#f7bd20';

function layer(type, props) {
  return { id: `${type}-${Math.random().toString(36).slice(2, 9)}`, type, ...props };
}

const DESIGN_TEMPLATES = [
  {
    title: 'New Arrival',
    canvasPreset: 'instagram_feed_portrait',
    canvasWidth: 1080,
    canvasHeight: 1350,
    templateFlag: true,
    tags: ['new-arrival'],
    layers: [
      layer('background', { fill: '#eceae6' }),
      layer('shape', { shape: 'rect', x: 40, y: 40, width: 260, height: 70, fill: BRAND_GREEN, cornerRadius: 8 }),
      layer('text', { x: 60, y: 60, width: 220, text: 'NEW ARRIVAL', fontSize: 28, fontFamily: 'Inter', fill: '#ffffff', fontStyle: 'bold' }),
      layer('image', { x: 90, y: 200, width: 900, height: 900, url: '' }),
      layer('shape', { shape: 'rect', x: 700, y: 1120, width: 320, height: 100, fill: BRAND_GOLD, cornerRadius: 8 }),
      layer('text', { x: 720, y: 1150, width: 280, text: 'R000.00', fontSize: 36, fontFamily: 'Inter', fill: BRAND_GREEN, fontStyle: 'bold' })
    ]
  },
  {
    title: 'Flash Sale',
    canvasPreset: 'instagram_feed_square',
    canvasWidth: 1080,
    canvasHeight: 1080,
    templateFlag: true,
    tags: ['flash-sale'],
    layers: [
      layer('background', { fill: BRAND_GREEN }),
      layer('text', { x: 90, y: 350, width: 900, text: '50% OFF', fontSize: 140, fontFamily: 'Inter', fill: BRAND_GOLD, fontStyle: 'bold', align: 'center' }),
      layer('text', { x: 90, y: 520, width: 900, text: 'Today only — while stocks last', fontSize: 36, fontFamily: 'Inter', fill: '#ffffff', align: 'center' })
    ]
  },
  {
    title: 'Back in Stock',
    canvasPreset: 'instagram_feed_square',
    canvasWidth: 1080,
    canvasHeight: 1080,
    templateFlag: true,
    tags: ['back-in-stock'],
    layers: [
      layer('background', { fill: '#ffffff' }),
      layer('image', { x: 90, y: 90, width: 900, height: 750, url: '' }),
      layer('shape', { shape: 'rect', x: 90, y: 880, width: 300, height: 80, fill: BRAND_GREEN, cornerRadius: 40 }),
      layer('text', { x: 110, y: 902, width: 260, text: 'Back in Stock', fontSize: 26, fontFamily: 'Inter', fill: '#ffffff', fontStyle: 'bold' })
    ]
  },
  {
    title: 'Festive Greeting',
    canvasPreset: 'instagram_feed_square',
    canvasWidth: 1080,
    canvasHeight: 1080,
    templateFlag: true,
    tags: ['festive', 'seasonal'],
    layers: [
      layer('background', { fill: BRAND_GREEN }),
      layer('text', { x: 90, y: 440, width: 900, text: 'Happy Holidays\nfrom PesaShop', fontSize: 64, fontFamily: 'Playfair Display', fill: BRAND_GOLD, align: 'center', fontStyle: 'bold' })
    ]
  },
  {
    title: 'Diaspora Special',
    canvasPreset: 'instagram_feed_portrait',
    canvasWidth: 1080,
    canvasHeight: 1350,
    templateFlag: true,
    tags: ['diaspora'],
    layers: [
      layer('background', { fill: '#eceae6' }),
      layer('image', { x: 90, y: 150, width: 900, height: 700, url: '' }),
      layer('text', { x: 90, y: 900, width: 900, text: 'For family back home', fontSize: 48, fontFamily: 'Inter', fill: BRAND_GREEN, fontStyle: 'bold', align: 'center' }),
      layer('text', { x: 90, y: 980, width: 900, text: 'Delivered anywhere in Zimbabwe', fontSize: 28, fontFamily: 'Inter', fill: '#333333', align: 'center' })
    ]
  },
  {
    title: 'Quote / Testimonial',
    canvasPreset: 'instagram_feed_square',
    canvasWidth: 1080,
    canvasHeight: 1080,
    templateFlag: true,
    tags: ['testimonial', 'reviews'],
    layers: [
      layer('background', { fill: '#ffffff' }),
      layer('image', { x: 440, y: 80, width: 200, height: 200, url: '' }),
      layer('text', { x: 340, y: 300, width: 400, text: '★★★★★', fontSize: 36, fontFamily: 'Inter', fill: BRAND_GOLD, align: 'center' }),
      layer('text', { x: 140, y: 400, width: 800, text: '"Absolutely love this product — fast delivery and great quality!"', fontSize: 32, fontFamily: 'Inter', fill: '#333333', align: 'center', fontStyle: 'italic' })
    ]
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

    console.log('🎨 Seeding starter design templates...');
    let designsCreated = 0;
    for (const design of DESIGN_TEMPLATES) {
      const res = await AutoposterDesign.updateOne(
        { title: design.title, templateFlag: true },
        { $setOnInsert: { ...design, createdBy: admin?._id } },
        { upsert: true }
      );
      if (res.upsertedCount) designsCreated++;
    }
    console.log(`   ${designsCreated} created, ${DESIGN_TEMPLATES.length - designsCreated} already present`);

    console.log('✅ Autoposter seed complete');
    process.exit(0);
  } catch (error) {
    console.error('Autoposter seed error:', error);
    process.exit(1);
  }
}

run();
