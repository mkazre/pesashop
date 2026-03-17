/**
 * Migration script: Upload all local images to Cloudinary and update DB URLs
 * 
 * Usage: node scripts/migrate-to-cloudinary.js
 * 
 * This script:
 * 1. Connects to the Atlas DB (via .env MONGODB_URI)
 * 2. Scans all collections for image paths starting with /uploads/
 * 3. Uploads each unique file to Cloudinary
 * 4. Updates all DB records with Cloudinary URLs
 * 5. Saves progress to a JSON file so it can resume if interrupted
 */

require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');

// ── Cloudinary config ─────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Production Atlas URI (pesashop database)
const ATLAS_URI = process.env.MONGODB_URI_PROD || process.env.MONGODB_URI;

const UPLOADS_BASE = path.join(__dirname, '../uploads');
const PROGRESS_FILE = path.join(__dirname, '../migration-progress.json');
const CONCURRENCY = 5; // concurrent uploads

// ── Helpers ───────────────────────────────────────────────────────
function loadProgress() {
  if (fs.existsSync(PROGRESS_FILE)) {
    return JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'));
  }
  return { uploaded: {}, failed: [], phase: 'upload' };
}

function saveProgress(progress) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

async function uploadToCloudinary(localPath, folder) {
  const result = await cloudinary.uploader.upload(localPath, {
    folder: `pesashop/${folder}`,
    resource_type: 'auto',
    timeout: 120000,
    use_filename: true,
    unique_filename: true,
  });
  return result.secure_url;
}

async function processInBatches(items, batchSize, fn) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(fn));
    results.push(...batchResults);
  }
  return results;
}

