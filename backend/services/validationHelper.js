const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const Order = require('../models/Order');
const slugify = require('slugify');

async function buildLookupMaps(type) {
  const maps = {};
  if (type === 'products') {
    const products = await Product.find({}, 'sku slug name').lean();
    maps.bySku = new Map();
    maps.bySlug = new Map();
    maps.byName = new Map();
    for (const p of products) {
      if (p.sku) maps.bySku.set(p.sku.toUpperCase(), p);
      if (p.slug) maps.bySlug.set(p.slug, p);
      if (p.name) maps.byName.set(p.name, p);
    }
  } else if (type === 'categories') {
    const cats = await Category.find({}, 'name slug').lean();
    maps.bySlug = new Map();
    maps.byName = new Map();
    for (const c of cats) {
      if (c.slug) maps.bySlug.set(c.slug, c);
      if (c.name) maps.byName.set(c.name, c);
    }
  } else if (type === 'customers') {
    const users = await User.find({}, 'email firstName lastName').lean();
    maps.byEmail = new Map();
    for (const u of users) {
      if (u.email) maps.byEmail.set(u.email.toLowerCase(), u);
    }
  } else if (type === 'orders') {
    const orders = await Order.find({}, 'orderNumber total').lean();
    maps.byOrderNum = new Map();
    for (const o of orders) {
      if (o.orderNumber) maps.byOrderNum.set(String(o.orderNumber), o);
    }
  }
  return maps;
}

function checkDuplicateFast(row, type, maps) {
  if (type === 'products') {
    const sku = row.sku || row.SKU;
    if (sku && maps.bySku && maps.bySku.has(sku.toUpperCase())) return maps.bySku.get(sku.toUpperCase());
    const slug = row.post_name || row.slug;
    if (slug && maps.bySlug && maps.bySlug.has(slug)) return maps.bySlug.get(slug);
    const name = row.post_title || row.Name || row.name;
    if (name && maps.byName && maps.byName.has(name)) return maps.byName.get(name);
  } else if (type === 'categories') {
    const catName = row.Name || row.name;
    if (catName) {
      const slug = slugify(catName, { lower: true, strict: true });
      if (maps.bySlug && maps.bySlug.has(slug)) return maps.bySlug.get(slug);
      if (maps.byName && maps.byName.has(catName)) return maps.byName.get(catName);
    }
  } else if (type === 'customers') {
    const email = (row.Email || row.email || '').toLowerCase();
    if (email && maps.byEmail && maps.byEmail.has(email)) return maps.byEmail.get(email);
  } else if (type === 'orders') {
    const num = String(row.order_number || row['Order Number'] || row.orderNumber || '');
    if (num && maps.byOrderNum && maps.byOrderNum.has(num)) return maps.byOrderNum.get(num);
  }
  return null;
}

module.exports = { buildLookupMaps, checkDuplicateFast };
