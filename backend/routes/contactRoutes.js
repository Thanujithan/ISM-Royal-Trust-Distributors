const express = require("express");

const {
    createContactMessage,
    getAllContactMessages,
    getContactMessageById,
    markMessageAsRead,
    replyToContactMessage,
    deleteContactMessage
} = require("../controllers/contactController");

const router = express.Router();

// Public route
router.post("/", createContactMessage);

// Admin routes
router.get("/", getAllContactMessages);
router.get("/:id", getContactMessageById);
router.put("/:id/read", markMessageAsRead);
router.put("/:id/reply", replyToContactMessage);
router.delete("/:id", deleteContactMessage);

module.exports = router;