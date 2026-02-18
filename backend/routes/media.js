const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { protect, authorize } = require('../middleware/auth');
const Media = require('../models/Media');

const MEDIA_DIR = path.join(__dirname, '../uploads/media');
const THUMB_DIR = path.join(__dirname, '../uploads/media/thumbnails');

[MEDIA_DIR, THUMB_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, MEDIA_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp|svg|bmp|tiff|ico|mp4|webm|ogg|mp3|wav|pdf|doc|docx|xls|xlsx|zip/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/') || file.mimetype.startsWith('audio/');
  if (extname || mimetype) return cb(null, true);
  cb(new Error('File type not supported'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 50 * 1024 * 1024 } });

// Generate thumbnail
async function generateThumbnail(filePath, filename) {
  try {
    const thumbPath = path.join(THUMB_DIR, `thumb-${filename}`);
    const ext = path.extname(filename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext)) {
      await sharp(filePath)
        .resize(300, 300, { fit: 'cover', position: 'center' })
        .toFile(thumbPath);
      return `/uploads/media/thumbnails/thumb-${filename}`;
    }
    return null;
  } catch (err) {
    console.error('Thumbnail generation failed:', err.message);
    return null;
  }
}

// Get image dimensions
async function getImageDimensions(filePath) {
  try {
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'].includes(ext)) {
      const metadata = await sharp(filePath).metadata();
      return { width: metadata.width, height: metadata.height };
    }
    return { width: null, height: null };
  } catch (err) {
    return { width: null, height: null };
  }
}

// ─── Upload single file ─────────────────────────────────────────

router.post('/upload', protect, authorize('admin'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

    const filePath = req.file.path;
    const { width, height } = await getImageDimensions(filePath);
    const thumbnailUrl = await generateThumbnail(filePath, req.file.filename);

    const media = await Media.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      url: `/uploads/media/${req.file.filename}`,
      thumbnailUrl,
      mimeType: req.file.mimetype,
      size: req.file.size,
      width,
      height,
      alt: req.body.alt || '',
      title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ''),
      caption: req.body.caption || '',
      folder: req.body.folder || 'general',
      tags: req.body.tags ? JSON.parse(req.body.tags) : [],
      uploadedBy: req.user._id
    });

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Upload multiple files ──────────────────────────────────────

router.post('/upload-multiple', protect, authorize('admin'), upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded' });

    const mediaItems = [];
    for (const file of req.files) {
      const { width, height } = await getImageDimensions(file.path);
      const thumbnailUrl = await generateThumbnail(file.path, file.filename);

      const media = await Media.create({
        filename: file.filename,
        originalName: file.originalname,
        url: `/uploads/media/${file.filename}`,
        thumbnailUrl,
        mimeType: file.mimetype,
        size: file.size,
        width,
        height,
        title: file.originalname.replace(/\.[^/.]+$/, ''),
        folder: req.body.folder || 'general',
        uploadedBy: req.user._id
      });
      mediaItems.push(media);
    }

    res.status(201).json({ success: true, data: mediaItems, count: mediaItems.length });
  } catch (error) {
    console.error('Multi-upload error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── List media (paginated, filterable, searchable) ─────────────

router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 40, search, folder, mimeType, sort = '-createdAt', tags } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { alt: { $regex: search, $options: 'i' } },
        { caption: { $regex: search, $options: 'i' } }
      ];
    }
    if (folder && folder !== 'all') query.folder = folder;
    if (mimeType) {
      if (mimeType === 'image') query.mimeType = { $regex: /^image\// };
      else if (mimeType === 'video') query.mimeType = { $regex: /^video\// };
      else if (mimeType === 'audio') query.mimeType = { $regex: /^audio\// };
      else if (mimeType === 'document') query.mimeType = { $in: [/pdf/, /doc/, /xls/, /zip/] };
      else query.mimeType = mimeType;
    }
    if (tags) query.tags = { $in: tags.split(',') };

    const total = await Media.countDocuments(query);
    const media = await Media.find(query)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('uploadedBy', 'firstName lastName email');

    res.json({
      success: true,
      data: media,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Media list error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Get single media item ──────────────────────────────────────

router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const media = await Media.findById(req.params.id).populate('uploadedBy', 'firstName lastName email');
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });
    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Update media metadata ──────────────────────────────────────

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { alt, title, caption, folder, tags } = req.body;
    const media = await Media.findByIdAndUpdate(
      req.params.id,
      { alt, title, caption, folder, tags },
      { new: true, runValidators: true }
    );
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });
    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Delete media ───────────────────────────────────────────────

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ success: false, message: 'Media not found' });

    // Delete files from disk
    const filePath = path.join(__dirname, '..', media.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    if (media.thumbnailUrl) {
      const thumbPath = path.join(__dirname, '..', media.thumbnailUrl);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    await Media.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Media deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Bulk delete ────────────────────────────────────────────────

router.post('/bulk-delete', protect, authorize('admin'), async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !ids.length) return res.status(400).json({ success: false, message: 'No IDs provided' });

    const mediaItems = await Media.find({ _id: { $in: ids } });
    for (const media of mediaItems) {
      const filePath = path.join(__dirname, '..', media.url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      if (media.thumbnailUrl) {
        const thumbPath = path.join(__dirname, '..', media.thumbnailUrl);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
      }
    }

    await Media.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `Deleted ${mediaItems.length} items` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Get folders ────────────────────────────────────────────────

router.get('/folders/list', protect, authorize('admin'), async (req, res) => {
  try {
    const folders = await Media.distinct('folder');
    const folderCounts = await Media.aggregate([
      { $group: { _id: '$folder', count: { $sum: 1 } } }
    ]);
    const folderMap = {};
    folderCounts.forEach(f => { folderMap[f._id] = f.count; });

    res.json({
      success: true,
      data: folders.map(f => ({ name: f, count: folderMap[f] || 0 }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
