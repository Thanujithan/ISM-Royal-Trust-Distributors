const express = require("express");

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const router = express.Router();

/*
========================================
Product Routes
Base URL: /api/products
========================================
*/

// Get all products
router.get("/", getProducts);

// Get one product
router.get("/:id", getProductById);

// Create a new product
router.post("/", createProduct);

// Update an existing product
router.put("/:id", updateProduct);

// Delete a product
router.delete("/:id", deleteProduct);

module.exports = router;