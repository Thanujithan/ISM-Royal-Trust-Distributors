const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDirectory = path.join(
    __dirname,
    "../uploads/products"
);

if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
        recursive: true
    });
}

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, uploadDirectory);
    },

    filename: (req, file, callback) => {
        const extension = path
            .extname(file.originalname)
            .toLowerCase();

        const safeName = path
            .basename(file.originalname, extension)
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .toLowerCase();

        const uniqueName =
            `${safeName}-${Date.now()}${extension}`;

        callback(null, uniqueName);
    }
});

const fileFilter = (req, file, callback) => {
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp"
    ];

    if (!allowedTypes.includes(file.mimetype)) {
        return callback(
            new Error(
                "Only JPG, PNG and WEBP images are allowed."
            ),
            false
        );
    }

    callback(null, true);
};

const uploadProductImage = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = uploadProductImage;