const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const shopPageController = require("../controllers/user/shopPageController")
const productController = require("../controllers/user/productController");
const profileController = require("../controllers/user/profileController")
const { userIsAuthenticated  } = require("../middlewares/auth");

// Path to join home page & shopping page
router.get("/",userIsAuthenticated, userController.loadHomepage);
router.get("/shop",shopPageController.loadShoppingPage);
router.get("/filter",shopPageController.filterProduct);
router.get("/filterByPrice",shopPageController.filterByPrice );
router.post("/search",shopPageController.searchProducts);


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
router.get("/login",userController.loadLogin);
router.post("/login",userController.login); 

// Logout
router.get("/logout", userController.logout);

// Product management
router.get("/productDetails", productController.productDetails);

//profile management
router.get("/userProfile",userIsAuthenticated,profileController.userProfile);
router.get("/change-email", userIsAuthenticated,profileController.changeEmail);
router.post("/change-email",userIsAuthenticated,profileController.changeEmailValid);
router.post("/verify-email-otp",userIsAuthenticated,profileController.verifyEmailOtp);
router.post("/update-email",userIsAuthenticated,profileController.updateEmail);
router.get("/change-password",userIsAuthenticated,profileController.changePassword);
router.post("/change-password",userIsAuthenticated,profileController.changePasswordValid);
router.post("/verify-changePassword-otp",userIsAuthenticated,profileController.verifyChangePasswordOtp);
router.post("/reset-password",profileController.posNewPassword);


module.exports = router;