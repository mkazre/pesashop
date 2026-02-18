const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

class ImageProcessor {
  constructor() {
    this.configPath = path.join(__dirname, '../config/imageProcessorConfig.json');
    this.watermarkPath = null;
    this.watermarkPosition = 'bottom-right';
    this.watermarkSize = 0.2;
    this.watermarkOpacity = 0.7;
    
    // Smart Image Resize PRO features
    this.targetWidth = 2000; // Configurable width
    this.targetHeight = 2000; // Configurable height
    this.targetRatio = 1; // 1:1 aspect ratio (can be 'auto', '1:1', '4:3', '16:9', or custom)
    this.trimWhitespace = false; // Trim whitespace around products
    this.backgroundColor = null; // Custom background color (hex, e.g., '#FFFFFF')
    this.smartThumbnailControl = true; // Prevent unwanted size generation
    this.outputFormat = 'webp'; // WebP format (respects products module setup)
    this.imageQuality = parseInt(process.env.IMAGE_QUALITY) || 90;
    this.maxWidth = parseInt(process.env.IMAGE_MAX_WIDTH) || 2000;
    this.maxHeight = parseInt(process.env.IMAGE_MAX_HEIGHT) || 2000;
    
    this.loadConfig();
  }

  /**
   * Load configuration from file
   */
  async loadConfig() {
    try {
      if (fsSync.existsSync(this.configPath)) {
        const configData = await fs.readFile(this.configPath, 'utf8');
        const config = JSON.parse(configData);
        
        this.watermarkPath = config.watermarkPath || null;
        this.watermarkPosition = config.watermarkPosition || 'bottom-right';
        this.watermarkSize = config.watermarkSize || 0.2;
        this.watermarkOpacity = config.watermarkOpacity || 0.7;
        this.targetWidth = config.targetWidth || 2000;
        this.targetHeight = config.targetHeight || 2000;
        this.targetRatio = config.targetRatio || 1;
        this.trimWhitespace = config.trimWhitespace !== undefined ? config.trimWhitespace : false;
        this.backgroundColor = config.backgroundColor || null;
        this.smartThumbnailControl = config.smartThumbnailControl !== undefined ? config.smartThumbnailControl : true;
        this.outputFormat = config.outputFormat || 'webp';
        this.imageQuality = config.imageQuality || 90;
      }
    } catch (error) {
      console.warn('Image processor config file not found or invalid, using defaults:', error.message);
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig() {
    const config = {
      watermarkPath: this.watermarkPath,
      watermarkPosition: this.watermarkPosition,
      watermarkSize: this.watermarkSize,
      watermarkOpacity: this.watermarkOpacity,
      targetWidth: this.targetWidth,
      targetHeight: this.targetHeight,
      targetRatio: this.targetRatio,
      trimWhitespace: this.trimWhitespace,
      backgroundColor: this.backgroundColor,
      smartThumbnailControl: this.smartThumbnailControl,
      outputFormat: this.outputFormat,
      imageQuality: this.imageQuality
    };
    
    const configDir = path.dirname(this.configPath);
    if (!fsSync.existsSync(configDir)) {
      await fs.mkdir(configDir, { recursive: true });
    }
    
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  /**
   * Get current configuration
   */
  async getConfig() {
    return {
      watermarkPath: this.watermarkPath,
      watermarkPosition: this.watermarkPosition,
      watermarkSize: this.watermarkSize,
      watermarkOpacity: this.watermarkOpacity,
      targetWidth: this.targetWidth,
      targetHeight: this.targetHeight,
      targetRatio: this.targetRatio,
      trimWhitespace: this.trimWhitespace,
      backgroundColor: this.backgroundColor,
      smartThumbnailControl: this.smartThumbnailControl,
      outputFormat: this.outputFormat,
      imageQuality: this.imageQuality
    };
  }

  /**
   * Update configuration
   */
  async updateConfig(config) {
    // Handle watermark path - if it's a URL path, convert to full path
    if (config.watermarkPath !== undefined) {
      if (config.watermarkPath && config.watermarkPath.startsWith('/uploads/watermarks/')) {
        // Convert URL path to full file system path
        const filename = path.basename(config.watermarkPath);
        this.watermarkPath = path.join(__dirname, '../uploads/watermarks', filename);
      } else if (config.watermarkPath) {
        this.watermarkPath = config.watermarkPath;
      } else {
        this.watermarkPath = null;
      }
    }
    
    if (config.watermarkPosition !== undefined) this.watermarkPosition = config.watermarkPosition;
    if (config.watermarkSize !== undefined) this.watermarkSize = parseFloat(config.watermarkSize);
    if (config.watermarkOpacity !== undefined) this.watermarkOpacity = parseFloat(config.watermarkOpacity);
    if (config.targetWidth !== undefined) {
      this.targetWidth = config.targetWidth === '' || config.targetWidth === null ? 2000 : parseInt(config.targetWidth);
    }
    if (config.targetHeight !== undefined) {
      this.targetHeight = config.targetHeight === '' || config.targetHeight === null ? 2000 : parseInt(config.targetHeight);
    }
    if (config.targetRatio !== undefined) {
      // Handle string ratios like '1:1', 'auto', or numeric
      if (typeof config.targetRatio === 'string') {
        if (config.targetRatio === 'auto') {
          this.targetRatio = 'auto';
        } else if (config.targetRatio.includes(':')) {
          const [w, h] = config.targetRatio.split(':').map(Number);
          this.targetRatio = w / h;
        } else {
          this.targetRatio = parseFloat(config.targetRatio);
        }
      } else {
        this.targetRatio = config.targetRatio;
      }
    }
    if (config.trimWhitespace !== undefined) this.trimWhitespace = config.trimWhitespace === true || config.trimWhitespace === 'true';
    if (config.backgroundColor !== undefined) {
      this.backgroundColor = config.backgroundColor === '' || config.backgroundColor === null ? null : config.backgroundColor;
    }
    if (config.smartThumbnailControl !== undefined) {
      this.smartThumbnailControl = config.smartThumbnailControl === true || config.smartThumbnailControl === 'true';
    }
    if (config.outputFormat !== undefined) this.outputFormat = config.outputFormat;
    if (config.imageQuality !== undefined) this.imageQuality = parseInt(config.imageQuality);
    
    await this.saveConfig();
    // Reload config to ensure consistency
    await this.loadConfig();
    return { success: true, message: 'Configuration updated successfully' };
  }

  /**
   * Set watermark configuration
   */
  async setWatermark(imagePath, position = 'bottom-right', size = 0.2, opacity = 0.7) {
    try {
      if (imagePath) {
        await fs.access(imagePath);
        this.watermarkPath = imagePath;
      }
      this.watermarkPosition = position;
      this.watermarkSize = parseFloat(size);
      this.watermarkOpacity = parseFloat(opacity);
      await this.saveConfig();
      // Reload config to ensure consistency
      await this.loadConfig();
      return { success: true, message: 'Watermark configured successfully' };
    } catch (error) {
      // If file doesn't exist but we're just updating settings, that's OK
      if (!imagePath) {
        this.watermarkPosition = position;
        this.watermarkSize = parseFloat(size);
        this.watermarkOpacity = parseFloat(opacity);
        await this.saveConfig();
        await this.loadConfig();
        return { success: true, message: 'Watermark settings updated successfully' };
      }
      throw new Error('Watermark file not found');
    }
  }

  /**
   * Trim whitespace from image edges
   */
  async trimWhitespaceFromImage(inputPath) {
    try {
      const image = sharp(inputPath);
      const metadata = await image.metadata();
      
      // Use trim to detect and remove whitespace
      const trimmed = await image
        .trim({
          threshold: 10 // Threshold for what is considered "white"
        })
        .toBuffer({ resolveWithObject: true });
      
      return {
        buffer: trimmed.data,
        info: trimmed.info
      };
    } catch (error) {
      // If trim fails, return original image
      const buffer = await sharp(inputPath).toBuffer();
      const metadata = await sharp(inputPath).metadata();
      return {
        buffer,
        info: {
          width: metadata.width,
          height: metadata.height
        }
      };
    }
  }

  /**
   * Parse aspect ratio string to numeric value
   */
  parseAspectRatio(ratio) {
    if (typeof ratio === 'number') return ratio;
    if (ratio === 'auto') return 'auto';
    
    const ratios = {
      '1:1': 1,
      '4:3': 4/3,
      '3:4': 3/4,
      '16:9': 16/9,
      '9:16': 9/16
    };
    
    return ratios[ratio] || 1;
  }

  /**
   * Calculate target dimensions based on aspect ratio
   */
  calculateTargetDimensions(originalWidth, originalHeight, targetRatio, targetWidth, targetHeight) {
    if (targetRatio === 'auto') {
      // Use original aspect ratio
      const aspectRatio = originalWidth / originalHeight;
      if (targetWidth && targetHeight) {
        // Fit within target dimensions while maintaining aspect ratio
        if (originalWidth > targetWidth || originalHeight > targetHeight) {
          const widthRatio = targetWidth / originalWidth;
          const heightRatio = targetHeight / originalHeight;
          const ratio = Math.min(widthRatio, heightRatio);
          return {
            width: Math.round(originalWidth * ratio),
            height: Math.round(originalHeight * ratio)
          };
        }
        return { width: originalWidth, height: originalHeight };
      }
      return { width: originalWidth, height: originalHeight };
    }
    
    const aspectRatio = this.parseAspectRatio(targetRatio);
    
    if (targetWidth && targetHeight) {
      // Use specified dimensions
      return { width: targetWidth, height: targetHeight };
    } else if (targetWidth) {
      // Calculate height from width and ratio
      return { width: targetWidth, height: Math.round(targetWidth / aspectRatio) };
    } else if (targetHeight) {
      // Calculate width from height and ratio
      return { width: Math.round(targetHeight * aspectRatio), height: targetHeight };
    } else {
      // Use aspect ratio with max dimensions
      const maxSize = Math.min(this.maxWidth, this.maxHeight);
      if (aspectRatio >= 1) {
        return { width: maxSize, height: Math.round(maxSize / aspectRatio) };
      } else {
        return { width: Math.round(maxSize * aspectRatio), height: maxSize };
      }
    }
  }

  /**
   * Process product image with Smart Image Resize PRO features
   */
  async processProductImage(inputPath, outputPath, options = {}) {
    try {
      // Merge options with instance config
      const trimWhitespace = options.trimWhitespace !== undefined ? options.trimWhitespace : this.trimWhitespace;
      const backgroundColor = options.backgroundColor !== undefined ? options.backgroundColor : this.backgroundColor;
      const targetWidth = options.targetWidth !== undefined ? options.targetWidth : this.targetWidth;
      const targetHeight = options.targetHeight !== undefined ? options.targetHeight : this.targetHeight;
      const targetRatio = options.targetRatio !== undefined ? options.targetRatio : this.targetRatio;
      const outputFormat = options.outputFormat !== undefined ? options.outputFormat : this.outputFormat;
      const imageQuality = options.imageQuality !== undefined ? options.imageQuality : this.imageQuality;
      
      let imageBuffer;
      let originalMetadata;
      
      // Step 1: Load original image
      const originalImage = sharp(inputPath);
      originalMetadata = await originalImage.metadata();
      
      // Step 2: Trim whitespace if enabled
      if (trimWhitespace) {
        const trimmed = await this.trimWhitespaceFromImage(inputPath);
        imageBuffer = trimmed.buffer;
        originalMetadata = trimmed.info;
      } else {
        imageBuffer = await originalImage.toBuffer();
      }
      
      // Step 3: Calculate target dimensions
      const targetDims = this.calculateTargetDimensions(
        originalMetadata.width,
        originalMetadata.height,
        targetRatio,
        targetWidth,
        targetHeight
      );
      
      // Step 4: Create base image with background color if specified
      let processedImage;
      if (backgroundColor) {
        // Create a canvas with background color
        const bgColor = backgroundColor.startsWith('#') ? backgroundColor : `#${backgroundColor}`;
        processedImage = sharp({
          create: {
            width: targetDims.width,
            height: targetDims.height,
            channels: 4,
            background: bgColor
          }
        });
        
        // Resize and center the image on the background
        const resizedImage = await sharp(imageBuffer)
          .resize(targetDims.width, targetDims.height, {
            fit: 'inside',
            withoutEnlargement: false
          })
          .toBuffer();
        
        // Composite the resized image onto the background
        processedImage = processedImage.composite([{
          input: resizedImage,
          blend: 'over',
          gravity: 'center'
        }]);
      } else {
        // Resize to target dimensions without background
        processedImage = sharp(imageBuffer).resize(targetDims.width, targetDims.height, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: false
        });
      }

      // Step 5: Add watermark if configured
      // Reload watermark config to ensure it's current
      await this.loadConfig();
      
      if (this.watermarkPath && fsSync.existsSync(this.watermarkPath)) {
        const watermarkSize = Math.min(targetDims.width, targetDims.height);
        const watermark = await this.createWatermark(watermarkSize);
        const position = this.getCompositePosition(this.watermarkPosition, watermarkSize);
        
        processedImage = processedImage.composite([{
          input: watermark,
          ...position
        }]);
        console.log(`[ImageProcessor] Watermark applied: ${this.watermarkPath}, position: ${this.watermarkPosition}`);
      } else {
        console.log(`[ImageProcessor] No watermark applied - path: ${this.watermarkPath}, exists: ${this.watermarkPath ? fsSync.existsSync(this.watermarkPath) : 'N/A'}`);
      }

      // Step 6: Apply format and quality, then save
      let outputPipeline = processedImage;
      
      switch (outputFormat.toLowerCase()) {
        case 'webp':
          outputPipeline = outputPipeline.webp({ 
            quality: imageQuality,
            effort: 4 // Higher effort = better compression but slower
          });
          break;
        case 'jpeg':
        case 'jpg':
          outputPipeline = outputPipeline.jpeg({ quality: imageQuality });
          break;
        case 'png':
          outputPipeline = outputPipeline.png({ quality: imageQuality });
          break;
        default:
          outputPipeline = outputPipeline.webp({ quality: imageQuality, effort: 4 });
      }
      
      await outputPipeline.toFile(outputPath);
      
      const finalStats = await fs.stat(outputPath);
      const finalMetadata = await sharp(outputPath).metadata();
      
      return {
        success: true,
        path: outputPath,
        dimensions: { 
          width: finalMetadata.width, 
          height: finalMetadata.height 
        },
        originalDimensions: {
          width: originalMetadata.width,
          height: originalMetadata.height
        },
        size: finalStats.size,
        format: outputFormat
      };
    } catch (error) {
      console.error('Image processing error:', error);
      throw error;
    }
  }

  /**
   * Create watermark at appropriate size with opacity
   */
  async createWatermark(imageSize) {
    const watermarkSize = Math.floor(imageSize * this.watermarkSize);
    
    // Load and resize watermark
    const watermark = sharp(this.watermarkPath)
      .resize(watermarkSize, watermarkSize, { fit: 'inside' })
      .ensureAlpha(); // Ensure alpha channel exists
    
    const metadata = await watermark.metadata();
    
    // Extract raw pixel data
    const { data, info } = await watermark
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // Modify alpha channel to apply opacity
    const channels = info.channels;
    if (channels >= 4) {
      // RGBA format - modify alpha channel (4th channel)
      for (let i = 3; i < data.length; i += channels) {
        data[i] = Math.floor(data[i] * this.watermarkOpacity);
      }
    }
    
    // Reconstruct image with modified alpha
    return sharp(data, {
      raw: {
        width: metadata.width,
        height: metadata.height,
        channels: channels
      }
    })
    .png() // Use PNG to preserve transparency
    .toBuffer();
  }

  /**
   * Get composite position for watermark
   */
  getCompositePosition(position, imageSize) {
    const margin = Math.floor(imageSize * 0.05); // 5% margin
    const watermarkSize = Math.floor(imageSize * this.watermarkSize);
    
    const positions = {
      'top-left': { 
        top: margin, 
        left: margin 
      },
      'top-right': { 
        top: margin, 
        left: imageSize - watermarkSize - margin 
      },
      'bottom-left': { 
        top: imageSize - watermarkSize - margin, 
        left: margin 
      },
      'bottom-right': { 
        top: imageSize - watermarkSize - margin, 
        left: imageSize - watermarkSize - margin 
      },
      'center': { 
        top: Math.floor((imageSize - watermarkSize) / 2), 
        left: Math.floor((imageSize - watermarkSize) / 2) 
      }
    };
    
    return positions[position] || positions['bottom-right'];
  }

  /**
   * Batch process multiple images
   */
  async batchProcess(images, progressCallback = null) {
    const results = [];
    const total = images.length;
    
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      try {
        const result = await this.processProductImage(img.input, img.output);
        results.push({ 
          ...result, 
          originalPath: img.input,
          index: i 
        });
        
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            success: true
          });
        }
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          originalPath: img.input,
          index: i 
        });
        
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total,
            percentage: Math.round(((i + 1) / total) * 100),
            success: false,
            error: error.message
          });
        }
      }
    }
    
    return {
      total: images.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Resize image maintaining aspect ratio
   */
  async resizeImage(inputPath, outputPath, maxWidth, maxHeight) {
    try {
      const format = this.outputFormat === 'webp' ? 'webp' : 'jpeg';
      const formatOptions = format === 'webp' 
        ? { quality: this.imageQuality, effort: 4 }
        : { quality: this.imageQuality };
      
      await sharp(inputPath)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        [format](formatOptions)
        .toFile(outputPath);
      
      return { success: true, path: outputPath };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate thumbnail (with Smart Thumbnail Control)
   */
  async generateThumbnail(inputPath, outputPath, size = 300) {
    try {
      // Smart Thumbnail Control: Only generate if explicitly requested
      if (!this.smartThumbnailControl) {
        // If disabled, just return the original path
        return { success: true, path: inputPath, skipped: true };
      }
      
      const format = this.outputFormat === 'webp' ? 'webp' : 'jpeg';
      const formatOptions = format === 'webp' 
        ? { quality: 80, effort: 4 }
        : { quality: 80 };
      
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        [format](formatOptions)
        .toFile(outputPath);
      
      return { success: true, path: outputPath };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get image metadata
   */
  async getMetadata(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = await fs.stat(imagePath);
      
      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        aspectRatio: metadata.width / metadata.height
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert image format
   */
  async convertFormat(inputPath, outputPath, format = 'jpeg') {
    try {
      const image = sharp(inputPath);
      
      switch (format) {
        case 'jpeg':
        case 'jpg':
          await image.jpeg({ quality: this.imageQuality }).toFile(outputPath);
          break;
        case 'png':
          await image.png({ quality: this.imageQuality }).toFile(outputPath);
          break;
        case 'webp':
          await image.webp({ quality: this.imageQuality }).toFile(outputPath);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
      
      return { success: true, path: outputPath, format };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimize image file size (respects output format setting)
   */
  async optimizeImage(inputPath, outputPath) {
    try {
      const format = this.outputFormat === 'webp' ? 'webp' : 'jpeg';
      const formatOptions = format === 'webp' 
        ? { quality: 85, effort: 4 }
        : { quality: 85, progressive: true, mozjpeg: true };
      
      await sharp(inputPath)
        [format](formatOptions)
        .toFile(outputPath);
      
      const originalSize = (await fs.stat(inputPath)).size;
      const optimizedSize = (await fs.stat(outputPath)).size;
      
      return {
        success: true,
        path: outputPath,
        originalSize,
        optimizedSize,
        savings: originalSize - optimizedSize,
        savingsPercent: Math.round(((originalSize - optimizedSize) / originalSize) * 100),
        format
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ImageProcessor();
