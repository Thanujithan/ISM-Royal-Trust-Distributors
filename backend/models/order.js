const mongoose = require("mongoose");

/*
========================================
Order Item Schema
========================================
*/

const orderItemSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product ID is required"]
        },

        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true
        },

        image: {
            type: String,
            trim: true,
            default: ""
        },

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"]
        },

        quantity: {
            type: Number,
            required: [true, "Product quantity is required"],
            min: [1, "Quantity must be at least 1"]
        }
    },
    {
        _id: false
    }
);

/*
========================================
Delivery Address Schema
========================================
*/

const deliveryAddressSchema = new mongoose.Schema(
    {
        streetAddress: {
            type: String,
            required: [true, "Street address is required"],
            trim: true
        },

        city: {
            type: String,
            required: [true, "City is required"],
            trim: true
        },

        district: {
            type: String,
            required: [true, "District is required"],
            trim: true
        },

        postalCode: {
            type: String,
            required: [true, "Postal code is required"],
            trim: true
        }
    },
    {
        _id: false
    }
);

/*
========================================
Customer Schema
========================================
*/

const customerSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true
        },

        email: {
            type: String,
            required: [true, "Customer email is required"],
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            required: [true, "Customer phone number is required"],
            trim: true
        }
    },
    {
        _id: false
    }
);

/*
========================================
Order Schema
========================================
*/

const orderSchema = new mongoose.Schema(
    {
        orderNumber: {
            type: String,
            unique: true,
            index: true,
            trim: true
        },

        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"]
        },

        customer: {
            type: customerSchema,
            required: true
        },

        deliveryAddress: {
            type: deliveryAddressSchema,
            required: true
        },

        deliveryNote: {
            type: String,
            trim: true,
            default: ""
        },

        items: {
            type: [orderItemSchema],
            required: true,
            validate: {
                validator(items) {
                    return Array.isArray(items) && items.length > 0;
                },
                message: "Order must contain at least one product"
            }
        },

        subtotal: {
            type: Number,
            required: [true, "Subtotal is required"],
            min: [0, "Subtotal cannot be negative"]
        },

        deliveryFee: {
            type: Number,
            default: 0,
            min: [0, "Delivery fee cannot be negative"]
        },

        totalAmount: {
            type: Number,
            required: [true, "Total amount is required"],
            min: [0, "Total amount cannot be negative"]
        },

        paymentMethod: {
            type: String,
            enum: [
                "cash_on_delivery",
                "bank_transfer"
            ],
            default: "cash_on_delivery"
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
Generate Order Number
========================================
*/

orderSchema.pre("save", async function () {
    if (!this.isNew || this.orderNumber) {
        return;
    }

    const randomNumber = Math.floor(
        1000 + Math.random() * 9000
    );

    const datePart = new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "");

    this.orderNumber =
        `ISM-${datePart}-${randomNumber}`;
});

/*
========================================
Add Initial Status History
========================================
*/

orderSchema.pre("save", async function () {
    if (
        this.isNew &&
        (!this.statusHistory ||
            this.statusHistory.length === 0)
    ) {
        this.statusHistory.push({
            status: this.orderStatus
        });
    }
});

module.exports = mongoose.model(
    "Order",
    orderSchema
);