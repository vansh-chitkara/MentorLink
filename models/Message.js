const mongoose = require("mongoose");

/**
 * Message Schema
 * Stores chat messages between students and mentors
 * 
 * REAL-TIME FEATURE:
 * - Will be used with Socket.io for real-time communication
 * - Stores message history for persistent conversations
 */

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            required: [true, "Message cannot be empty"],
            maxlength: 5000
        },
        isRead: {
            type: Boolean,
            default: false
        },
        attachmentUrl: {
            type: String,
            default: null
        }
    },
    { timestamps: true }
);

messageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });
messageSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
