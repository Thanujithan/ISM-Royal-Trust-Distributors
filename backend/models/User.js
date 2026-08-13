const mongoose = require("mongoose");


const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [
                true,
                "Name is required"
            ],
            trim: true
        },

        email: {
            type: String,
            required: [
                true,
                "Email is required"
            ],
            unique: true,
            lowercase: true,
            trim: true
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        address: {
            streetAddress: {
                type: String,
                trim: true,
                default: ""
            },

            city: {
                type: String,
                trim: true,
                default: ""
            },

            district: {
                type: String,
                trim: true,
                default: ""
            },

            postalCode: {
                type: String,
                trim: true,
                default: ""
            }
        },

        password: {
            type: String,
            required: [
                true,
                "Password is required"
            ],
            minlength: 6
        },

        role: {
            type: String,
            enum: [
                "customer",
                "admin"
            ],
            default: "customer"
        }
    },
    {
        timestamps: true
    }
);


module.exports =
    mongoose.model(
        "User",
        userSchema
    );