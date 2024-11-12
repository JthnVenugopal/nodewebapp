const express =  require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");
const passport = require("passport")


//path to join home page 
router.get("/", userController.loadHomepage);

router.get("/pageNotFound",userController.pageNotFound);

router.get("/signup", userController.loadSignup);

router.post("/signup",userController.signup);

router.post("/verify-otp",userController.verifyOtp);

router.post("/resend-otp",userController.resendOtp);


//google authentication routes
scope: ["openid", "profile", "email"]

router.get("/auth/google",passport.authenticate("google",{scope:["openid","profile","email"]}));

router.get('/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),(req,res)=>{
   res.render('home');
})

module.exports = router;