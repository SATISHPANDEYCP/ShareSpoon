import { cloudinary } from '../config/cloudinary.js';

/**
 * Upload image to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadToCloudinary = (fileBuffer, folder = 'food-sharing') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
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
