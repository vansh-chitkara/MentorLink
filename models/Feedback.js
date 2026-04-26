const mongoose = require("mongoose");

/**
 * Feedback Schema
 * Stores ratings and reviews from students about mentors
 * 
 * KEY FEATURES:
 * - Rating system (1-5 stars)
 * - Text feedback
 * - Prevents duplicate reviews from same student for same mentor
 */

const feedbackSchema = new mongoose.Schema(
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
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Session",
            default: null
        },
        rating: {
            type: Number,
            required: [true, "Please provide a rating"],
            min: 1,
            max: 5
        },
        review: {
            type: String,
            required: [true, "Please provide your feedback"],
            maxlength: 1000
        }
    },
    { timestamps: true }
);

// Prevent duplicate reviews for same student-mentor pair
feedbackSchema.index({ student: 1, mentor: 1 }, { unique: true });
feedbackSchema.index({ mentor: 1, createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
