import { cloudinary } from '../config/cloudinary.js';

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadToCloudinary = (fileBuffer, folder = 'food-sharing') => {
  return new Promise((resolve, reject) => {
    const normalizedFolder = String(folder || 'food-sharing').replace(/^\/+|\/+$/g, '');
    const uniquePublicId = `${normalizedFolder}/${Date.now()}-${Math.round(Math.random() * 1e9)}`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: normalizedFolder,
        asset_folder: normalizedFolder,
        public_id: uniquePublicId,
        overwrite: false,
        resource_type: 'auto',
        transformation: [
          { width: 1000, height: 1000, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    );

    uploadStream.end(fileBuffer);
  });
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
};

/**
 * Extract Cloudinary public ID from secure URL
 * @param {string} url - Cloudinary delivery URL
 * @returns {string|null} Public ID or null
 */
export const extractPublicIdFromCloudinaryUrl = (url) => {
  if (!url || typeof url !== 'string' || !url.includes('res.cloudinary.com')) {
    return null;
  }

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+(?:\?.*)?$/);
  return match?.[1] || null;
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of file buffers
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, folder = 'food-sharing') => {
  try {
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file.buffer, folder)
    );
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Multiple upload error:', error);
    throw error;
  }
};
