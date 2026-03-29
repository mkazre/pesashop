const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsSync = require('fs');
const { protect, authorize } = require('../middleware/auth');
const imageProcessor = require('../services/imageProcessor');
const Product = require('../models/Product');
const { uploadToCloudinary } = require('../config/cloudinary');

const useCloudinary = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

// Configure multer for memory storage (for processing)
const memoryStorage = multer.memoryStorage();

// Configure multer for watermark upload (disk storage)
const watermarkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/watermarks');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Always save watermark as PNG for transparency
    cb(null, `watermark-${Date.now()}.png`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter
});

const uploadWatermark = multer({
  storage: watermarkStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: fileFilter
});

/**
 * @route   POST /api/images/configure-watermark
 * @desc    Configure watermark settings
 * @access  Private/Admin
 */
router.post('/configure-watermark', protect, authorize('admin'), uploadWatermark.single('file'), async (req, res) => {
  try {
    const { position = 'bottom-right', size = 0.2, opacity = 0.7 } = req.body;
    const watermarkPath = req.file ? req.file.path : null;

    // If no file but we have existing watermark, keep existing path
    let finalWatermarkPath = watermarkPath;
    if (!watermarkPath) {
      const currentConfig = await imageProcessor.getConfig();
      if (currentConfig.watermarkPath && fsSync.existsSync(currentConfig.watermarkPath)) {
        finalWatermarkPath = currentConfig.watermarkPath;
      }
    }

    await imageProcessor.setWatermark(
      finalWatermarkPath,
      position,
      parseFloat(size),
      parseFloat(opacity)
    );

    const updatedConfig = await imageProcessor.getConfig();

    res.json({
      success: true,
      message: 'Watermark configured successfully',
      data: {
        watermarkPath: updatedConfig.watermarkPath ? `/uploads/watermarks/${path.basename(updatedConfig.watermarkPath)}` : null,
        position: updatedConfig.watermarkPosition,
        size: updatedConfig.watermarkSize,
        opacity: updatedConfig.watermarkOpacity
      }
    });
  } catch (error) {
    console.error('Error configuring watermark:', error);
    res.status(500).json({
      success: false,
      message: 'Error configuring watermark',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/config
 * @desc    Update Image Manager configuration (Smart Image Resize PRO settings)
 * @access  Private/Admin
 */
router.post('/config', protect, authorize('admin'), async (req, res) => {
  try {
    const config = req.body;
    await imageProcessor.updateConfig(config);
    
    const updatedConfig = await imageProcessor.getConfig();
    
    res.json({
      success: true,
      message: 'Image Manager configuration updated successfully',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating image config:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating configuration',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/images/config
 * @desc    Get current Image Manager configuration
 * @access  Private/Admin
 */
router.get('/config', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await imageProcessor.getConfig();
    
    res.json({
      success: true,
      data: {
        ...config,
        watermarkPath: config.watermarkPath ? `/uploads/watermarks/${path.basename(config.watermarkPath)}` : null
      }
    });
  } catch (error) {
    console.error('Error fetching image config:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching configuration',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/process
 * @desc    Process a single image with Smart Image Resize PRO features
 * @access  Private/Admin
 */
router.post('/process', protect, authorize('admin'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image'
      });
    }

    const uploadPath = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    // Get processing options from request body or use defaults
    const options = {
      trimWhitespace: req.body.trimWhitespace === 'true' || req.body.trimWhitespace === true,
      backgroundColor: req.body.backgroundColor || null,
      targetWidth: req.body.targetWidth ? parseInt(req.body.targetWidth) : undefined,
      targetHeight: req.body.targetHeight ? parseInt(req.body.targetHeight) : undefined,
      targetRatio: req.body.targetRatio || undefined,
      outputFormat: req.body.outputFormat || 'webp', // Default to WebP to match products module
      imageQuality: req.body.imageQuality ? parseInt(req.body.imageQuality) : undefined
    };

    // Save uploaded file temporarily
    const tempInputPath = path.join(__dirname, '../uploads/temp', `temp-${Date.now()}-${req.file.originalname}`);
    const tempDir = path.dirname(tempInputPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    await fs.promises.writeFile(tempInputPath, req.file.buffer);

    // Determine output format extension
    const outputFormat = options.outputFormat || 'webp';
    const ext = outputFormat === 'webp' ? 'webp' : (outputFormat === 'png' ? 'png' : 'jpg');
    const filename = `processed-${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
    const outputPath = path.join(uploadPath, filename);

    // Process the image
    const result = await imageProcessor.processProductImage(tempInputPath, outputPath, options);

    // Clean up temp file
    if (fs.existsSync(tempInputPath)) {
      await fs.promises.unlink(tempInputPath);
    }

    let imageUrl = `/uploads/products/${filename}`;

    // Upload to Cloudinary if configured
    if (useCloudinary) {
      try {
        const cloudResult = await uploadToCloudinary(outputPath, { folder: 'products' });
        imageUrl = cloudResult.url;
        // Clean up local processed file
        if (fs.existsSync(outputPath)) await fs.promises.unlink(outputPath);
      } catch (cloudErr) {
        console.error('Cloudinary upload failed, keeping local file:', cloudErr.message);
      }
    }

    res.json({
      success: true,
      message: 'Image processed successfully',
      data: {
        url: imageUrl,
        path: outputPath,
        filename: filename,
        dimensions: result.dimensions,
        originalDimensions: result.originalDimensions,
        size: result.size,
        format: result.format
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    
    // Clean up temp file if it exists
    if (req.file) {
      const tempInputPath = path.join(__dirname, '../uploads/temp', `temp-${Date.now()}-${req.file.originalname}`);
      if (fs.existsSync(tempInputPath)) {
        await fs.promises.unlink(tempInputPath).catch(() => {});
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error processing image',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/images/watermark-config
 * @desc    Get current watermark configuration (legacy endpoint, use /config instead)
 * @access  Private/Admin
 */
router.get('/watermark-config', protect, authorize('admin'), async (req, res) => {
  try {
    const config = await imageProcessor.getConfig();
    res.json({
      success: true,
      data: {
        position: config.watermarkPosition,
        size: config.watermarkSize,
        opacity: config.watermarkOpacity,
        watermarkPath: config.watermarkPath ? `/uploads/watermarks/${path.basename(config.watermarkPath)}` : null,
        configured: !!config.watermarkPath
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching watermark config',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/upload
 * @desc    Upload an image without processing (for general use)
 * @access  Private/Admin
 */
router.post('/upload', protect, authorize('admin', 'shop_manager'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const uploadPath = path.join(__dirname, '../uploads/general');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const filename = `upload-${Date.now()}-${req.file.originalname}`;
    const outputPath = path.join(uploadPath, filename);

    let imageUrl = `/uploads/general/${filename}`;

    if (useCloudinary) {
      try {
        const cloudResult = await uploadToCloudinary(req.file.buffer, { folder: 'general' });
        imageUrl = cloudResult.url;
      } catch (cloudErr) {
        console.error('Cloudinary upload failed, saving locally:', cloudErr.message);
        await fs.promises.writeFile(outputPath, req.file.buffer);
      }
    } else {
      await fs.promises.writeFile(outputPath, req.file.buffer);
    }

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        url: imageUrl,
        path: outputPath,
        size: req.file.size
      }
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/process-product-image
 * @desc    Process a product image and update the product
 * @access  Private/Admin
 */
router.post('/process-product-image', protect, authorize('admin'), async (req, res) => {
  try {
    const { productId, imageUrl, imageType = 'gallery' } = req.body; // imageType: 'featured' or 'gallery'

    if (!productId || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Product ID and image URL are required'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get full path to the image
    let imagePath;
    if (imageUrl.startsWith('http')) {
      // External URL - would need to download first
      return res.status(400).json({
        success: false,
        message: 'External URLs not supported. Please use local image paths.'
      });
    } else if (imageUrl.startsWith('/uploads/')) {
      imagePath = path.join(__dirname, '..', imageUrl);
    } else {
      imagePath = path.join(__dirname, '../uploads/products', imageUrl);
    }

    if (!fsSync.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image file not found'
      });
    }

    // Get current config for processing
    const config = await imageProcessor.getConfig();
    const options = {
      trimWhitespace: config.trimWhitespace,
      backgroundColor: config.backgroundColor,
      targetWidth: config.targetWidth,
      targetHeight: config.targetHeight,
      targetRatio: config.targetRatio,
      outputFormat: config.outputFormat,
      imageQuality: config.imageQuality
    };

    // Process the image
    const ext = options.outputFormat === 'webp' ? 'webp' : (options.outputFormat === 'png' ? 'png' : 'jpg');
    const filename = `processed-${product.slug || product._id}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
    const outputPath = path.join(__dirname, '../uploads/products', filename);

    const result = await imageProcessor.processProductImage(imagePath, outputPath, options);
    const newImageUrl = `/uploads/products/${filename}`;

    // Update product
    if (imageType === 'featured') {
      product.featuredImage = newImageUrl;
      // Ensure featured image is first in images array
      if (product.images && product.images.length > 0) {
        product.images = product.images.filter(img => img !== imageUrl);
        product.images.unshift(newImageUrl);
      } else {
        product.images = [newImageUrl];
      }
    } else {
      // Replace in gallery
      if (product.images && product.images.includes(imageUrl)) {
        const index = product.images.indexOf(imageUrl);
        product.images[index] = newImageUrl;
      }
      // If it was the featured image, update that too
      if (product.featuredImage === imageUrl) {
        product.featuredImage = newImageUrl;
      }
    }

    await product.save();

    res.json({
      success: true,
      message: 'Product image processed and updated successfully',
      data: {
        productId: product._id,
        oldImageUrl: imageUrl,
        newImageUrl: newImageUrl,
        dimensions: result.dimensions,
        format: result.format
      }
    });
  } catch (error) {
    console.error('Error processing product image:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing product image',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/images/products
 * @desc    Get all product images for regeneration interface
 * @access  Private/Admin
 */
router.get('/products', protect, authorize('admin'), async (req, res) => {
  try {
    const { categoryId, resized, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    
    // Build query - exclude only explicitly trashed products
    const query = {
      $or: [
        { status: { $exists: false } },
        { status: { $ne: 'trash' } },
        { status: null }
      ]
    };
    
    // Filter by category
    if (categoryId) {
      query.categories = categoryId;
    }
    
    // Search
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { sku: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // For resized filter, we need to post-filter, so fetch more to compensate
    // For non-resized filters, use standard pagination
    const needsPostFilter = resized === 'true' || resized === 'false';

    let products;
    let totalCount;

    if (needsPostFilter) {
      // Fetch all matching products for post-filtering, but only select minimal fields
      products = await Product.find(query)
        .populate('categories', 'name')
        .select('name sku featuredImage images categories')
        .sort({ createdAt: -1 })
        .lean();
      totalCount = products.length;
    } else {
      totalCount = await Product.countDocuments(query);
      products = await Product.find(query)
        .populate('categories', 'name')
        .select('name sku featuredImage images categories')
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();
    }

    const mapProduct = (product) => {
      const images = [];
      
      if (product.featuredImage && typeof product.featuredImage === 'string' && product.featuredImage.trim()) {
        const isProcessed = product.featuredImage.includes('processed-') || 
                           product.featuredImage.endsWith('.webp');
        images.push({
          url: product.featuredImage,
          type: 'featured',
          isProcessed,
          aspectRatio: null
        });
      }
      
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(img => {
          if (typeof img === 'string' && img.trim() && img !== product.featuredImage) {
            const isProcessed = img.includes('processed-') || img.endsWith('.webp');
            images.push({
              url: img,
              type: 'gallery',
              isProcessed,
              aspectRatio: null
            });
          }
        });
      }

      return {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        categories: product.categories || [],
        images
      };
    };

    let resultProducts;
    let resultTotal;

    if (needsPostFilter) {
      let mapped = products.map(mapProduct);
      if (resized === 'true') {
        mapped = mapped.filter(p => p.images.length > 0 && p.images.some(img => img.isProcessed));
      } else if (resized === 'false') {
        mapped = mapped.filter(p => p.images.length === 0 || p.images.some(img => !img.isProcessed));
      }
      resultTotal = mapped.length;
      resultProducts = mapped.slice((pageNum - 1) * limitNum, pageNum * limitNum);
    } else {
      resultProducts = products.map(mapProduct);
      resultTotal = totalCount;
    }

    res.json({
      success: true,
      data: resultProducts,
      total: resultTotal,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(resultTotal / limitNum)
    });
  } catch (error) {
    console.error('Error fetching product images:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product images',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/images/regenerate
 * @desc    Regenerate multiple product images
 * @access  Private/Admin
 */
router.post('/regenerate', protect, authorize('admin'), async (req, res) => {
  try {
    const { productIds, imageUrls, imageType = 'all' } = req.body; // imageType: 'featured', 'gallery', 'all'

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Product IDs array is required'
      });
    }

    const results = {
      processed: [],
      failed: [],
      skipped: []
    };

    // Get current config
    const config = await imageProcessor.getConfig();
    const options = {
      trimWhitespace: config.trimWhitespace,
      backgroundColor: config.backgroundColor,
      targetWidth: config.targetWidth,
      targetHeight: config.targetHeight,
      targetRatio: config.targetRatio,
      outputFormat: config.outputFormat,
      imageQuality: config.imageQuality
    };

    for (const productId of productIds) {
      try {
        const product = await Product.findById(productId);
        if (!product) {
          results.skipped.push({ productId, reason: 'Product not found' });
          continue;
        }

        const imagesToProcess = [];
        
        if (imageType === 'featured' && product.featuredImage) {
          imagesToProcess.push({ url: product.featuredImage, type: 'featured' });
        } else if (imageType === 'gallery' && product.images) {
          product.images.forEach(img => {
            if (img !== product.featuredImage) {
              imagesToProcess.push({ url: img, type: 'gallery' });
            }
          });
        } else if (imageType === 'all') {
          if (product.featuredImage) {
            imagesToProcess.push({ url: product.featuredImage, type: 'featured' });
          }
          if (product.images) {
            product.images.forEach(img => {
              if (img !== product.featuredImage) {
                imagesToProcess.push({ url: img, type: 'gallery' });
              }
            });
          }
        }

        // Filter by imageUrls if provided
        const filteredImages = imageUrls && imageUrls.length > 0
          ? imagesToProcess.filter(img => imageUrls.includes(img.url))
          : imagesToProcess;

        for (const imageData of filteredImages) {
          try {
            let imagePath;
            if (imageData.url.startsWith('/uploads/')) {
              imagePath = path.join(__dirname, '..', imageData.url);
            } else {
              imagePath = path.join(__dirname, '../uploads/products', imageData.url);
            }

            if (!fsSync.existsSync(imagePath)) {
              results.skipped.push({ 
                productId, 
                imageUrl: imageData.url, 
                reason: 'Image file not found' 
              });
              continue;
            }

            // Process image
            const ext = options.outputFormat === 'webp' ? 'webp' : (options.outputFormat === 'png' ? 'png' : 'jpg');
            const filename = `processed-${product.slug || product._id}-${Date.now()}-${Math.round(Math.random() * 1E9)}.${ext}`;
            const outputPath = path.join(__dirname, '../uploads/products', filename);

            await imageProcessor.processProductImage(imagePath, outputPath, options);
            const newImageUrl = `/uploads/products/${filename}`;

            // Update product
            if (imageData.type === 'featured') {
              product.featuredImage = newImageUrl;
              if (product.images && product.images.length > 0) {
                product.images = product.images.filter(img => img !== imageData.url);
                product.images.unshift(newImageUrl);
              } else {
                product.images = [newImageUrl];
              }
            } else {
              if (product.images && product.images.includes(imageData.url)) {
                const index = product.images.indexOf(imageData.url);
                product.images[index] = newImageUrl;
              }
              if (product.featuredImage === imageData.url) {
                product.featuredImage = newImageUrl;
              }
            }

            results.processed.push({
              productId,
              oldImageUrl: imageData.url,
              newImageUrl,
              type: imageData.type
            });
          } catch (error) {
            results.failed.push({
              productId,
              imageUrl: imageData.url,
              error: error.message
            });
          }
        }

        await product.save();
      } catch (error) {
        results.failed.push({
          productId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Image regeneration completed',
      data: results
    });
  } catch (error) {
    console.error('Error regenerating images:', error);
    res.status(500).json({
      success: false,
      message: 'Error regenerating images',
      error: error.message
    });
  }
});

module.exports = router;
