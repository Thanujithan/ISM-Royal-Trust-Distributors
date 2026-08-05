const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const contactRoutes = require("./routes/contactRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

connectDB();

const app = express();

app.use(
    cors({
        origin: "*",
        methods: [
            "GET",
            "POST",
            "PUT",
            "DELETE"
        ],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

/* API routes */

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
    res.send(
        "ISM Royal Trust Distributors Backend is Running..."
    );
});

/* Multer and general errors */

app.use((error, req, res, next) => {
    console.error("Server error:", error);

    if (
        error.code === "LIMIT_FILE_SIZE"
    ) {
        return res.status(400).json({
            success: false,
            message:
                "Image size must be 5MB or less."
        });
    }

    return res.status(500).json({
        success: false,
        message:
            error.message ||
            "Unexpected server error."
    });
});

/* Unknown routes */

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found."
    });
});

const PORT =
    process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(
        `Server is running on port ${PORT}`
    );
});