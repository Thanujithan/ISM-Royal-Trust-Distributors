const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const Product = require("../models/Product");

/* ========================================
   IMAGE HELPERS
======================================== */

function buildUploadedImagePath(file) {
    if (!file) {
        return "";
    }

    return `/uploads/products/${file.filename}`;
}

function getAbsoluteImagePath(imagePath) {
    if (!imagePath) {
        return null;
    }

    if (!imagePath.startsWith("/uploads/products/")) {
        return null;
    }

    const fileName = path.basename(imagePath);

    return path.join(
        __dirname,
        "../uploads/products",
        fileName
    );
}

function deleteUploadedImage(imagePath) {
    const absolutePath =
        getAbsoluteImagePath(imagePath);

    if (!absolutePath) {
        return;
    }

    fs.unlink(
        absolutePath,
        (error) => {
            if (
                error &&
                error.code !== "ENOENT"
            ) {
                console.error(
                    "Unable to delete product image:",
                    error
                );
            }
        }
    );
}

/* ========================================
   GET ALL PRODUCTS
   GET /api/products
======================================== */

const getProducts = async (req, res) => {
    try {
        const products =
            await Product.find().sort({
                createdAt: -1
            });

        return res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error(
            "Get products error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch products.",
            error: error.message
        });
    }
};

/* ========================================
   GET SINGLE PRODUCT
   GET /api/products/:id
======================================== */

const getProductById = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid product ID."
            });
        }

        const product =
            await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found."
            });
        }

        return res.status(200).json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error(
            "Get product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to fetch product.",
            error: error.message
        });
    }
};

/* ========================================
   CREATE PRODUCT
   POST /api/products
======================================== */

const createProduct = async (
    req,
    res
) => {
    try {
        const {
            name,
            category,
            brand,
            price,
            stock,
            description,
            status,
            isAvailable
        } = req.body;

        if (!name || !name.trim()) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Product name is required."
            });
        }

        if (
            !category ||
            !category.trim()
        ) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Product category is required."
            });
        }

        if (
            price === undefined ||
            price === null ||
            price === ""
        ) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Product price is required."
            });
        }

        if (
            stock === undefined ||
            stock === null ||
            stock === ""
        ) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Stock quantity is required."
            });
        }

        if (
            !description ||
            !description.trim()
        ) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Product description is required."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message:
                    "Product image is required."
            });
        }

        const numericPrice =
            Number(price);

        const numericStock =
            Number(stock);

        if (
            Number.isNaN(
                numericPrice
            ) ||
            numericPrice < 0
        ) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid product price."
            });
        }

        if (
            Number.isNaN(
                numericStock
            ) ||
            numericStock < 0
        ) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid stock quantity."
            });
        }

        const productStatus =
            status === "inactive"
                ? "inactive"
                : "active";

        const uploadedImage =
            buildUploadedImagePath(
                req.file
            );

        const normalizedAvailability =
            String(isAvailable) === "true"
                ? true
                : String(isAvailable) ===
                  "false"
                ? false
                : productStatus ===
                  "active";

        const product =
            await Product.create({
                name:
                    name.trim(),

                category:
                    category.trim(),

                brand:
                    brand &&
                    String(brand).trim()
                        ? String(
                              brand
                          ).trim()
                        : "ISM Royal Trust",

                price:
                    numericPrice,

                stock:
                    numericStock,

                image:
                    uploadedImage,

                description:
                    description.trim(),

                status:
                    productStatus,

                isAvailable:
                    normalizedAvailability
            });

        return res.status(201).json({
            success: true,
            message:
                "Product created successfully.",
            data: product
        });
    } catch (error) {
        deleteUploadedImage(
            buildUploadedImagePath(
                req.file
            )
        );

        console.error(
            "Create product error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const validationMessages =
                Object.values(
                    error.errors
                ).map(
                    (item) =>
                        item.message
                );

            return res.status(400).json({
                success: false,
                message:
                    validationMessages.join(
                        " "
                    )
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to create product.",
            error: error.message
        });
    }
};
/* ========================================
   UPDATE PRODUCT
   PUT /api/products/:id
======================================== */

