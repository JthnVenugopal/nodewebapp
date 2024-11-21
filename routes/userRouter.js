const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const productController = require("../controllers/user/productController");
const { userAuth, adminAuth, userCheck, userIsAuthenticated } = require("../middlewares/auth");

// Path to join home page 
router.get("/", userController.loadHomepage);
router.get("/pageNotFound",userController.pageNotFound);

router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);

router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);

// Google authentication routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }), (req, res) => {
    res.redirect("/");
});

// Login
router.get("/login",userIsAuthenticated,userController.loadLogin);
router.post("/login",userIsAuthenticated,userController.login); 

// Logout
router.get("/logout", userController.logout);

// Product management
router.get("/productDetails",userCheck , productController.productDetails);

module.exports = router;