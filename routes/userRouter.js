const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const productController = require("../controllers/user/productController");
const { userAuth, adminAuth,userIsAuthenticated,  } = require("../middlewares/auth");

// Path to join home page & shopping page
router.get("/",userIsAuthenticated, userController.loadHomepage);
router.get("/shop",userIsAuthenticated,userController.loadShoppingPage);
router.get("/filter",userIsAuthenticated,userController.filterProduct);
router.get("/filterByPrice",userIsAuthenticated,userController.filterByPrice );
// router.post("/search",userIsAuthenticated,userController.searchProducts);


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
router.get("/productDetails",userIsAuthenticated, productController.productDetails);

module.exports = router;