const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config();

async function createAdmin() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const email = "admin@ismroyaltrust.com";

        const exists = await User.findOne({ email });

        if (exists) {
            console.log("Admin already exists.");
            process.exit();
        }

        const hashedPassword = await bcrypt.hash("Ism@2026", 10);

        await User.create({
            name: "ISM Administrator",
            email: email,
            password: hashedPassword,
            role: "admin"
        });

        console.log("Admin created successfully.");
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

createAdmin();