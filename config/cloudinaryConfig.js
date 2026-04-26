const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const logger = require("./logger");

/**
 * CLOUDINARY CONFIGURATION
 * Cloud storage for file uploads
 * 
 * WHY CLOUDINARY?
 * - Free tier (25GB storage, 25GB bandwidth/month)
 * - Image optimization and transformation
 * - CDN for fast global delivery
 * - No need to manage server storage
 * 
 * WORKFLOW:
 * 1. Multer saves file locally
 * 2. Upload to Cloudinary via API
 * 3. Get secure URL from Cloudinary
 * 4. Delete local file
 * 5. Store URL in database
 */

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload file to Cloudinary
 * @param {string} filePath - Local file path
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise} - Upload response with secure_url
 */
const uploadToCloudinary = async (filePath, folder = "mentorlink") => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "auto"
        });

        // Delete local file after successful upload
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return result;
    } catch (error) {
        logger.error({ message: error.message }, "cloudinary.upload_failed");

        // Delete local file if upload fails
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        throw error;
    }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Cloudinary public_id
 */
const deleteFromCloudinary = async (publicId) => {
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        logger.error({ message: error.message, publicId }, "cloudinary.delete_failed");
        throw error;
    }
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary
};
