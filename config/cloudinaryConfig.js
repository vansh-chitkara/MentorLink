const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const logger = require("./logger");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadToCloudinary = async (filePath, folder = "mentorlink") => {
    try {
        const result = await cloudinary.uploader.upload(filePath, {
            folder,
            resource_type: "auto"
        });
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        return result;
    } catch (error) {
        logger.error({ message: error.message }, "cloudinary.upload_failed");
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        throw error;
    }
};

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
