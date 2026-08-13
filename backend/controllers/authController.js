const User = require("../models/User");

const bcrypt =
    require("bcryptjs");

const jwt =
    require("jsonwebtoken");


/* ================================
   REGISTER USER
================================ */

const registerUser =
    async (req, res) => {

        try {

            const name =
                String(
                    req.body.name ||
                    ""
                ).trim();


            const email =
                String(
                    req.body.email ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const password =
                String(
                    req.body.password ||
                    ""
                );


            if (
                !name ||
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "All fields are required"
                    });
            }


            if (
                password.length < 6
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Password must contain at least 6 characters"
                    });
            }


            const userExists =
                await User.findOne({
                    email
                });


            if (
                userExists
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Email already exists"
                    });
            }


            const hashedPassword =
                await bcrypt.hash(
                    password,
                    10
                );


            const user =
                await User.create({
                    name,
                    email,
                    password:
                        hashedPassword
                });


            return res
                .status(201)
                .json({
                    success: true,
                    message:
                        "User registered successfully",

                    user: {
                        id:
                            user._id,

                        name:
                            user.name,

                        email:
                            user.email,

                        phone:
                            user.phone,

                        address:
                            user.address,

                        role:
                            user.role
                    }
                });


        } catch (error) {

            console.error(
                "Register error:",
                error
            );


            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Unable to register user",
                    error:
                        error.message
                });
        }
    };


/* ================================
   LOGIN USER
================================ */

const loginUser =
    async (req, res) => {

        try {

            const email =
                String(
                    req.body.email ||
                    ""
                )
                    .trim()
                    .toLowerCase();


            const password =
                String(
                    req.body.password ||
                    ""
                );


            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Email and password are required"
                    });
            }


            const user =
                await User.findOne({
                    email
                });


            if (!user) {

                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Invalid email or password"
                    });
            }


            const passwordMatch =
                await bcrypt.compare(
                    password,
                    user.password
                );


            if (
                !passwordMatch
            ) {

                return res
                    .status(401)
                    .json({
                        success: false,
                        message:
                            "Invalid email or password"
                    });
            }


            if (
                !process.env.JWT_SECRET
            ) {

                return res
                    .status(500)
                    .json({
                        success: false,
                        message:
                            "JWT secret is not configured"
                    });
            }


            const token =
                jwt.sign(
                    {
                        id:
                            user._id,

                        role:
                            user.role
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn:
                            "7d"
                    }
                );


            return res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Login successful",

                    token,

                    user: {
                        id:
                            user._id,

                        name:
                            user.name,

                        email:
                            user.email,

                        phone:
                            user.phone,

                        address:
                            user.address,

                        role:
                            user.role
                    }
                });


        } catch (error) {

            console.error(
                "Login error:",
                error
            );


            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Unable to login",
                    error:
                        error.message
                });
        }
    };


/* ================================
   GET PROFILE
================================ */

const getProfile =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user.id
                )
                    .select(
                        "-password"
                    );


            if (!user) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "User not found"
                    });
            }


            return res
                .status(200)
                .json({
                    success: true,
                    user
                });


        } catch (error) {

            console.error(
                "Get profile error:",
                error
            );


            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Unable to load profile",
                    error:
                        error.message
                });
        }
    };


/* ================================
   UPDATE PROFILE
================================ */

const updateProfile =
    async (req, res) => {

        try {

            const user =
                await User.findById(
                    req.user.id
                );


            if (!user) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "User not found"
                    });
            }


            const name =
                String(
                    req.body.name ??
                    user.name ??
                    ""
                ).trim();


            const email =
                String(
                    req.body.email ??
                    user.email ??
                    ""
                )
                    .trim()
                    .toLowerCase();


            const phone =
                String(
                    req.body.phone ??
                    user.phone ??
                    ""
                ).trim();


            if (
                !name ||
                !email
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Name and email are required"
                    });
            }


            const emailExists =
                await User.findOne({
                    email,
                    _id: {
                        $ne:
                            user._id
                    }
                });


            if (
                emailExists
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Email already exists"
                    });
            }


            user.name =
                name;

            user.email =
                email;

            user.phone =
                phone;


            user.address = {

                streetAddress:
                    String(
                        req.body
                            .streetAddress ??
                        user.address
                            ?.streetAddress ??
                        ""
                    ).trim(),

                city:
                    String(
                        req.body.city ??
                        user.address
                            ?.city ??
                        ""
                    ).trim(),

                district:
                    String(
                        req.body.district ??
                        user.address
                            ?.district ??
                        ""
                    ).trim(),

                postalCode:
                    String(
                        req.body.postalCode ??
                        user.address
                            ?.postalCode ??
                        ""
                    ).trim()
            };


            await user.save();


            const safeUser =
                await User.findById(
                    user._id
                )
                    .select(
                        "-password"
                    );


            return res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Profile updated successfully",
                    user:
                        safeUser
                });


        } catch (error) {

            console.error(
                "Update profile error:",
                error
            );


            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Unable to update profile",
                    error:
                        error.message
                });
        }
    };


/* ================================
   CHANGE PASSWORD
================================ */

const changePassword =
    async (req, res) => {

        try {

            const currentPassword =
                String(
                    req.body
                        .currentPassword ||
                    ""
                );


            const newPassword =
                String(
                    req.body
                        .newPassword ||
                    ""
                );


            const confirmPassword =
                String(
                    req.body
                        .confirmPassword ||
                    ""
                );


            if (
                !currentPassword ||
                !newPassword ||
                !confirmPassword
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "All password fields are required"
                    });
            }


            if (
                newPassword.length < 6
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "New password must contain at least 6 characters"
                    });
            }


            if (
                newPassword !==
                confirmPassword
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "New password and confirm password do not match"
                    });
            }


            const user =
                await User.findById(
                    req.user.id
                );


            if (!user) {

                return res
                    .status(404)
                    .json({
                        success: false,
                        message:
                            "User not found"
                    });
            }


            const currentPasswordMatch =
                await bcrypt.compare(
                    currentPassword,
                    user.password
                );


            if (
                !currentPasswordMatch
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Current password is incorrect"
                    });
            }


            const samePassword =
                await bcrypt.compare(
                    newPassword,
                    user.password
                );


            if (
                samePassword
            ) {

                return res
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "New password must be different from current password"
                    });
            }


            user.password =
                await bcrypt.hash(
                    newPassword,
                    10
                );


            await user.save();


            return res
                .status(200)
                .json({
                    success: true,
                    message:
                        "Password changed successfully"
                });


        } catch (error) {

            console.error(
                "Change password error:",
                error
            );


            return res
                .status(500)
                .json({
                    success: false,
                    message:
                        "Unable to change password",
                    error:
                        error.message
                });
        }
    };


module.exports = {

    registerUser,

    loginUser,

    getProfile,

    updateProfile,

    changePassword
};