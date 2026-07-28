const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
    {
        fullName: {
            type: String,
            required: [true, "Full name is required"],
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true
        },

        phone: {
            type: String,
            required: [true, "Phone number is required"],
            trim: true
        },

        subject: {
            type: String,
            required: [true, "Subject is required"],
            trim: true
        },

        message: {
            type: String,
            required: [true, "Message is required"],
            trim: true,
            maxlength: 2000
        },

        status: {
            type: String,
            enum: ["unread", "read", "replied"],
            default: "unread"
        },

        adminReply: {
            type: String,
            default: ""
        },

        repliedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Contact", contactSchema);