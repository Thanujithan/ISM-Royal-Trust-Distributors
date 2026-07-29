const User = require("../models/User");

// Get all users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get single user
const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Update user role
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;

        if (!role) {
            return res.status(400).json({
                success: false,
                message: "Role is required"
            });
        }

        if (!["customer", "admin"].includes(role)) {
            return res.status(400).json({
                success: false,
                message: "Role must be customer or admin"
            });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent admin from changing their own role
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot change your own role"
            });
        }

        user.role = role;
        await user.save();

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Delete user
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        // Prevent admin from deleting own account
        if (user._id.toString() === req.user.id.toString()) {
            return res.status(400).json({
                success: false,
                message: "You cannot delete your own account"
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: "User deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUserRole,
    deleteUser
};