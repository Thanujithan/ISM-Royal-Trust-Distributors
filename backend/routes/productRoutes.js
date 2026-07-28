const express = require("express");
const router = express.Router();

const {
    getProducts,
    getProductById,
    createProduct
} = require("../controllers/productController");

// Get all products
router.get("/", getProducts);

// Get single product
router.get("/:id", getProductById);

// Create new product
router.post("/", createProduct);

module.exports = router;