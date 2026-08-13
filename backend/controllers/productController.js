const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

const Product = require("../models/Product");


/* ========================================
   CONSTANTS
======================================== */

const ALLOWED_CATEGORIES = [
    "juice",
    "sweets",
    "bites",
    "bottled-water",
    "rice"
];

const DEFAULT_WHOLESALE_MINIMUM = 20;
const DEFAULT_LOW_STOCK_THRESHOLD = 10;

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
        getAbsoluteImagePath(
            imagePath
        );

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
        .toLowerCase() ===
        "inactive"
        ? "inactive"
        : "active";
}


function normalizeBoolean(
    value,
    fallback
) {
    if (
        value === true ||
        String(value).toLowerCase() ===
            "true"
    ) {
        return true;
    }

    if (
        value === false ||
        String(value).toLowerCase() ===
            "false"
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

    return Number.isNaN(
        numberValue
    )
        ? null
        : numberValue;
}


function normalizeNetContent(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value).trim();
}


/* ========================================
   PRICING VALIDATION
======================================== */

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
        wholesaleMinimumQuantity ===
            null ||
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
            !mongoose.Types.ObjectId
                .isValid(id)
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid product ID."
                });
        }

        const product =
            await Product.findById(id);

        if (!product) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Product not found."
                });
        }

        return res
            .status(200)
            .json({
                success: true,
                data: product
            });
    } catch (error) {
        console.error(
            "Get product error:",
            error
        );

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Failed to fetch product.",
                error:
                    error.message
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
            netContent,
            price,
            retailPrice,
            wholesalePrice,
            wholesaleMinimumQuantity,
            stock,
            lowStockThreshold,
            description,
            status,
            isAvailable
        } = req.body;

        /* -------------------------------
           PRODUCT NAME
        -------------------------------- */

        if (
            !name ||
            !String(name).trim()
        ) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Product name is required."
                });
        }


        /* -------------------------------
           CATEGORY
        -------------------------------- */

        const normalizedCategory =
            normalizeCategory(
                category
            );

        if (
            !ALLOWED_CATEGORIES.includes(
                normalizedCategory
            )
        ) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Category must be juice, sweets, bites, bottled-water or rice."
                });
        }


        /* -------------------------------
           DESCRIPTION
        -------------------------------- */

        if (
            !description ||
            !String(
                description
            ).trim()
        ) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Product description is required."
                });
        }


        /* -------------------------------
           IMAGE
        -------------------------------- */

        if (!req.file) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Product image is required."
                });
        }


        /* -------------------------------
           PRICE NORMALIZATION

           Old frontend:
           price

           New frontend:
           retailPrice
           wholesalePrice
        -------------------------------- */

        const normalizedRetailPrice =
            getNumericValue(
                retailPrice ??
                price
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


        if (
            !pricingValidation.valid
        ) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        pricingValidation
                            .message
                });
        }


        /* -------------------------------
           STOCK
        -------------------------------- */

        const numericStock =
            getNumericValue(
                stock
            );

        if (
            numericStock === null ||
            !Number.isInteger(
                numericStock
            ) ||
            numericStock < 0
        ) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Please enter a valid stock quantity."
                });
        }

                    /* -------------------------------
            LOW STOCK THRESHOLD
            -------------------------------- */

            const numericLowStockThreshold =
                getNumericValue(
                    lowStockThreshold ??
                    DEFAULT_LOW_STOCK_THRESHOLD
                );

            if (
                numericLowStockThreshold === null ||
                !Number.isInteger(
                    numericLowStockThreshold
                ) ||
                numericLowStockThreshold < 1
            ) {

                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Low stock threshold must be at least 1."
                    });
            }


        /* -------------------------------
           STATUS
        -------------------------------- */

        const productStatus =
            normalizeStatus(
                status
            );

        const normalizedAvailability =
            normalizeBoolean(
                isAvailable,
                productStatus ===
                    "active"
            );


        /* -------------------------------
           IMAGE PATH
        -------------------------------- */

        const uploadedImage =
            buildUploadedImagePath(
                req.file
            );


        /* -------------------------------
           CREATE PRODUCT
        -------------------------------- */

        const product =
            await Product.create({
                name:
                    String(
                        name
                    ).trim(),

                category:
                    normalizedCategory,

                brand:
                    brand &&
                    String(
                        brand
                    ).trim()
                        ? String(
                              brand
                          ).trim()
                        : "ISM Royal Trust",

                netContent:
                    normalizeNetContent(
                        netContent
                    ),

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

                lowStockThreshold:
                    numericLowStockThreshold,

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


        return res
            .status(201)
            .json({
                success: true,
                message:
                    "Product created successfully.",
                data: product
            });

    } catch (error) {
        deleteCurrentUploadedFile(
            req
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

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        validationMessages
                            .join(" ")
                });
        }

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Failed to create product.",
                error:
                    error.message
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


        /* -------------------------------
           VALIDATE ID
        -------------------------------- */

        if (
            !mongoose.Types.ObjectId
                .isValid(id)
        ) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid product ID."
                });
        }


        /* -------------------------------
           FIND PRODUCT
        -------------------------------- */

        const existingProduct =
            await Product.findById(
                id
            );

        if (!existingProduct) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Product not found."
                });
        }


        const {
            name,
            category,
            brand,
            netContent,
            price,
            retailPrice,
            wholesalePrice,
            wholesaleMinimumQuantity,
            stock,
            lowStockThreshold,
            description,
            status,
            isAvailable
        } = req.body;


        /* -------------------------------
           NAME
        -------------------------------- */

        if (
            name !== undefined
        ) {
            if (
                !String(
                    name
                ).trim()
            ) {
                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Product name cannot be empty."
                    });
            }

            existingProduct.name =
                String(
                    name
                ).trim();
        }


        /* -------------------------------
           CATEGORY
        -------------------------------- */

        if (
            category !== undefined
        ) {
            const normalizedCategory =
                normalizeCategory(
                    category
                );

            if (
                !ALLOWED_CATEGORIES
                    .includes(
                        normalizedCategory
                    )
            ) {
                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Category must be juice, sweets, bites, bottled-water or rice."
                    });
            }

            existingProduct.category =
                normalizedCategory;
        }


        /* -------------------------------
           BRAND
        -------------------------------- */

        if (
            brand !== undefined
        ) {
            existingProduct.brand =
                String(
                    brand
                ).trim() ||
                "ISM Royal Trust";
        }


        /* -------------------------------
           NET CONTENT
        -------------------------------- */

        if (
            netContent !== undefined
        ) {
            existingProduct.netContent =
                normalizeNetContent(
                    netContent
                );
        }


        /* -------------------------------
           RETAIL PRICE
        -------------------------------- */

        if (
            retailPrice !==
                undefined ||
            price !== undefined
        ) {
            const normalizedRetailPrice =
                getNumericValue(
                    retailPrice ??
                    price
                );

            if (
                normalizedRetailPrice ===
                    null ||
                normalizedRetailPrice < 0
            ) {
                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Please enter a valid retail price."
                    });
            }

            existingProduct.retailPrice =
                normalizedRetailPrice;

            /*
            Existing old functions
            price use செய்தாலும்
            retail price கிடைக்கும்.
            */

            existingProduct.price =
                normalizedRetailPrice;
        }


        /* -------------------------------
           WHOLESALE PRICE
        -------------------------------- */

        if (
            wholesalePrice !==
            undefined
        ) {
            const normalizedWholesalePrice =
                getNumericValue(
                    wholesalePrice
                );

            if (
                normalizedWholesalePrice ===
                    null ||
                normalizedWholesalePrice < 0
            ) {
                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Please enter a valid wholesale price."
                    });
            }

            existingProduct
                .wholesalePrice =
                    normalizedWholesalePrice;
        }


        /* -------------------------------
           WHOLESALE MINIMUM QUANTITY
        -------------------------------- */

        if (
            wholesaleMinimumQuantity !==
            undefined
        ) {
            const normalizedMinimumQuantity =
                getNumericValue(
                    wholesaleMinimumQuantity
                );

            if (
                normalizedMinimumQuantity ===
                    null ||
                !Number.isInteger(
                    normalizedMinimumQuantity
                ) ||
                normalizedMinimumQuantity <
                    1
            ) {
                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Wholesale minimum quantity must be at least 1."
                    });
            }

            existingProduct
                .wholesaleMinimumQuantity =
                    normalizedMinimumQuantity;
        }


        /* -------------------------------
           FINAL PRICE VALIDATION
        -------------------------------- */

        const finalRetailPrice =
            Number(
                existingProduct
                    .retailPrice ??
                existingProduct
                    .price ??
                0
            );

        const finalWholesalePrice =
            Number(
                existingProduct
                    .wholesalePrice ??
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


        if (
            !pricingValidation.valid
        ) {
            deleteCurrentUploadedFile(
                req
            );

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        pricingValidation
                            .message
                });
        }


        /* -------------------------------
           STOCK
        -------------------------------- */

        if (
            stock !== undefined
        ) {
            const numericStock =
                getNumericValue(
                    stock
                );

            if (
                numericStock === null ||
                !Number.isInteger(
                    numericStock
                ) ||
                numericStock < 0
            ) {
                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Please enter a valid stock quantity."
                    });
            }

            existingProduct.stock =
                numericStock;
        }

                /* -------------------------------
        LOW STOCK THRESHOLD
        -------------------------------- */

        if (
            lowStockThreshold !== undefined
        ) {

            const numericLowStockThreshold =
                getNumericValue(
                    lowStockThreshold
                );

            if (
                numericLowStockThreshold === null ||
                !Number.isInteger(
                    numericLowStockThreshold
                ) ||
                numericLowStockThreshold < 1
            ) {

                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Low stock threshold must be at least 1."
                    });
            }

            existingProduct.lowStockThreshold =
                numericLowStockThreshold;
        }


        /* -------------------------------
           DESCRIPTION
        -------------------------------- */

        if (
            description !==
            undefined
        ) {
            if (
                !String(
                    description
                ).trim()
            ) {
                deleteCurrentUploadedFile(
                    req
                );

                return res
                    .status(400)
                    .json({
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


        /* -------------------------------
           STATUS
        -------------------------------- */

        if (
            status !== undefined
        ) {
            const normalizedProductStatus =
                normalizeStatus(
                    status
                );

            existingProduct.status =
                normalizedProductStatus;

            existingProduct.isAvailable =
                normalizedProductStatus ===
                "active";
        }


        /* -------------------------------
           AVAILABILITY
        -------------------------------- */

        if (
            isAvailable !==
                undefined &&
            status === undefined
        ) {
            const normalizedAvailability =
                normalizeBoolean(
                    isAvailable,
                    existingProduct
                        .isAvailable
                );

            existingProduct.isAvailable =
                normalizedAvailability;

            existingProduct.status =
                normalizedAvailability
                    ? "active"
                    : "inactive";
        }


        /* -------------------------------
           IMAGE UPDATE
        -------------------------------- */

        const oldImagePath =
            existingProduct.image;

        if (req.file) {
            existingProduct.image =
                buildUploadedImagePath(
                    req.file
                );
        }


        /* -------------------------------
           SAVE
        -------------------------------- */

        const updatedProduct =
            await existingProduct
                .save();


        /*
        New image successfully saved
        ஆன பிறகு மட்டும் old image delete.
        */

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


        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Product updated successfully.",
                data:
                    updatedProduct
            });

    } catch (error) {
        deleteCurrentUploadedFile(
            req
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

            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        validationMessages
                            .join(" ")
                });
        }

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Failed to update product.",
                error:
                    error.message
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
        const { id } =
            req.params;

        if (
            !mongoose.Types.ObjectId
                .isValid(id)
        ) {
            return res
                .status(400)
                .json({
                    success: false,
                    message:
                        "Invalid product ID."
                });
        }


        const product =
            await Product.findById(
                id
            );

        if (!product) {
            return res
                .status(404)
                .json({
                    success: false,
                    message:
                        "Product not found."
                });
        }


        const productImagePath =
            product.image;


        await product.deleteOne();


        if (
            productImagePath
        ) {
            deleteUploadedImage(
                productImagePath
            );
        }


        return res
            .status(200)
            .json({
                success: true,
                message:
                    "Product deleted successfully.",

                data: {
                    id:
                        product._id,

                    name:
                        product.name
                }
            });

    } catch (error) {
        console.error(
            "Delete product error:",
            error
        );

        return res
            .status(500)
            .json({
                success: false,
                message:
                    "Failed to delete product.",
                error:
                    error.message
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