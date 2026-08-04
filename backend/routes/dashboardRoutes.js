const express = require("express");

const {
    protect,
    adminOnly
} = require("../middleware/auth");

const {
    getDashboardData
} = require("../controllers/dashboardController");

const router = express.Router();

router.get(
    "/",
    protect,
    adminOnly,
    getDashboardData
);

module.exports = router;