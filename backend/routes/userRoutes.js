const express = require("express");
const router = express.Router();

const {
    protect,
    adminOnly
} = require("../middleware/auth");

const {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser,
    updateProfile,
    changePassword
} = require("../controllers/userController");

// Admin only routes
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

router.get("/", protect, adminOnly, getAllUsers);
router.get("/:id", protect, adminOnly, getUserById);
router.put("/:id/role", protect, adminOnly, updateUserRole);
router.delete("/:id", protect, adminOnly, deleteUser);

module.exports = router;