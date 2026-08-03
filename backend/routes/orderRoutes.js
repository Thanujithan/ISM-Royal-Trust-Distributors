const express = require("express");

const {
    protect,
    adminOnly
} = require("../middleware/auth");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    getAllOrders,
    updateOrderStatus,
    cancelMyOrder
} = require("../controllers/orderController");

const router = express.Router();

/*
========================================
Customer Routes
========================================
*/

// Place new order
router.post(
    "/",
    protect,
    createOrder
);

// Logged-in user's orders
router.get(
    "/my-orders",
    protect,
    getMyOrders
);

// Cancel own order
router.put(
    "/:id/cancel",
    protect,
    cancelMyOrder
);

/*
========================================
Admin Routes
========================================
*/

// Get every order
router.get(
    "/",
    protect,
    adminOnly,
    getAllOrders
);

// Update order and payment status
router.put(
    "/:id/status",
    protect,
    adminOnly,
    updateOrderStatus
);

/*
========================================
Shared Route
========================================
*/

// Owner or admin can view single order
router.get(
    "/:id",
    protect,
    getOrderById
);

module.exports = router;