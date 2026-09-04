const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const axios = require('axios');
let sharp = null; try { sharp = require('sharp'); } catch {}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const USE_BUNNY = (process.env.STORAGE_PROVIDER || 'cloudinary').toLowerCase() === 'bunny';

/* -------- Cloudinary (fallback / legacy) -------- */
function _cloudinaryUpload(source, options = {}) {
  const opts = {
    folder: `pesashop/${options.folder || 'general'}`,
    resource_type: options.resourceType || 'auto',
    use_filename: true, unique_filename: true, timeout: 120000,
  };
  if (options.publicId) opts.public_id = options.publicId;
  return new Promise((resolve, reject) => {
    const done = (err, r) => err ? reject(err) : resolve({
      url: r.secure_url, publicId: r.public_id, width: r.width, height: r.height, size: r.bytes, format: r.format,
    });
    if (Buffer.isBuffer(source)) cloudinary.uploader.upload_stream(opts, done).end(source);
    else cloudinary.uploader.upload(source, opts).then(r => done(null, r)).catch(done);
  });
}
const _cloudinaryDelete = (publicId, resourceType = 'image') =>
  cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
function _cloudinaryPublicId(url) {
  try { const a = url.split('/upload/')[1]; return a ? a.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '') : null; }
  catch { return null; }
}

/* -------- Bunny -------- */
const B_ZONE = process.env.BUNNY_ZONE || 'pesashop-assets';
const B_KEY = process.env.BUNNY_STORAGE_KEY;
const B_ENDPOINT = (process.env.BUNNY_ENDPOINT || 'https://storage.bunnycdn.com').replace(/\/$/, '');
const B_CDN = (process.env.BUNNY_CDN_BASE || 'https://cdn.pesashop.com').replace(/\/$/, '');

async function _bunnyUpload(source, options = {}) {
  const folder = `pesashop/${options.folder || 'general'}`;
  let buf, ext = 'webp';
  if (Buffer.isBuffer(source)) {
    buf = source;
    if (sharp) { try { const m = await sharp(buf).metadata(); if (m.format) ext = m.format === 'jpeg' ? 'jpg' : m.format; } catch {} }
  } else {
    buf = fs.readFileSync(source);
    const m = String(source).match(/\.([a-z0-9]+)$/i); if (m) ext = m[1].toLowerCase();
  }
  const base = options.publicId
    ? String(options.publicId).toLowerCase().replace(/[^a-z0-9.\-_]+/g, '-')
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  const path = `${folder}/${base}.${ext}`;
  await axios.put(`${B_ENDPOINT}/${B_ZONE}/${path}`, buf, {
    headers: { AccessKey: B_KEY, 'Content-Type': 'application/octet-stream' },
    maxBodyLength: Infinity, maxContentLength: Infinity, timeout: 120000,
  });
  let width, height, size = buf.length, format = ext;
  if (sharp) { try { const m = await sharp(buf).metadata(); width = m.width; height = m.height; format = m.format || ext; } catch {} }
  return { url: `${B_CDN}/${path}`, publicId: path, width, height, size, format };
}
const _bunnyPathFromUrl = (url) => { if (!url) return url; const i = url.indexOf('/pesashop/'); return i >= 0 ? url.slice(i + 1) : url; };
async function _bunnyDelete(idOrUrl) {
  const path = idOrUrl && String(idOrUrl).includes('://') ? _bunnyPathFromUrl(idOrUrl) : idOrUrl;
  if (!path) return;
  try { await axios.delete(`${B_ENDPOINT}/${B_ZONE}/${path}`, { headers: { AccessKey: B_KEY }, timeout: 60000 }); }
  catch (e) { if (e.response && e.response.status === 404) return; throw e; }
}

/* -------- Public interface (same names, callers unchanged) -------- */
const uploadToCloudinary = (source, options = {}) => USE_BUNNY ? _bunnyUpload(source, options) : _cloudinaryUpload(source, options);
const deleteFromCloudinary = (idOrUrl, resourceType) => USE_BUNNY ? _bunnyDelete(idOrUrl) : _cloudinaryDelete(idOrUrl, resourceType);
const getPublicIdFromUrl = (url) => USE_BUNNY ? _bunnyPathFromUrl(url) : _cloudinaryPublicId(url);

module.exports = { cloudinary, uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl };
