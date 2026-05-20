const mongoose = require("mongoose");

const mentorRequestSchema = new mongoose.Schema(
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
        topic: {
            type: String,
            required: [true, "Please specify topic for mentorship"],
            maxlength: 200
        },
        message: {
            type: String,
            required: [true, "Please provide a message"],
            maxlength: 1000
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "cancelled"],
            default: "pending"
        },
        mentorResponse: {
            type: String,
            maxlength: 500,
            default: null
        }
    },
    { timestamps: true }
);

mentorRequestSchema.index({ student: 1, mentor: 1, status: 1 });
mentorRequestSchema.index({ mentor: 1, createdAt: -1 });

module.exports = mongoose.model("MentorRequest", mentorRequestSchema);
