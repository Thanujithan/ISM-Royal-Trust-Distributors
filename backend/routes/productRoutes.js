const express = require("express");

const {
    protect,
    adminOnly
} = require("../middleware/auth");

const uploadProductImage =
    require("../middleware/productUpload");

const {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const router = express.Router();

/* Public routes */

router.get("/", getProducts);

router.get("/:id", getProductById);

/* Admin routes */

router.post(
    "/",
    protect,
    adminOnly,
    uploadProductImage.single("image"),
    createProduct
);

router.put(
    "/:id",
    protect,
    adminOnly,
    uploadProductImage.single("image"),
    updateProduct
);

router.delete(
    "/:id",
    protect,
    adminOnly,
    deleteProduct
);

module.exports = router;