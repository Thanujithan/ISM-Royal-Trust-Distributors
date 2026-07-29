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
            trim: true
        },

        brand: {
            type: String,
            trim: true,
            default: "ISM Royal Trust"
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
            trim: true,
            default: ""
        },

        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true
        },

        isAvailable: {
            type: Boolean,
            default: true
        },

        status: {
            type: String,
            enum: ["active", "inactive"],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);

// Status மற்றும் availability இரண்டும் ஒரே மாதிரி update ஆகும்
productSchema.pre("save", function (next) {
    this.isAvailable = this.status === "active";
    next();
});

module.exports = mongoose.model("Product", productSchema);