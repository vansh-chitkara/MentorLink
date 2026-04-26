const mongoose = require("mongoose");

/**
 * Session Schema
 * Stores mentorship session bookings between students and mentors
 * 
 * KEY FEATURES:
 * - Tracks status of session (pending, confirmed, completed, cancelled)
 * - Stores session timing and notes
 * - References User model for relationships
 */

const sessionSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        title: {
            type: String,
            required: [true, "Please provide session title"],
            trim: true
        },
        description: {
            type: String,
            maxlength: 1000
        },
        scheduledDate: {
            type: Date,
            required: [true, "Please provide session date"]
        },
        duration: {
            type: Number,
            default: 60 // in minutes
        },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending"
        },
        notes: {
            type: String,
            maxlength: 1000
        },
        meetingLink: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

sessionSchema.index({ student: 1, createdAt: -1 });
sessionSchema.index({ mentor: 1, createdAt: -1 });
sessionSchema.index({ status: 1, scheduledDate: 1 });

module.exports = mongoose.model("Session", sessionSchema);
