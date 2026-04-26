const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * Stores user profiles for both students and mentors
 * 
 * KEY FEATURES:
 * - Password hashing with bcryptjs (10 salt rounds)
 * - Role-based access (student/mentor)
 * - Tracks skills and hourly rates for mentors
 * - Pre-save middleware for automatic password hashing
 */

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please provide a name"],
            trim: true,
            maxlength: 50
        },
        email: {
            type: String,
            required: [true, "Please provide an email"],
            unique: true,
            lowercase: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"]
        },
        password: {
            type: String,
            required: [true, "Please provide a password"],
            minlength: 6,
            select: false // Don't return password by default in queries
        },
        role: {
            type: String,
            enum: ["student", "mentor"],
            default: "student"
        },
        bio: {
            type: String,
            maxlength: 500,
            default: ""
        },
        profilePicture: {
            type: String,
            default: null
        },
        skills: {
            type: [String],
            default: []
        },
        hourlyRate: {
            type: Number,
            default: 0 // For mentors
        },
        experience: {
            type: String,
            default: "" // Years of experience
        },
        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        totalFeedback: {
            type: Number,
            default: 0
        },
        isVerified: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        resetOtpHash: {
            type: String,
            default: null,
            select: false
        },
        resetOtpExpiresAt: {
            type: Date,
            default: null,
            select: false
        },
        resetOtpAttempts: {
            type: Number,
            default: 0,
            select: false
        },
        resetOtpLastSentAt: {
            type: Date,
            default: null,
            select: false
        }
    },
    { timestamps: true }
);

// Query performance indexes
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ skills: 1 });

/**
 * PRE-SAVE MIDDLEWARE
 * Automatically hash password before saving to database
 * Only hashes if password is new or modified
 */
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * INSTANCE METHOD: comparePassword
 * Compares provided password with hashed password in database
 * Used during login for authentication
 * 
 * @param {String} candidatePassword - Password provided by user
 * @returns {Boolean} - True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
