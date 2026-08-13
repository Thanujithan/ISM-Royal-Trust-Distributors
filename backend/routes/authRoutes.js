const express =
    require("express");

const router =
    express.Router();


const {
    protect
} =
    require(
        "../middleware/auth"
    );


const {
    registerUser,
    loginUser,
    getProfile,
    updateProfile,
    changePassword
} =
    require(
        "../controllers/authController"
    );


/* ================================
   AUTH ROUTES
================================ */

router.post(
    "/register",
    registerUser
);


router.post(
    "/login",
    loginUser
);


router.get(
    "/profile",
    protect,
    getProfile
);


router.put(
    "/profile",
    protect,
    updateProfile
);


router.put(
    "/change-password",
    protect,
    changePassword
);


module.exports =
    router;