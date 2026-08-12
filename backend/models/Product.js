const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [
                true,
                "Product name is required"
            ],
            trim: true
        },

        category: {
            type: String,
            required: [
                true,
                "Product category is required"
            ],
            trim: true
        },

        brand: {
            type: String,
            trim: true,
            default: "ISM Royal Trust"
        },

        /*
        ========================================
        NET CONTENT

        Examples:
        200 ml
        500 ml
        1 L
        100 g
        1 kg
        5 kg
        ========================================
        */

        netContent: {
            type: String,
            trim: true,
            default: ""
        },

        /*
        ========================================
        LEGACY PRICE

        Existing frontend/backend functions
        may still use price.

        price always follows retailPrice.
        ========================================
        */

        price: {
            type: Number,
            min: [
                0,
                "Price cannot be negative"
            ],
            default: 0
        },

        /*
        ========================================
        RETAIL AND WHOLESALE PRICES
        ========================================
        */

        retailPrice: {
            type: Number,
            min: [
                0,
                "Retail price cannot be negative"
            ]
        },

        wholesalePrice: {
            type: Number,
            min: [
                0,
                "Wholesale price cannot be negative"
            ]
        },

        wholesaleMinimumQuantity: {
            type: Number,
            default: 20,
            min: [
                1,
                "Wholesale minimum quantity must be at least 1"
            ]
        },

        stock: {
            type: Number,
            required: [
                true,
                "Stock quantity is required"
            ],
            default: 0,
            min: [
                0,
                "Stock cannot be negative"
            ]
        },

        image: {
            type: String,
            trim: true,
            default: ""
        },

        description: {
            type: String,
            required: [
                true,
                "Product description is required"
            ],
            trim: true
        },

        isAvailable: {
            type: Boolean,
            default: true
        },

        status: {
            type: String,
            enum: [
                "active",
                "inactive"
            ],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);


/*
========================================
PRICE COMPATIBILITY

Old products:
price only

New products:
retailPrice
wholesalePrice
wholesaleMinimumQuantity
========================================
*/

productSchema.pre(
    "validate",
    function () {
        const legacyPrice =
            Number(this.price || 0);

        const retailPrice =
            this.retailPrice !== undefined &&
            this.retailPrice !== null
                ? Number(this.retailPrice)
                : legacyPrice;

        const wholesalePrice =
            this.wholesalePrice !== undefined &&
            this.wholesalePrice !== null
                ? Number(this.wholesalePrice)
                : retailPrice;

        const minimumQuantity =
            Number(
                this.wholesaleMinimumQuantity ||
                20
            );

        this.retailPrice =
            Number.isNaN(retailPrice)
                ? 0
                : retailPrice;

        this.wholesalePrice =
            Number.isNaN(wholesalePrice)
                ? this.retailPrice
                : wholesalePrice;

        this.wholesaleMinimumQuantity =
            Number.isInteger(
                minimumQuantity
            ) &&
            minimumQuantity >= 1
                ? minimumQuantity
                : 20;

        /*
        Existing functions using price
        will still get retail price.
        */

        this.price =
            this.retailPrice;

        /*
        Wholesale price must not be
        greater than retail price.
        */

        if (
            this.wholesalePrice >
            this.retailPrice
        ) {
            this.invalidate(
                "wholesalePrice",
                "Wholesale price cannot be greater than retail price"
            );
        }

        /*
        Clean net content value
        */

        if (
            this.netContent !== undefined &&
            this.netContent !== null
        ) {
            this.netContent =
                String(
                    this.netContent
                ).trim();
        }
    }
);


/*
========================================
STATUS AND AVAILABILITY
========================================
*/

productSchema.pre(
    "save",
    function () {
        this.isAvailable =
            this.status === "active";
    }
);


module.exports =
    mongoose.model(
        "Product",
        productSchema
    );