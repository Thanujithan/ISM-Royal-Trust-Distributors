const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true
        },

        category: {
            type: String,
            required: [true, "Product category is required"],
            enum: [
                "Food",
                "Beverages",
                "Household",
                "Electrical",
                "Hardware"
            ]
        },

        brand: {
            type: String,
            required: [true, "Brand name is required"],
            trim: true
        },

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"]
        },

        stock: {
            type: Number,
            required: [true, "Stock quantity is required"],
            default: 0,
            min: [0, "Stock cannot be negative"]
        },

        image: {
            type: String,
            required: [true, "Product image is required"],
            trim: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        isAvailable: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Product", productSchema);