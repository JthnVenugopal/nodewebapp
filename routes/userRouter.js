const express = require("express");
const router = express.Router();
const passport = require("passport");
const userController = require("../controllers/user/userController");
const profileController = require("../controllers/user/profileController");
const productController = require("../controllers/user/productController");
const { userAuth, adminAuth } = require("../middlewares/auth");

//Error management
router.get("/pageNotFound",userController.pageNotFound);

//signup
router.get("/signup", userController.loadSignup);
router.post("/signup", userController.signup);
router.post("/verify-otp", userController.verifyOtp);
router.post("/resend-otp", userController.resendOtp);
// Google authentication routes
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/signup" }), (req, res) => {
    res.redirect("/");
});

// Login/logout
router.get("/login",userController.loadLogin);
router.post("/login",userController.login); 
router.get("/logout", userController.logout);

// Path to join home page & shopping page
router.get("/",userAuth, userController.loadHomepage);
router.get("/shop",userController.loadShoppingPage);
router.get("/filter",userController.filterProduct);
router.get("/filterByPrice",userController.filterByPrice );
// router.post("/search",userController.searchProducts);

// Product management
router.get("/productDetails", productController.productDetails);

//profile management
router.get("/userProfile",userAuth,profileController.userProfile);


module.exports = router;