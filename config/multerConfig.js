const multer = require("multer");
const path = require("path");

/**
 * MULTER CONFIGURATION
 * Handles file uploads from forms (multipart/form-data)
 * 
 * WHY MULTER?
 * - Parses multipart form data
 * - Saves files to disk or memory
 * - Validates file type and size
 * 
 * WORKFLOW:
 * 1. User submits form with file
 * 2. Multer intercepts request
 * 3. Saves file to specified location
 * 4. Passes file info to route handler
 * 5. Route handler uploads to Cloudinary
 * 6. Delete local file after successful upload
 */

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Save files in uploads folder
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-originalname
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter: accept only images
const fileFilter = (req, file, cb) => {
    const allowedMimes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed"), false);
    }
};

// Multer middleware configuration
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max
    }
});

module.exports = upload;
