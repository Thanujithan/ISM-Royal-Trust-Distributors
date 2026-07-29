const express = require("express");

const {
  createContactMessage,
  getAllMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage,
} = require("../controllers/contactController");

const router = express.Router();

// Public contact form
router.post("/", createContactMessage);

// Admin message routes
router.get("/", getAllMessages);
router.get("/:id", getMessageById);
router.put("/:id/status", updateMessageStatus);
router.delete("/:id", deleteMessage);

module.exports = router;