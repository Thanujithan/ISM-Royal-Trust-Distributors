const Contact = require("../models/Contact");

// Save a new contact message
const createContactMessage = async (req, res) => {
    try {
        const {
            fullName,
            email,
            phone,
            subject,
            message
        } = req.body;

        if (!fullName || !email || !phone || !subject || !message) {
            return res.status(400).json({
                success: false,
                message: "Please fill in all required fields."
            });
        }

        const newMessage = await Contact.create({
            fullName,
            email,
            phone,
            subject,
            message
        });

        return res.status(201).json({
            success: true,
            message: "Your message has been sent successfully.",
            data: newMessage
        });
    } catch (error) {
        console.error("Create contact message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to send your message. Please try again."
        });
    }
};

// Get all messages - admin use
const getAllContactMessages = async (req, res) => {
    try {
        const messages = await Contact.find().sort({
            createdAt: -1
        });

        return res.status(200).json({
            success: true,
            count: messages.length,
            data: messages
        });
    } catch (error) {
        console.error("Get messages error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve messages."
        });
    }
};

// Get one message by ID
const getContactMessageById = async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: message
        });
    } catch (error) {
        console.error("Get message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to retrieve the message."
        });
    }
};

// Mark message as read
const markMessageAsRead = async (req, res) => {
    try {
        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            {
                status: "read"
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Message marked as read.",
            data: message
        });
    } catch (error) {
        console.error("Mark message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to update the message."
        });
    }
};

// Save admin reply
const replyToContactMessage = async (req, res) => {
    try {
        const { adminReply } = req.body;

        if (!adminReply || !adminReply.trim()) {
            return res.status(400).json({
                success: false,
                message: "Reply message is required."
            });
        }

        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            {
                adminReply: adminReply.trim(),
                status: "replied",
                repliedAt: new Date()
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Reply saved successfully.",
            data: message
        });
    } catch (error) {
        console.error("Reply message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to save the reply."
        });
    }
};

// Delete a message
const deleteContactMessage = async (req, res) => {
    try {
        const message = await Contact.findByIdAndDelete(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Message deleted successfully."
        });
    } catch (error) {
        console.error("Delete message error:", error);

        return res.status(500).json({
            success: false,
            message: "Unable to delete the message."
        });
    }
};

module.exports = {
    createContactMessage,
    getAllContactMessages,
    getContactMessageById,
    markMessageAsRead,
    replyToContactMessage,
    deleteContactMessage
};