const mongoose = require("mongoose");

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
feedbackSchema.index({ student: 1, mentor: 1 }, { unique: true });
feedbackSchema.index({ mentor: 1, createdAt: -1 });

module.exports = mongoose.model("Feedback", feedbackSchema);
