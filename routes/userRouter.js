const express =  require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport");
const productController = require("../controllers/user/productController");
const {userAuth,adminAuth} = require("../middlewares/auth");


//path to join home page 
router.get("/", userController.loadHomepage);
router.get("/pageNotFound",userController.pageNotFound);

router.get("/signup", userController.loadSignup);
router.post("/signup",userController.signup);

router.post("/verify-otp",userController.verifyOtp);
router.post("/resend-otp",userController.resendOtp);

//google authentication routes
router.get("/auth/google",passport.authenticate("google",{scope:["profile","email"]}));
router.get("/google/callback",passport.authenticate("google",{failureRedirect:"/signup"}),(req,res)=>{res.redirect("/")});

//login
router.get("/login",userController.loadLogin);
router.post("/login",userController.login);

//logout
router.get("/logout",userController.logout);

//product management

router.get("/productDetails",userAuth,productController.productDetails)

module.exports = router;