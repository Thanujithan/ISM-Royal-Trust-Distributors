const mongoose = require("mongoose");


const productSchema = new mongoose.Schema(
    {
        /* ========================================
           BASIC PRODUCT INFORMATION
        ======================================== */

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


        /* ========================================
           NET CONTENT

           Examples:
           200 ml
           500 ml
           1 L
           100 g
           1 kg
           5 kg
        ======================================== */

        netContent: {
            type: String,
            trim: true,
            default: ""
        },


        /* ========================================
           LEGACY PRICE

           Existing frontend/backend functions
           may still use "price".

           price always follows retailPrice.
        ======================================== */

        price: {
            type: Number,
            min: [
                0,
                "Price cannot be negative"
            ],
            default: 0
        },


        /* ========================================
           RETAIL PRICE
        ======================================== */

        retailPrice: {
            type: Number,
            min: [
                0,
                "Retail price cannot be negative"
            ]
        },


        /* ========================================
           WHOLESALE PRICE
        ======================================== */

        wholesalePrice: {
            type: Number,
            min: [
                0,
                "Wholesale price cannot be negative"
            ]
        },


        /* ========================================
           WHOLESALE MINIMUM QUANTITY
        ======================================== */

        wholesaleMinimumQuantity: {
            type: Number,
            default: 20,
            min: [
                1,
                "Wholesale minimum quantity must be at least 1"
            ]
        },


        /* ========================================
           STOCK
        ======================================== */

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


        /* ========================================
           LOW STOCK ALERT THRESHOLD

           Example:

           stock = 50
           lowStockThreshold = 100

           Result:
           Low Stock Warning

           Default = 10
        ======================================== */

        lowStockThreshold: {
            type: Number,
            default: 10,
            min: [
                1,
                "Low stock threshold must be at least 1"
            ]
        },


        /* ========================================
           PRODUCT IMAGE
        ======================================== */

        image: {
            type: String,
            trim: true,
            default: ""
        },


        /* ========================================
           DESCRIPTION
        ======================================== */

        description: {
            type: String,
            required: [
                true,
                "Product description is required"
            ],
            trim: true
        },


        /* ========================================
           AVAILABILITY
        ======================================== */

        isAvailable: {
            type: Boolean,
            default: true
        },


        /* ========================================
           STATUS
        ======================================== */

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


/* ========================================
   VALIDATION / DATA COMPATIBILITY
======================================== */

productSchema.pre(
    "validate",
    function () {

        /* ========================================
           LEGACY PRICE
        ======================================== */

        const legacyPrice =
            Number(
                this.price || 0
            );


        /* ========================================
           RETAIL PRICE
        ======================================== */

        const retailPrice =
            this.retailPrice !== undefined &&
            this.retailPrice !== null

                ? Number(
                    this.retailPrice
                )

                : legacyPrice;


        /* ========================================
           WHOLESALE PRICE
        ======================================== */

        const wholesalePrice =
            this.wholesalePrice !== undefined &&
            this.wholesalePrice !== null

                ? Number(
                    this.wholesalePrice
                )

                : retailPrice;


        /* ========================================
           WHOLESALE MINIMUM QUANTITY
        ======================================== */

        const minimumQuantity =
            Number(
                this.wholesaleMinimumQuantity ??
                20
            );


        /* ========================================
           LOW STOCK THRESHOLD
        ======================================== */

        const lowStockThreshold =
            Number(
                this.lowStockThreshold ??
                10
            );


        /* ========================================
           SET RETAIL PRICE
        ======================================== */

        this.retailPrice =
            Number.isFinite(
                retailPrice
            ) &&
            retailPrice >= 0

                ? retailPrice

                : 0;


        /* ========================================
           SET WHOLESALE PRICE
        ======================================== */

        this.wholesalePrice =
            Number.isFinite(
                wholesalePrice
            ) &&
            wholesalePrice >= 0

                ? wholesalePrice

                : this.retailPrice;


        /* ========================================
           SET WHOLESALE MINIMUM QUANTITY
        ======================================== */

        this.wholesaleMinimumQuantity =
            Number.isInteger(
                minimumQuantity
            ) &&
            minimumQuantity >= 1

                ? minimumQuantity

                : 20;


        /* ========================================
           SET LOW STOCK THRESHOLD
        ======================================== */

        this.lowStockThreshold =
            Number.isInteger(
                lowStockThreshold
            ) &&
            lowStockThreshold >= 1

                ? lowStockThreshold

                : 10;


        /* ========================================
           LEGACY PRICE COMPATIBILITY

           price always follows retailPrice
        ======================================== */

        this.price =
            this.retailPrice;


        /* ========================================
           WHOLESALE VALIDATION
        ======================================== */

        if (
            this.wholesalePrice >
            this.retailPrice
        ) {

            this.invalidate(
                "wholesalePrice",
                "Wholesale price cannot be greater than retail price"
            );
        }


        /* ========================================
           CLEAN NET CONTENT
        ======================================== */

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


/* ========================================
   STATUS AND AVAILABILITY
======================================== */

productSchema.pre(
    "save",
    function () {

        this.isAvailable =
            this.status ===
            "active";
    }
);


module.exports =
    mongoose.model(
        "Product",
        productSchema
    );