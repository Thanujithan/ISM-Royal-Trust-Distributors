const mongoose = require("mongoose");

/*
========================================
ORDER ITEM SCHEMA
========================================
*/

const orderItemSchema =
    new mongoose.Schema(
        {
            product: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "Product",

                required: [
                    true,
                    "Product ID is required"
                ]
            },

            name: {
                type: String,

                required: [
                    true,
                    "Product name is required"
                ],

                trim: true
            },

            image: {
                type: String,
                trim: true,
                default: ""
            },

            /*
            ========================================
            LEGACY PRICE

            Existing My Orders, invoice and admin
            functions price field use செய்யலாம்.

            New order create செய்யும்போது:
            price = appliedPrice
            ========================================
            */

            price: {
                type: Number,

                required: [
                    true,
                    "Applied product price is required"
                ],

                min: [
                    0,
                    "Price cannot be negative"
                ]
            },

            /*
            ========================================
            RETAIL / WHOLESALE PRICE SNAPSHOT
            ========================================
            */

            retailPrice: {
                type: Number,

                min: [
                    0,
                    "Retail price cannot be negative"
                ],

                default: 0
            },

            wholesalePrice: {
                type: Number,

                min: [
                    0,
                    "Wholesale price cannot be negative"
                ],

                default: 0
            },

            wholesaleMinimumQuantity: {
                type: Number,

                min: [
                    1,
                    "Wholesale minimum quantity must be at least 1"
                ],

                default: 20
            },

            appliedPrice: {
                type: Number,

                min: [
                    0,
                    "Applied price cannot be negative"
                ],

                default: 0
            },

            priceType: {
                type: String,

                enum: [
                    "retail",
                    "wholesale"
                ],

                default: "retail"
            },

            quantity: {
                type: Number,

                required: [
                    true,
                    "Product quantity is required"
                ],

                min: [
                    1,
                    "Quantity must be at least 1"
                ]
            }
        },
        {
            _id: false
        }
    );

/*
========================================
ORDER ITEM PRICE COMPATIBILITY
========================================
*/

orderItemSchema.pre(
    "validate",
    function () {
        const legacyPrice =
            Number(this.price || 0);

        const retailPrice =
            Number(
                this.retailPrice ||
                legacyPrice
            );

        const wholesalePrice =
            Number(
                this.wholesalePrice ||
                retailPrice
            );

        const minimumQuantity =
            Number(
                this.wholesaleMinimumQuantity ||
                20
            );

        const quantity =
            Number(this.quantity || 1);

        const isWholesale =
            quantity >= minimumQuantity;

        const calculatedAppliedPrice =
            isWholesale
                ? wholesalePrice
                : retailPrice;

        this.retailPrice =
            Number.isNaN(retailPrice)
                ? legacyPrice
                : retailPrice;

        this.wholesalePrice =
            Number.isNaN(wholesalePrice)
                ? this.retailPrice
                : wholesalePrice;

        this.wholesaleMinimumQuantity =
            Number.isInteger(minimumQuantity) &&
            minimumQuantity >= 1
                ? minimumQuantity
                : 20;

        /*
        New controller appliedPrice அனுப்பினால் அதை use செய்யும்.
        Old controller price மட்டும் அனுப்பினால் price use செய்யும்.
        */

        const suppliedAppliedPrice =
            Number(this.appliedPrice || 0);

        this.appliedPrice =
            suppliedAppliedPrice > 0
                ? suppliedAppliedPrice
                : calculatedAppliedPrice;

        this.priceType =
            this.priceType === "wholesale" ||
            isWholesale
                ? "wholesale"
                : "retail";

        /*
        Existing invoice/cart/order UI compatibility.
        */

        this.price =
            this.appliedPrice;
    }
);

/*
========================================
DELIVERY ADDRESS SCHEMA
========================================
*/