const updateProduct = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(400).json({
                success: false,
                message:
                    "Invalid product ID."
            });
        }

        const existingProduct =
            await Product.findById(id);

        if (!existingProduct) {
            deleteUploadedImage(
                buildUploadedImagePath(
                    req.file
                )
            );

            return res.status(404).json({
                success: false,
                message:
                    "Product not found."
            });
        }

        const {
            name,
            category,
            brand,
            price,
            stock,
            description,
            status,
            isAvailable
        } = req.body;

        if (name !== undefined) {
            if (!String(name).trim()) {
                deleteUploadedImage(
                    buildUploadedImagePath(
                        req.file
                    )
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Product name cannot be empty."
                });
            }

            existingProduct.name =
                String(name).trim();
        }

        if (
            category !== undefined
        ) {
            if (
                !String(
                    category
                ).trim()
            ) {
                deleteUploadedImage(
                    buildUploadedImagePath(
                        req.file
                    )
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Product category cannot be empty."
                });
            }

            existingProduct.category =
                String(
                    category
                ).trim();
        }

        if (brand !== undefined) {
            existingProduct.brand =
                String(brand).trim() ||
                "ISM Royal Trust";
        }

        if (price !== undefined) {
            const numericPrice =
                Number(price);

            if (
                Number.isNaN(
                    numericPrice
                ) ||
                numericPrice < 0
            ) {
                deleteUploadedImage(
                    buildUploadedImagePath(
                        req.file
                    )
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid product price."
                });
            }

            existingProduct.price =
                numericPrice;
        }

        if (stock !== undefined) {
            const numericStock =
                Number(stock);

            if (
                Number.isNaN(
                    numericStock
                ) ||
                numericStock < 0
            ) {
                deleteUploadedImage(
                    buildUploadedImagePath(
                        req.file
                    )
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid stock quantity."
                });
            }

            existingProduct.stock =
                numericStock;
        }

        if (
            description !== undefined
        ) {
            if (
                !String(
                    description
                ).trim()
            ) {
                deleteUploadedImage(
                    buildUploadedImagePath(
                        req.file
                    )
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Product description cannot be empty."
                });
            }

            existingProduct.description =
                String(
                    description
                ).trim();
        }

        if (status !== undefined) {
            if (
                ![
                    "active",
                    "inactive"
                ].includes(status)
            ) {
                deleteUploadedImage(
                    buildUploadedImagePath(
                        req.file
                    )
                );

                return res.status(400).json({
                    success: false,
                    message:
                        "Status must be active or inactive."
                });
            }

            existingProduct.status =
                status;

            existingProduct.isAvailable =
                status === "active";
        }

        if (
            isAvailable !== undefined &&
            status === undefined
        ) {
            const normalizedAvailability =
                String(isAvailable) ===
                "true";

            existingProduct.isAvailable =
                normalizedAvailability;

            existingProduct.status =
                normalizedAvailability
                    ? "active"
                    : "inactive";
        }

        const oldImagePath =
            existingProduct.image;

        if (req.file) {
            existingProduct.image =
                buildUploadedImagePath(
                    req.file
                );
        }

        const updatedProduct =
            await existingProduct.save();

        if (
            req.file &&
            oldImagePath &&
            oldImagePath !==
                updatedProduct.image
        ) {
            deleteUploadedImage(
                oldImagePath
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Product updated successfully.",
            data: updatedProduct
        });
    } catch (error) {
        deleteUploadedImage(
            buildUploadedImagePath(
                req.file
            )
        );

        console.error(
            "Update product error:",
            error
        );

        if (
            error.name ===
            "ValidationError"
        ) {
            const validationMessages =
                Object.values(
                    error.errors
                ).map(
                    (item) =>
                        item.message
                );

            return res.status(400).json({
                success: false,
                message:
                    validationMessages.join(
                        " "
                    )
            });
        }

        return res.status(500).json({
            success: false,
            message:
                "Failed to update product.",
            error: error.message
        });
    }
};
/* ========================================
   DELETE PRODUCT
   DELETE /api/products/:id
======================================== */

const deleteProduct = async (
    req,
    res
) => {
    try {
        const { id } = req.params;

        if (
            !mongoose.Types.ObjectId.isValid(
                id
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid product ID."
            });
        }

        const product =
            await Product.findById(id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found."
            });
        }

        const productImagePath =
            product.image;

        await product.deleteOne();

        if (productImagePath) {
            deleteUploadedImage(
                productImagePath
            );
        }

        return res.status(200).json({
            success: true,
            message:
                "Product deleted successfully.",
            data: {
                id: product._id,
                name: product.name
            }
        });
    } catch (error) {
        console.error(
            "Delete product error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to delete product.",
            error: error.message
        });
    }
};

/* ========================================
   EXPORTS
======================================== */

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
};