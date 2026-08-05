const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const Product = require("../models/Product");

/* ========================================
   CONSTANTS
======================================== */

const ALLOWED_CATEGORIES = [
    "juice",
    "bites",
    "bottled-water",
    "sweets"
];

const DEFAULT_WHOLESALE_MINIMUM = 20;

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

    if (
        !String(imagePath).startsWith(
            "/uploads/products/"
        )
    ) {
        return null;
    }

    const fileName =
        path.basename(imagePath);

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

function deleteCurrentUploadedFile(req) {
    if (!req.file) {
        return;
    }

    deleteUploadedImage(
        buildUploadedImagePath(
            req.file
        )
    );
}

/* ========================================
   VALUE HELPERS
======================================== */

function normalizeCategory(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function normalizeStatus(value) {
    return String(value || "")
        .trim()
        .toLowerCase() === "inactive"
        ? "inactive"
        : "active";
}

function normalizeBoolean(
    value,
    fallback
) {
    if (
        value === true ||
        String(value).toLowerCase() === "true"
    ) {
        return true;
    }

    if (
        value === false ||
        String(value).toLowerCase() === "false"
    ) {
        return false;
    }

    return fallback;
}

function getNumericValue(value) {
    if (
        value === undefined ||
        value === null ||
        value === ""
    ) {
        return null;
    }

    const numberValue =
        Number(value);

    return Number.isNaN(numberValue)
        ? null
        : numberValue;
}

function validatePricing({
    retailPrice,
    wholesalePrice,
    wholesaleMinimumQuantity
}) {
    if (
        retailPrice === null ||
        retailPrice < 0
    ) {
        return {
            valid: false,
            message:
                "Please enter a valid retail price."
        };
    }

    if (
        wholesalePrice === null ||
        wholesalePrice < 0
    ) {
        return {
            valid: false,
            message:
                "Please enter a valid wholesale price."
        };
    }

    if (
        wholesalePrice >
        retailPrice
    ) {
        return {
            valid: false,
            message:
                "Wholesale price cannot be greater than retail price."
        };
    }

    if (
        wholesaleMinimumQuantity === null ||
        !Number.isInteger(
            wholesaleMinimumQuantity
        ) ||
        wholesaleMinimumQuantity < 1
    ) {
        return {
            valid: false,
            message:
                "Wholesale minimum quantity must be at least 1."
        };
    }

    return {
        valid: true
    };
}

/* ========================================
   GET ALL PRODUCTS
   GET /api/products
======================================== */

const getProducts = async (
    req,
    res
) => {
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
            retailPrice,
            wholesalePrice,
            wholesaleMinimumQuantity,
            stock,
            description,
            status,
            isAvailable
        } = req.body;

        if (
            !name ||
            !String(name).trim()
        ) {
            deleteCurrentUploadedFile(req);

            return res.status(400).json({
                success: false,
                message:
                    "Product name is required."
            });
        }

        const normalizedCategory =
            normalizeCategory(category);

        if (
            !ALLOWED_CATEGORIES.includes(
                normalizedCategory
            )
        ) {
            deleteCurrentUploadedFile(req);

            return res.status(400).json({
                success: false,
                message:
                    "Category must be juice, bites, bottled-water or sweets."
            });
        }

        if (
            !description ||
            !String(description).trim()
        ) {
            deleteCurrentUploadedFile(req);

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

        /*
        Old frontend price field அனுப்பினாலும்
        retail price ஆக பயன்படுத்தப்படும்.
        */

        const normalizedRetailPrice =
            getNumericValue(
                retailPrice ?? price
            );

        const normalizedWholesalePrice =
            getNumericValue(
                wholesalePrice ??
                retailPrice ??
                price
            );

        const normalizedMinimumQuantity =
            getNumericValue(
                wholesaleMinimumQuantity ??
                DEFAULT_WHOLESALE_MINIMUM
            );

        const pricingValidation =
            validatePricing({
                retailPrice:
                    normalizedRetailPrice,

                wholesalePrice:
                    normalizedWholesalePrice,

                wholesaleMinimumQuantity:
                    normalizedMinimumQuantity
            });

        if (!pricingValidation.valid) {
            deleteCurrentUploadedFile(req);

            return res.status(400).json({
                success: false,
                message:
                    pricingValidation.message
            });
        }

        const numericStock =
            getNumericValue(stock);

        if (
            numericStock === null ||
            !Number.isInteger(
                numericStock
            ) ||
            numericStock < 0
        ) {
            deleteCurrentUploadedFile(req);

            return res.status(400).json({
                success: false,
                message:
                    "Please enter a valid stock quantity."
            });
        }

        const productStatus =
            normalizeStatus(status);

        const uploadedImage =
            buildUploadedImagePath(
                req.file
            );

        const normalizedAvailability =
            normalizeBoolean(
                isAvailable,
                productStatus === "active"
            );

        const product =
            await Product.create({
                name:
                    String(name).trim(),

                category:
                    normalizedCategory,

                brand:
                    brand &&
                    String(brand).trim()
                        ? String(
                              brand
                          ).trim()
                        : "ISM Royal Trust",

                /*
                Backward compatibility:
                price = retail price
                */

                price:
                    normalizedRetailPrice,

                retailPrice:
                    normalizedRetailPrice,

                wholesalePrice:
                    normalizedWholesalePrice,

                wholesaleMinimumQuantity:
                    normalizedMinimumQuantity,

                stock:
                    numericStock,

                image:
                    uploadedImage,

                description:
                    String(
                        description
                    ).trim(),

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
        deleteCurrentUploadedFile(req);

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
            deleteCurrentUploadedFile(req);

            return res.status(400).json({
                success: false,
                message:
                    "Invalid product ID."
            });
        }

        const existingProduct =
            await Product.findById(id);

        if (!existingProduct) {
            deleteCurrentUploadedFile(req);

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
            retailPrice,
            wholesalePrice,
            wholesaleMinimumQuantity,
            stock,
            description,
            status,
            isAvailable
        } = req.body;

        if (name !== undefined) {
            if (!String(name).trim()) {
                deleteCurrentUploadedFile(req);

                return res.status(400).json({
                    success: false,
                    message:
                        "Product name cannot be empty."
                });
            }

            existingProduct.name =
                String(name).trim();
        }

        if (category !== undefined) {
            const normalizedCategory =
                normalizeCategory(category);

            if (
                !ALLOWED_CATEGORIES.includes(
                    normalizedCategory
                )
            ) {
                deleteCurrentUploadedFile(req);

                return res.status(400).json({
                    success: false,
                    message:
                        "Category must be juice, bites, bottled-water or sweets."
                });
            }

            existingProduct.category =
                normalizedCategory;
        }

        if (brand !== undefined) {
            existingProduct.brand =
                String(brand).trim() ||
                "ISM Royal Trust";
        }

        /*
        Retail price update:
        new retailPrice இல்லையென்றால்
        old price field fallback.
        */

        if (
            retailPrice !== undefined ||
            price !== undefined
        ) {
            const normalizedRetailPrice =
                getNumericValue(
                    retailPrice ?? price
                );

            if (
                normalizedRetailPrice === null ||
                normalizedRetailPrice < 0
            ) {
                deleteCurrentUploadedFile(req);

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid retail price."
                });
            }

            existingProduct.retailPrice =
                normalizedRetailPrice;

            existingProduct.price =
                normalizedRetailPrice;
        }

        if (wholesalePrice !== undefined) {
            const normalizedWholesalePrice =
                getNumericValue(
                    wholesalePrice
                );

            if (
                normalizedWholesalePrice === null ||
                normalizedWholesalePrice < 0
            ) {
                deleteCurrentUploadedFile(req);

                return res.status(400).json({
                    success: false,
                    message:
                        "Please enter a valid wholesale price."
                });
            }

            existingProduct.wholesalePrice =
                normalizedWholesalePrice;
        }

        if (
            wholesaleMinimumQuantity !==
            undefined
        ) {
            const normalizedMinimumQuantity =
                getNumericValue(
                    wholesaleMinimumQuantity
                );

            if (
                normalizedMinimumQuantity === null ||
                !Number.isInteger(
                    normalizedMinimumQuantity
                ) ||
                normalizedMinimumQuantity < 1
            ) {
                deleteCurrentUploadedFile(req);

                return res.status(400).json({
                    success: false,
                    message:
                        "Wholesale minimum quantity must be at least 1."
                });
            }

            existingProduct
                .wholesaleMinimumQuantity =
                    normalizedMinimumQuantity;
        }

        /*
        Final pricing validation:
        wholesale > retail ஆகக்கூடாது.
        */

        const finalRetailPrice =
            Number(
                existingProduct.retailPrice ??
                existingProduct.price ??
                0
            );

        const finalWholesalePrice =
            Number(
                existingProduct.wholesalePrice ??
                finalRetailPrice
            );

        const finalMinimumQuantity =
            Number(
                existingProduct
                    .wholesaleMinimumQuantity ??
                DEFAULT_WHOLESALE_MINIMUM
            );

        const pricingValidation =
            validatePricing({
                retailPrice:
                    finalRetailPrice,

                wholesalePrice:
                    finalWholesalePrice,

                wholesaleMinimumQuantity:
                    finalMinimumQuantity
            });

        if (!pricingValidation.valid) {
            deleteCurrentUploadedFile(req);

            return res.status(400).json({
                success: false,
                message:
                    pricingValidation.message
            });
        }

        if (stock !== undefined) {
            const numericStock =
                getNumericValue(stock);

            if (
                numericStock === null ||
                !Number.isInteger(
                    numericStock
                ) ||
                numericStock < 0
            ) {
                deleteCurrentUploadedFile(req);

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
                deleteCurrentUploadedFile(req);

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
            const normalizedProductStatus =
                normalizeStatus(status);

            existingProduct.status =
                normalizedProductStatus;

            existingProduct.isAvailable =
                normalizedProductStatus ===
                "active";
        }

        if (
            isAvailable !== undefined &&
            status === undefined
        ) {
            const normalizedAvailability =
                normalizeBoolean(
                    isAvailable,
                    existingProduct.isAvailable
                );

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
        deleteCurrentUploadedFile(req);

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