// ── Phase 1: Collect all unique image paths from DB ───────────────
async function collectAllImagePaths(db) {
  const paths = new Set();

  // 1. Products: images[], featuredImage, variations[].image
  console.log('  Scanning products...');
  const products = await db.collection('products').find({}, {
    projection: { images: 1, featuredImage: 1, variations: 1 }
  }).toArray();
  
  for (const p of products) {
    if (p.featuredImage && typeof p.featuredImage === 'string' && p.featuredImage.startsWith('/uploads/')) {
      paths.add(p.featuredImage);
    }
    if (Array.isArray(p.images)) {
      for (const img of p.images) {
        if (typeof img === 'string' && img.startsWith('/uploads/')) paths.add(img);
      }
    }
    if (Array.isArray(p.variations)) {
      for (const v of p.variations) {
        if (v.image && typeof v.image === 'string' && v.image.startsWith('/uploads/')) paths.add(v.image);
      }
    }
  }
  console.log(`    Found ${paths.size} unique paths so far (products: ${products.length})`);

  // 2. Categories: image.url, iconImage.url, bannerImage.url
  console.log('  Scanning categories...');
  const categories = await db.collection('categories').find({}).toArray();
  for (const c of categories) {
    if (c.image?.url && c.image.url.startsWith('/uploads/')) paths.add(c.image.url);
    if (c.iconImage?.url && c.iconImage.url.startsWith('/uploads/')) paths.add(c.iconImage.url);
    if (c.bannerImage?.url && c.bannerImage.url.startsWith('/uploads/')) paths.add(c.bannerImage.url);
  }

  // 3. HomePageConfig: blocks[].slides[].image, blocks[].sideBannerImage, blocks[].banners[].image, blocks[].features[].iconImage
  console.log('  Scanning homepageconfig...');
  const hpConfigs = await db.collection('homepageconfig').find({}).toArray();
  for (const hp of hpConfigs) {
    if (Array.isArray(hp.blocks)) {
      for (const block of hp.blocks) {
        if (block.sideBannerImage && block.sideBannerImage.startsWith('/uploads/')) paths.add(block.sideBannerImage);
        if (Array.isArray(block.slides)) {
          for (const s of block.slides) {
            if (s.image && s.image.startsWith('/uploads/')) paths.add(s.image);
          }
        }
        if (Array.isArray(block.banners)) {
          for (const b of block.banners) {
            if (b.image && b.image.startsWith('/uploads/')) paths.add(b.image);
          }
        }
        if (Array.isArray(block.features)) {
          for (const f of block.features) {
            if (f.iconImage && f.iconImage.startsWith('/uploads/')) paths.add(f.iconImage);
          }
        }
      }
    }
  }

  // 4. Badges: style.imageUrl
  console.log('  Scanning badges...');
  const badges = await db.collection('badges').find({}).toArray();
  for (const b of badges) {
    if (b.style?.imageUrl && b.style.imageUrl.startsWith('/uploads/')) paths.add(b.style.imageUrl);
  }

  // 5. LoyaltyBanners: image
  console.log('  Scanning loyaltybanners...');
  const banners = await db.collection('loyaltybanners').find({}).toArray();
  for (const b of banners) {
    if (b.image && typeof b.image === 'string' && b.image.startsWith('/uploads/')) paths.add(b.image);
  }

  // 6. Menus: items with image, backgroundImage, logo.stickyLogo
  console.log('  Scanning menus...');
  const menus = await db.collection('menus').find({}).toArray();
  const scanMenuItems = (items) => {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      if (item.image && item.image.startsWith('/uploads/')) paths.add(item.image);
      if (item.megaMenu?.backgroundImage && item.megaMenu.backgroundImage.startsWith('/uploads/')) {
        paths.add(item.megaMenu.backgroundImage);
      }
      if (item.children) scanMenuItems(item.children);
    }
  };
  for (const m of menus) {
    scanMenuItems(m.items);
    if (m.settings?.logo?.stickyLogo && m.settings.logo.stickyLogo.startsWith('/uploads/')) {
      paths.add(m.settings.logo.stickyLogo);
    }
  }

  // 7. ProductArchiveSettings: header.defaultBannerImage, sidebar.sidebarBannerImage
  console.log('  Scanning productarchivesettings...');
  const archiveSettings = await db.collection('productarchivesettings').find({}).toArray();
  for (const s of archiveSettings) {
    if (s.header?.defaultBannerImage && s.header.defaultBannerImage.startsWith('/uploads/')) {
      paths.add(s.header.defaultBannerImage);
    }
    if (s.sidebar?.sidebarBannerImage && s.sidebar.sidebarBannerImage.startsWith('/uploads/')) {
      paths.add(s.sidebar.sidebarBannerImage);
    }
  }

  // 8. ProductPageSettings: paymentMethods[].image
  console.log('  Scanning productpagesettings...');
  const ppSettings = await db.collection('productpagesettings').find({}).toArray();
  for (const s of ppSettings) {
    if (Array.isArray(s.paymentMethods)) {
      for (const pm of s.paymentMethods) {
        if (pm.image && pm.image.startsWith('/uploads/')) paths.add(pm.image);
      }
    }
  }

  // 9. Settings (general): scan for any /uploads/ strings
  console.log('  Scanning settings...');
  const settings = await db.collection('settings').find({}).toArray();
  const scanObj = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string' && val.startsWith('/uploads/')) paths.add(val);
      else if (typeof val === 'object' && val !== null) scanObj(val);
    }
  };
  for (const s of settings) {
    scanObj(s);
  }

  // 10. PageTemplates: seo.ogImage, and scan content for /uploads/ paths
  console.log('  Scanning pagetemplates...');
  const templates = await db.collection('pagetemplates').find({}).toArray();
  for (const t of templates) {
    if (t.seo?.ogImage && t.seo.ogImage.startsWith('/uploads/')) paths.add(t.seo.ogImage);
    // Scan serialized content for image URLs
    if (t.content && typeof t.content === 'string') {
      const matches = t.content.match(/\/uploads\/[^\s"'<>]+/g);
      if (matches) matches.forEach(m => paths.add(m));
    }
    if (typeof t.content === 'object') scanObj(t.content);
  }

  // 11. PageVersions: scan content
  console.log('  Scanning pageversions...');
  const versions = await db.collection('pageversions').find({}).toArray();
  for (const v of versions) {
    if (typeof v.content === 'string') {
      const matches = v.content.match(/\/uploads\/[^\s"'<>]+/g);
      if (matches) matches.forEach(m => paths.add(m));
    }
    if (typeof v.content === 'object') scanObj(v.content);
  }

  // 12. Media collection
  console.log('  Scanning media...');
  const mediaItems = await db.collection('media').find({}).toArray();
  for (const m of mediaItems) {
    if (m.url && typeof m.url === 'string' && m.url.startsWith('/uploads/')) paths.add(m.url);
    if (m.path && typeof m.path === 'string' && m.path.startsWith('/uploads/')) paths.add(m.path);
  }

  // 13. Reviews: scan for images
  console.log('  Scanning reviews...');
  const reviews = await db.collection('reviews').find({}).toArray();
  for (const r of reviews) {
    if (Array.isArray(r.images)) {
      for (const img of r.images) {
        if (typeof img === 'string' && img.startsWith('/uploads/')) paths.add(img);
        if (img?.url && img.url.startsWith('/uploads/')) paths.add(img.url);
      }
    }
  }

  return paths;
}

// ── Phase 2: Upload to Cloudinary ─────────────────────────────────
async function uploadAllImages(imagePaths, progress) {
  const toUpload = [...imagePaths].filter(p => !progress.uploaded[p]);
  console.log(`\n📤 Uploading ${toUpload.length} images to Cloudinary (${Object.keys(progress.uploaded).length} already done)...\n`);

  let completed = 0;
  const total = toUpload.length;

  await processInBatches(toUpload, CONCURRENCY, async (imgPath) => {
    // Determine local file path
    const localPath = path.join(UPLOADS_BASE, imgPath.replace('/uploads/', ''));
    
    if (!fs.existsSync(localPath)) {
      completed++;
      console.log(`  [${completed}/${total}] ⚠ File not found: ${imgPath}`);
      progress.failed.push({ path: imgPath, reason: 'File not found locally' });
      saveProgress(progress);
      return;
    }

    try {
      // Determine folder from path
      const folder = imgPath.split('/')[2] || 'general'; // /uploads/products/... → products
      const cloudinaryUrl = await uploadToCloudinary(localPath, folder);
      progress.uploaded[imgPath] = cloudinaryUrl;
      completed++;
      if (completed % 50 === 0 || completed === total) {
        console.log(`  [${completed}/${total}] ✓ Uploaded (latest: ${path.basename(imgPath)})`);
        saveProgress(progress);
      }
    } catch (err) {
      completed++;
      console.log(`  [${completed}/${total}] ✗ Failed: ${imgPath} — ${err.message}`);
      progress.failed.push({ path: imgPath, reason: err.message });
      saveProgress(progress);
    }
  });

  saveProgress(progress);
  console.log(`\n✅ Upload phase complete: ${Object.keys(progress.uploaded).length} uploaded, ${progress.failed.length} failed\n`);
}

// ── Phase 3: Update DB records ────────────────────────────────────
async function updateDatabase(db, urlMap) {
  console.log('🔄 Updating database records...\n');

  // Helper: replace old URL with new in a string
  const replaceUrl = (str) => {
    if (typeof str !== 'string' || !str.startsWith('/uploads/')) return str;
    return urlMap[str] || str;
  };

  // Helper: deep-replace /uploads/ paths in an object
  const deepReplace = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(deepReplace);
    const result = {};
    for (const [key, val] of Object.entries(obj)) {
      if (typeof val === 'string' && val.startsWith('/uploads/')) {
        result[key] = urlMap[val] || val;
      } else if (typeof val === 'string') {
        // Replace embedded /uploads/ paths in HTML/JSON content
        let replaced = val;
        for (const [oldPath, newUrl] of Object.entries(urlMap)) {
          if (replaced.includes(oldPath)) {
            replaced = replaced.split(oldPath).join(newUrl);
          }
        }
        result[key] = replaced;
      } else if (typeof val === 'object' && val !== null) {
        result[key] = deepReplace(val);
      } else {
        result[key] = val;
      }
    }
    return result;
  };

  // 1. Products
  console.log('  Updating products...');
  const products = await db.collection('products').find({
    $or: [
      { featuredImage: { $regex: '^/uploads/' } },
      { images: { $regex: '^/uploads/' } },
      { 'variations.image': { $regex: '^/uploads/' } }
    ]
  }).toArray();

  let prodCount = 0;
  for (const p of products) {
    const update = {};
    if (p.featuredImage && urlMap[p.featuredImage]) {
      update.featuredImage = urlMap[p.featuredImage];
    }
    if (Array.isArray(p.images)) {
      update.images = p.images.map(img => urlMap[img] || img);
    }
    if (Array.isArray(p.variations)) {
      update.variations = p.variations.map(v => ({
        ...v,
        image: v.image ? (urlMap[v.image] || v.image) : v.image
      }));
    }
    if (Object.keys(update).length > 0) {
      await db.collection('products').updateOne({ _id: p._id }, { $set: update });
      prodCount++;
    }
  }
  console.log(`    Updated ${prodCount} products`);

  // 2. Categories
  console.log('  Updating categories...');
  const categories = await db.collection('categories').find({}).toArray();
  let catCount = 0;
  for (const c of categories) {
    const update = {};
    if (c.image?.url && urlMap[c.image.url]) {
      update['image.url'] = urlMap[c.image.url];
    }
    if (c.iconImage?.url && urlMap[c.iconImage.url]) {
      update['iconImage.url'] = urlMap[c.iconImage.url];
    }
    if (c.bannerImage?.url && urlMap[c.bannerImage.url]) {
      update['bannerImage.url'] = urlMap[c.bannerImage.url];
    }
    if (Object.keys(update).length > 0) {
      await db.collection('categories').updateOne({ _id: c._id }, { $set: update });
      catCount++;
    }
  }
  console.log(`    Updated ${catCount} categories`);

  // 3. HomePageConfig
  console.log('  Updating homepageconfig...');
  const hpConfigs = await db.collection('homepageconfig').find({}).toArray();
  for (const hp of hpConfigs) {
    if (Array.isArray(hp.blocks)) {
      const updatedBlocks = hp.blocks.map(block => {
        const updated = { ...block };
        if (updated.sideBannerImage && urlMap[updated.sideBannerImage]) {
          updated.sideBannerImage = urlMap[updated.sideBannerImage];
        }
        if (Array.isArray(updated.slides)) {
          updated.slides = updated.slides.map(s => ({
            ...s,
            image: s.image ? (urlMap[s.image] || s.image) : s.image
          }));
        }
        if (Array.isArray(updated.banners)) {
          updated.banners = updated.banners.map(b => ({
            ...b,
            image: b.image ? (urlMap[b.image] || b.image) : b.image
          }));
        }
        if (Array.isArray(updated.features)) {
          updated.features = updated.features.map(f => ({
            ...f,
            iconImage: f.iconImage ? (urlMap[f.iconImage] || f.iconImage) : f.iconImage
          }));
        }
        return updated;
      });
      await db.collection('homepageconfig').updateOne({ _id: hp._id }, { $set: { blocks: updatedBlocks } });
    }
  }

  // 4. Badges
  console.log('  Updating badges...');
  const badges = await db.collection('badges').find({}).toArray();
  for (const b of badges) {
    if (b.style?.imageUrl && urlMap[b.style.imageUrl]) {
      await db.collection('badges').updateOne({ _id: b._id }, { $set: { 'style.imageUrl': urlMap[b.style.imageUrl] } });
    }
  }

  // 5. LoyaltyBanners
  console.log('  Updating loyaltybanners...');
  const lBanners = await db.collection('loyaltybanners').find({}).toArray();
  for (const b of lBanners) {
    if (b.image && urlMap[b.image]) {
      await db.collection('loyaltybanners').updateOne({ _id: b._id }, { $set: { image: urlMap[b.image] } });
    }
  }

  // 6. Menus
  console.log('  Updating menus...');
  const menus = await db.collection('menus').find({}).toArray();
  const updateMenuItems = (items) => {
    if (!Array.isArray(items)) return items;
    return items.map(item => {
      const updated = { ...item };
      if (updated.image && urlMap[updated.image]) updated.image = urlMap[updated.image];
      if (updated.megaMenu?.backgroundImage && urlMap[updated.megaMenu.backgroundImage]) {
        updated.megaMenu = { ...updated.megaMenu, backgroundImage: urlMap[updated.megaMenu.backgroundImage] };
      }
      if (updated.children) updated.children = updateMenuItems(updated.children);
      return updated;
    });
  };
  for (const m of menus) {
    const update = {};
    if (m.items) update.items = updateMenuItems(m.items);
    if (m.settings?.logo?.stickyLogo && urlMap[m.settings.logo.stickyLogo]) {
      update['settings.logo.stickyLogo'] = urlMap[m.settings.logo.stickyLogo];
    }
    if (Object.keys(update).length > 0) {
      await db.collection('menus').updateOne({ _id: m._id }, { $set: update });
    }
  }

  // 7. ProductArchiveSettings
  console.log('  Updating productarchivesettings...');
  const archSettings = await db.collection('productarchivesettings').find({}).toArray();
  for (const s of archSettings) {
    const update = {};
    if (s.header?.defaultBannerImage && urlMap[s.header.defaultBannerImage]) {
      update['header.defaultBannerImage'] = urlMap[s.header.defaultBannerImage];
    }
    if (s.sidebar?.sidebarBannerImage && urlMap[s.sidebar.sidebarBannerImage]) {
      update['sidebar.sidebarBannerImage'] = urlMap[s.sidebar.sidebarBannerImage];
    }
    if (Object.keys(update).length > 0) {
      await db.collection('productarchivesettings').updateOne({ _id: s._id }, { $set: update });
    }
  }

  // 8. ProductPageSettings
  console.log('  Updating productpagesettings...');
  const ppSettings = await db.collection('productpagesettings').find({}).toArray();
  for (const s of ppSettings) {
    if (Array.isArray(s.paymentMethods)) {
      const updated = s.paymentMethods.map(pm => ({
        ...pm,
        image: pm.image ? (urlMap[pm.image] || pm.image) : pm.image
      }));
      await db.collection('productpagesettings').updateOne({ _id: s._id }, { $set: { paymentMethods: updated } });
    }
  }

  // 9. Settings (deep replace)
  console.log('  Updating settings...');
  const settings = await db.collection('settings').find({}).toArray();
  for (const s of settings) {
    const replaced = deepReplace(s);
    delete replaced._id;
    await db.collection('settings').updateOne({ _id: s._id }, { $set: replaced });
  }

  // 10. PageTemplates & PageVersions (content may contain embedded paths)
  console.log('  Updating pagetemplates...');
  const templates = await db.collection('pagetemplates').find({}).toArray();
  for (const t of templates) {
    const update = {};
    if (t.seo?.ogImage && urlMap[t.seo.ogImage]) {
      update['seo.ogImage'] = urlMap[t.seo.ogImage];
    }
    // Replace paths in content (string or object)
    if (typeof t.content === 'string') {
      let content = t.content;
      for (const [oldPath, newUrl] of Object.entries(urlMap)) {
        if (content.includes(oldPath)) content = content.split(oldPath).join(newUrl);
      }
      if (content !== t.content) update.content = content;
    } else if (typeof t.content === 'object' && t.content !== null) {
      update.content = deepReplace(t.content);
    }
    if (Object.keys(update).length > 0) {
      await db.collection('pagetemplates').updateOne({ _id: t._id }, { $set: update });
    }
  }

  console.log('  Updating pageversions...');
  const versions = await db.collection('pageversions').find({}).toArray();
  for (const v of versions) {
    const update = {};
    if (typeof v.content === 'string') {
      let content = v.content;
      for (const [oldPath, newUrl] of Object.entries(urlMap)) {
        if (content.includes(oldPath)) content = content.split(oldPath).join(newUrl);
      }
      if (content !== v.content) update.content = content;
    } else if (typeof v.content === 'object' && v.content !== null) {
      update.content = deepReplace(v.content);
    }
    if (Object.keys(update).length > 0) {
      await db.collection('pageversions').updateOne({ _id: v._id }, { $set: update });
    }
  }

  // 11. Media
  console.log('  Updating media...');
  const mediaItems = await db.collection('media').find({}).toArray();
  for (const m of mediaItems) {
    const update = {};
    if (m.url && urlMap[m.url]) update.url = urlMap[m.url];
    if (m.path && urlMap[m.path]) update.path = urlMap[m.path];
    if (Object.keys(update).length > 0) {
      await db.collection('media').updateOne({ _id: m._id }, { $set: update });
    }
  }

  // 12. Reviews
  console.log('  Updating reviews...');
  const reviews = await db.collection('reviews').find({}).toArray();
  for (const r of reviews) {
    if (Array.isArray(r.images)) {
      const updated = r.images.map(img => {
        if (typeof img === 'string') return urlMap[img] || img;
        if (img?.url) return { ...img, url: urlMap[img.url] || img.url };
        return img;
      });
      await db.collection('reviews').updateOne({ _id: r._id }, { $set: { images: updated } });
    }
  }

  console.log('\n✅ Database update complete!\n');
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   PesaShop — Cloudinary Image Migration             ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Connect to MongoDB
  console.log('Connecting to MongoDB Atlas (pesashop)...');
  await mongoose.connect(ATLAS_URI);
  const db = mongoose.connection.db;
  console.log(`Connected to: ${db.databaseName}\n`);

  // Load progress (for resume support)
  const progress = loadProgress();

  if (progress.phase === 'upload' || progress.phase === undefined) {
    // Phase 1: Collect image paths
    console.log('📋 Phase 1: Collecting all image paths from database...\n');
    const imagePaths = await collectAllImagePaths(db);
    console.log(`\n📊 Total unique image paths found: ${imagePaths.size}\n`);

    // Phase 2: Upload to Cloudinary
    console.log('📤 Phase 2: Uploading images to Cloudinary...\n');
    await uploadAllImages(imagePaths, progress);
    progress.phase = 'update';
    saveProgress(progress);
  }

  // Phase 3: Update database
  console.log('🔄 Phase 3: Updating database records...\n');
  await updateDatabase(db, progress.uploaded);

  // Summary
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Migration Complete!                               ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  ✅ Images uploaded: ${Object.keys(progress.uploaded).length}`);
  console.log(`  ❌ Failed uploads: ${progress.failed.length}`);
  if (progress.failed.length > 0) {
    console.log('  Failed files:');
    progress.failed.forEach(f => console.log(`    - ${f.path}: ${f.reason}`));
  }
  console.log('');

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