const deliveryAddressSchema =
    new mongoose.Schema(
        {
            streetAddress: {
                type: String,

                required: [
                    true,
                    "Street address is required"
                ],

                trim: true
            },

            city: {
                type: String,

                required: [
                    true,
                    "City is required"
                ],

                trim: true
            },

            district: {
                type: String,

                required: [
                    true,
                    "District is required"
                ],

                trim: true
            },

            postalCode: {
                type: String,

                required: [
                    true,
                    "Postal code is required"
                ],

                trim: true
            }
        },
        {
            _id: false
        }
    );

/*
========================================
CUSTOMER SCHEMA
========================================
*/

const customerSchema =
    new mongoose.Schema(
        {
            name: {
                type: String,

                required: [
                    true,
                    "Customer name is required"
                ],

                trim: true
            },

            email: {
                type: String,

                required: [
                    true,
                    "Customer email is required"
                ],

                lowercase: true,
                trim: true
            },

            phone: {
                type: String,

                required: [
                    true,
                    "Customer phone number is required"
                ],

                trim: true
            }
        },
        {
            _id: false
        }
    );

/*
========================================
ORDER SCHEMA
========================================
*/

const orderSchema =
    new mongoose.Schema(
        {
            orderNumber: {
                type: String,
                unique: true,
                index: true,
                trim: true
            },

            user: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref: "User",

                required: [
                    true,
                    "User is required"
                ]
            },

            customer: {
                type: customerSchema,
                required: true
            },

            deliveryAddress: {
                type:
                    deliveryAddressSchema,

                required: true
            },

            deliveryNote: {
                type: String,
                trim: true,
                default: ""
            },

            items: {
                type: [
                    orderItemSchema
                ],

                required: true,

                validate: {
                    validator(items) {
                        return (
                            Array.isArray(items) &&
                            items.length > 0
                        );
                    },

                    message:
                        "Order must contain at least one product"
                }
            },

            subtotal: {
                type: Number,

                required: [
                    true,
                    "Subtotal is required"
                ],

                min: [
                    0,
                    "Subtotal cannot be negative"
                ]
            },

            deliveryFee: {
                type: Number,
                default: 0,

                min: [
                    0,
                    "Delivery fee cannot be negative"
                ]
            },

            totalAmount: {
                type: Number,

                required: [
                    true,
                    "Total amount is required"
                ],

                min: [
                    0,
                    "Total amount cannot be negative"
                ]
            },

            paymentMethod: {
                type: String,

                enum: [
                    "cash_on_delivery",
                    "bank_transfer"
                ],

                default:
                    "cash_on_delivery"
            },

            paymentStatus: {
                type: String,

                enum: [
                    "pending",
                    "paid",
                    "failed"
                ],

                default: "pending"
            },

            orderStatus: {
                type: String,

                enum: [
                    "pending",
                    "confirmed",
                    "processing",
                    "shipped",
                    "delivered",
                    "cancelled"
                ],

                default: "pending"
            },

            statusHistory: [
                {
                    status: {
                        type: String,

                        enum: [
                            "pending",
                            "confirmed",
                            "processing",
                            "shipped",
                            "delivered",
                            "cancelled"
                        ],

                        required: true
                    },

                    changedAt: {
                        type: Date,
                        default: Date.now
                    }
                }
            ]
        },
        {
            timestamps: true
        }
    );

/*
========================================
GENERATE ORDER NUMBER
========================================
*/

orderSchema.pre(
    "save",
    async function () {
        if (
            !this.isNew ||
            this.orderNumber
        ) {
            return;
        }

        const randomNumber =
            Math.floor(
                1000 +
                Math.random() * 9000
            );

        const datePart =
            new Date()
                .toISOString()
                .slice(0, 10)
                .replaceAll("-", "");

        this.orderNumber =
            `ISM-${datePart}-${randomNumber}`;
    }
);

/*
========================================
ADD INITIAL STATUS HISTORY
========================================
*/

orderSchema.pre(
    "save",
    async function () {
        if (
            this.isNew &&
            (
                !this.statusHistory ||
                this.statusHistory.length === 0
            )
        ) {
            this.statusHistory.push({
                status:
                    this.orderStatus
            });
        }
    }
);

module.exports =
    mongoose.model(
        "Order",
        orderSchema
    );