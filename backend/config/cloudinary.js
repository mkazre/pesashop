const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer or file path to Cloudinary
 * @param {Buffer|string} source - File buffer or local file path
 * @param {object} options - Upload options
 * @param {string} options.folder - Cloudinary folder (e.g. 'products', 'media')
 * @param {string} [options.publicId] - Optional custom public ID
 * @param {string} [options.resourceType] - Resource type (default: 'auto')
 * @returns {Promise<{url: string, publicId: string, width: number, height: number, size: number, format: string}>}
 */
async function uploadToCloudinary(source, { folder = 'general', publicId, resourceType = 'auto' } = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: `pesashop/${folder}`,
      resource_type: resourceType,
      use_filename: true,
      unique_filename: true,
      timeout: 120000,
    };
    if (publicId) uploadOptions.public_id = publicId;

    if (Buffer.isBuffer(source)) {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          size: result.bytes,
          format: result.format,
        });
      });
      stream.end(source);
    } else {
      cloudinary.uploader.upload(source, uploadOptions, (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          size: result.bytes,
          format: result.format,
        });
      });
    }
  });
}

/**
 * Delete a file from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID
 * @param {string} [resourceType] - Resource type (default: 'image')
 */
async function deleteFromCloudinary(publicId, resourceType = 'image') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Extract the Cloudinary public ID from a secure URL
 * @param {string} url - Cloudinary secure URL
 * @returns {string|null} - Public ID or null
 */
function getPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary.com')) return null;
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;
    // Remove version (v1234567890/) and file extension
    let publicId = parts[1].replace(/^v\d+\//, '');
    publicId = publicId.replace(/\.[^.]+$/, '');
    return publicId;
  } catch {
    return null;
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  deleteFromCloudinary,
  getPublicIdFromUrl,
};
