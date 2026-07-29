const mongoose = require("mongoose");
const Contact = require("../models/Contact");

// @desc    Create contact message
// @route   POST /api/contact
// @access  Public
const createContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email and message are required",
      });
    }

    const newMessage = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Your message has been sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Create contact message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to send message",
      error: error.message,
    });
  }
};

// @desc    Get all contact messages
// @route   GET /api/contact
// @access  Admin
const getAllMessages = async (req, res) => {
  try {
    const messages = await Contact.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load messages",
      error: error.message,
    });
  }
};

// @desc    Get one contact message
// @route   GET /api/contact/:id
// @access  Admin
const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const contactMessage = await Contact.findById(id);

    if (!contactMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (contactMessage.status === "unread") {
      contactMessage.status = "read";
      await contactMessage.save();
    }

    return res.status(200).json({
      success: true,
      data: contactMessage,
    });
  } catch (error) {
    console.error("Get single message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load message",
      error: error.message,
    });
  }
};

// @desc    Update message status
// @route   PUT /api/contact/:id/status
// @access  Admin
const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    if (!["read", "unread"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be read or unread",
      });
    }

    const updatedMessage = await Contact.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message status updated",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Update message status error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to update message status",
      error: error.message,
    });
  }
};

// @desc    Delete contact message
// @route   DELETE /api/contact/:id
// @access  Admin
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid message ID",
      });
    }

    const deletedMessage = await Contact.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Delete message error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to delete message",
      error: error.message,
    });
  }
};

module.exports = {
  createContactMessage,
  getAllMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage,
};