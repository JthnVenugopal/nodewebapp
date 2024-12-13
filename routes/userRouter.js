const express = require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const shopController = require("../controllers/user/shopController")
const productController = require("../controllers/user/productController");
const profileController = require("../controllers/user/profileController")
const cartController=require("../controllers/user/cartController");
const checkoutController = require("../controllers/user/checkoutController");
const orderController = require("../controllers/user/orderController");
const { userIsAuthenticated  } = require("../middlewares/auth");

// Path to join home page
router.get("/",userIsAuthenticated, userController.loadHomepage);

//shop management
router.get("/shop",userIsAuthenticated,shopController.loadShoppingPage);
router.post('/filter',userIsAuthenticated,shopController.filterProduct);
// router.get('/filterPrice',userIsAuthenticated,shopController.filterByPrice)
// router.get('/filterPrice',userIsAuthenticated,shopController.searchProducts)
// router.get('/sortByPrice',userIsAuthenticated ,shopController.sortPrice);
// router.get('/sortByAlpha',userIsAuthenticated,shopController.sortByAlpha)
// router.get('/clearFilters',userIsAuthenticated,shopController.clearFilters)





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

// Login-Logout
router.get("/login",userController.loadLogin);
router.post("/login",userController.login); 
router.get("/logout", userController.logout);

// Product management
router.get("/productDetails", productController.productDetails);
// Route to post selected size
router.post("/selectSize", productController.selectSize);


//profile management
router.get("/userProfile",userIsAuthenticated,profileController.userProfile);
router.get("/editProfile",userIsAuthenticated,profileController.getEditProfile);
router.post("/updateProfile",userIsAuthenticated,profileController.UpdateProfile);
router.get("/changePassword",userIsAuthenticated,profileController.changePassword);
router.post('/updatePassword', userIsAuthenticated, profileController.updatePassword);
router.post("/resend-forgot-otp",profileController.resendOtp);
router.post("/changePassword",userIsAuthenticated,profileController.changePasswordValid);
router.post("/verify-changepassword-otp",userIsAuthenticated,profileController.verifyChangePassOtp);
router.get("/reset-password",profileController.getResetPassPage);
router.post("/reset-password",profileController.postNewPassword);
router.get("/forgot-password",profileController.getForgotPassPage);
router.post("/forgot-email-valid",profileController.forgotEmailValid);
router.post("/verify-passForgot-otp",profileController.verifyForgotPassOtp);

//address management
router.get("/add-address",userIsAuthenticated,profileController.addAddress);
router.get("/show-address",userIsAuthenticated,profileController.showAddress)
router.post("/addAddress",userIsAuthenticated,profileController.postAddAddress1);
router.get("/editAddress",userIsAuthenticated,profileController.editAddress);
router.post("/editAddress",userIsAuthenticated,profileController.postEditAddress);
router.get("/deleteAddress",userIsAuthenticated,profileController.deleteAddress);

//cart management
router.get("/cart",userIsAuthenticated,cartController.getCart);
router.post("/add-to-cart", userIsAuthenticated, cartController.addToCart);
router.post('/cart/remove/:cartItemId', cartController.removeFromCart);



//checkout management
router.get("/checkout",userIsAuthenticated,checkoutController.getCheckout);
router.post("/placeOrder",checkoutController.placeOrder);
router.post("/addAddress2",userIsAuthenticated,checkoutController.postAddAddress);

//order management
router.get("/orderDetails",orderController.getOrderDetails);
router.post("/cancelOrder",orderController.cancelOrder);


module.exports = router;