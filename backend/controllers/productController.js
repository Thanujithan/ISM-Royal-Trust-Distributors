const mongoose = require("mongoose");
const Product = require("../models/Product");

/*
========================================
Get all products
GET /api/products
========================================
*/
const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({
            createdAt: -1
        });

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error("Get products error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch products.",
            error: error.message
        });
    }
};

/*
========================================
Get a single product
GET /api/products/:id
========================================
*/
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        const product = await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error("Get product error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch product.",
            error: error.message
        });
    }
};

/*
========================================
Create a new product
POST /api/products
========================================
*/
const createProduct = async (req, res) => {
    try {
        const {
            name,
            category,
            brand,
            price,
            stock,
            image,
            description,
            status,
            isAvailable
        } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product name is required."
            });
        }

        if (!category || !category.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product category is required."
            });
        }

        if (
            price === undefined ||
            price === null ||
            price === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Product price is required."
            });
        }

        if (
            stock === undefined ||
            stock === null ||
            stock === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Stock quantity is required."
            });
        }

        if (!description || !description.trim()) {
            return res.status(400).json({
                success: false,
                message: "Product description is required."
            });
        }

        const numericPrice = Number(price);
        const numericStock = Number(stock);

        if (Number.isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid product price."
            });
        }

        if (Number.isNaN(numericStock) || numericStock < 0) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid stock quantity."
            });
        }

        const productStatus =
            status === "inactive" ? "inactive" : "active";

        const product = await Product.create({
            name: name.trim(),
            category: category.trim(),

            brand:
                brand && brand.trim()
                    ? brand.trim()
                    : "ISM Royal Trust",

            price: numericPrice,
            stock: numericStock,

            image:
                image && image.trim()
                    ? image.trim()
                    : "",

            description: description.trim(),

            status: productStatus,

            isAvailable:
                typeof isAvailable === "boolean"
                    ? isAvailable
                    : productStatus === "active"
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully.",
            data: product
        });
    } catch (error) {
        console.error("Create product error:", error);

        if (error.name === "ValidationError") {
            const validationMessages = Object.values(
                error.errors
            ).map((item) => item.message);

            return res.status(400).json({
                success: false,
                message: validationMessages.join(" ")
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to create product.",
            error: error.message
        });
    }
};

/*
========================================
Update product
PUT /api/products/:id
========================================
*/
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        const existingProduct = await Product.findById(id);

        if (!existingProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        const {
            name,
            category,
            brand,
            price,
            stock,
            image,
            description,
            status,
            isAvailable
        } = req.body;

        if (name !== undefined) {
            if (!String(name).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Product name cannot be empty."
                });
            }

            existingProduct.name = String(name).trim();
        }

        if (category !== undefined) {
            if (!String(category).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Product category cannot be empty."
                });
            }

            existingProduct.category =
                String(category).trim();
        }

        if (brand !== undefined) {
            existingProduct.brand =
                String(brand).trim() || "ISM Royal Trust";
        }

        if (price !== undefined) {
            const numericPrice = Number(price);

            if (
                Number.isNaN(numericPrice) ||
                numericPrice < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid product price."
                });
            }

            existingProduct.price = numericPrice;
        }

        if (stock !== undefined) {
            const numericStock = Number(stock);

            if (
                Number.isNaN(numericStock) ||
                numericStock < 0
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter a valid stock quantity."
                });
            }

            existingProduct.stock = numericStock;
        }

        if (image !== undefined) {
            existingProduct.image = String(image).trim();
        }

        if (description !== undefined) {
            if (!String(description).trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Product description cannot be empty."
                });
            }

            existingProduct.description =
                String(description).trim();
        }

        if (status !== undefined) {
            if (!["active", "inactive"].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Status must be active or inactive."
                });
            }

            existingProduct.status = status;
            existingProduct.isAvailable =
                status === "active";
        }

        if (
            isAvailable !== undefined &&
            status === undefined
        ) {
            existingProduct.isAvailable =
                Boolean(isAvailable);

            existingProduct.status = Boolean(isAvailable)
                ? "active"
                : "inactive";
        }

        const updatedProduct =
            await existingProduct.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully.",
            data: updatedProduct
        });
    } catch (error) {
        console.error("Update product error:", error);

        if (error.name === "ValidationError") {
            const validationMessages = Object.values(
                error.errors
            ).map((item) => item.message);

            return res.status(400).json({
                success: false,
                message: validationMessages.join(" ")
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to update product.",
            error: error.message
        });
    }
};

/*
========================================
Delete product
DELETE /api/products/:id
========================================
*/
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID."
            });
        }

        const deletedProduct =
            await Product.findByIdAndDelete(id);

        if (!deletedProduct) {
            return res.status(404).json({
                success: false,
                message: "Product not found."
            });
        }

        res.status(200).json({
            success: true,
            message: "Product deleted successfully.",
            data: {
                id: deletedProduct._id,
                name: deletedProduct.name
            }
        });
    } catch (error) {
        console.error("Delete product error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete product.",
            error: error.message
        });
    }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};