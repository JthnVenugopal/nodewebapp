const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const Brand =  require("../../models/brandSchema");
const Variant = require("../../models/variantSchema")
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Wallet = require("../../models/walletSchema");

////////////////////////////////////////////////////////////

const pageNotFound = async (req,res) => {
  try{
    res.render("page-404")
  }catch(error){
    res.redirect("/pageNotFound")
  }
}

///////////////////////////////////////////////////////////

const loadHomepage = async (req, res, next) => {
  try {
    let userData = req.session.user || req.user;

    const currentPage = parseInt(req.query.page) || 1;
    const productsPerPage = 8;

    const categories = await Category.find({ isListed: true });

    // Fetch all products that are not blocked
    let products = await Product.find({ isBlocked: false });

    // Pagination
    const totalProducts = products.length;
    const totalPages = Math.ceil(totalProducts / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    products = products.slice(startIndex, startIndex + productsPerPage);

    // Fetch variant data for each product
    const productsWithVariants = await Promise.all(products.map(async (product) => {
      const variantData = await Variant.findById(product.variant);

      return {
        ...product.toObject(), // Convert Mongoose document to plain object
        variantData: variantData || null // Include variant data or null if not found
      };
    }));

    res.locals.user = userData;

    console.log("home page rendering...");

    // Set headers to prevent caching of the login page
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    // Render homepage with user, product data
    return res.render("home", {
      user: userData,
      products: productsWithVariants,
      currentPage,
      totalPages,
      sortBy: req.query.sortBy || 'name',
      categories: categories,
    });
  } catch (error) {
    console.log("Error loading homepage:", error);
    next(error);
  }
};


//////////////////////////////////////////////////////////

const loadSignup = async (req,res) => {
  try{
    return res.render("signup");
  }catch(error){
    console.log("Signup page not loading", error);
    res.status(500).send('Server Error');

  }
}

//------------------------------------------------------

const loadShopping = async (req,res) => {
  try  {
    return res.render('shop');
  }catch (error) {
    console.log("Shopping page is not loading", error);
    res.status(500).send("Server error")
  }
}
//------------------------------------------------------------

function generateOtp(){
  return Math.floor(100000 + Math.random()*900000).toString();
}

console.log("random number"+generateOtp())

async function sendVerificationEmail(email,otp){
  try{
     
       const transporter = nodemailer.createTransport({
          service:"gmail",
          port:587,
          secure: false,
          requireTLS:true,
          auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD
          }

       });

       const info = await transporter.sendMail({
        from:process.env.NODEMAILER_EMAIL,
        to:email,
        subject:"Verify Your Account",
        text:`Your verification code is ${otp}`,
        html:`<b>Your OTP : ${otp}</b>`,

       });

       return info.accepted.length > 0

  }catch(error){
        console.error("Error sending email",error);
        return false;
  }
}
//---------------------------------------------------------------

const signup = async (req,res) => {
  try{
     const {name, email,phone, password, confirmPassword} = req.body;

  
     if(password !== confirmPassword ){
       return res.render("signup",{message:"Password do not match"});
     }

     const findUser = await User.findOne({email});
     if(findUser){
      return res.render("signup",{message:"User with this email already exist "});
     }

     const otp = generateOtp();

     console.log(otp)

     const emailSent = await sendVerificationEmail(email,otp);
     if(!emailSent){
      return res.json("email.error")
     }

      // Save OTP and user data in session
     req.session.userOtp = otp;

     req.session.userData = {name,phone,email,password,confirmPassword};

     res.render("verify-otp");
     console.log("OTP Sent",otp);

  } catch (error) {

    console.error("Error signing up", error);
    res.redirect("pageNotFound");

  }

}

//------------------------------------------------
//verifying otp and change password into a hashed format

const securePassword = async (password)=>{
  try{

      const passwordHash = await bcrypt.hash(password,10);

      return passwordHash;

  }catch(error){

      console.error(error)

  }
}
//-----------------------------------------------------

const verifyOtp =  async(req,res)=>{
    
  try{
    const {otp} = req.body;// deconstructed otp 
    console.log("OTP entered by user "+ otp);

    if(otp==req.session.userOtp){
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name:user.name,
        email:user.email,
        phone:user.phone,
        password:passwordHash,
      })

      await saveUserData.save();

      // Create wallet for the user
      const newWallet = new Wallet({
        userId: saveUserData._id,
      });

      await newWallet.save();

      // Store user data in session
      req.session.user = { _id: saveUserData._id, 
                           name: saveUserData.name, 
                           email: saveUserData.email };
      // req.session.user = saveUserData._id;// This should store the user ID in the session

      res.json ({success:true, redirectUrl:"/login"});

    }else{
      res.status(400).json({success:false,message:"Invalid OTP, Please try again!"})
    }
  }catch(error){
      console.error("Error verifying OTP",error);
      res.status(500).json({success:false,message:"An error occured"})
  }
}

//----------------------------------------------------

const resendOtp = async (req,res)=>{
  try {
    
     const {email} = req.session.userData;

     if(!email){
      return res.status(400).json({success:false,message:"Email not found in session "})
     }

     const otp = generateOtp();
     req.session.userOtp = otp;

     const emailSent = await sendVerificationEmail(email,otp);

     if(emailSent){
      console.log("resend OTP"+otp);
      res.status(200).json({success:true, message:"OTP resend successfully"})
     }else{
      res.status(500).json({success:false, message:"Failed to resend OTP, Please try again!"})
     }

  } catch (error) {
    console.error("Error resending OTP ", error);
    res.status(500).json({success:false,message:"Internal server Error. Please try again"})
  }
}
//--------------------------------------------------
//login
const loadLogin = async (req,res) => {
  try {

      if(!req.session.user){
        return res.render("login");
      }else{
        res.redirect('/')
      }
          
  } catch (error) {
      res.redirect("/PageNotFound");
  }
}
//--------------------------------------------------------
// const login = async (req,res)=>{
//   try {
//       const {email,password,googleId} = req.body;

//       const findUser = await User.findOne({isAdmin:0,email:email});
//       if(!findUser){
//           return res.render("login",{message:"User not found"});
//       }
//       if(findUser.isBlocked){
//           res.render("login",{message:"User is blocked by admin"})
//       }

//       const passwordMatch = await bcrypt.compare(password,findUser.password);
//       if(!passwordMatch){
//           return res.render("login",{message:"Incorrect Password"})
//       }

//       req.session.user = findUser;
//       res.redirect("/");
//   } catch (error) {
//       console.error("login error",error);
//       res.render("login",{message:"Login failed. Please try again."})
//   }
// }

const login = async (req, res) => {
  try {
      const { email, password, googleId } = req.body;
      const findUser = await User.findOne({ isAdmin: 0, email: email });

      if (!findUser) {
          return res.render("login", { message: "User not found" });
      }

      if (findUser.isBlocked) {
          return res.render("login", { message: "User is blocked by admin" });
      }

      const passwordMatch = await bcrypt.compare(password, findUser.password);
      if (!passwordMatch) {
          return res.render("login", { message: "Incorrect Password" });
      }

      // Store only necessary information in the session
      req.session.user = {
          id: findUser._id,
          name: findUser.name,
          email: findUser.email,
          role: findUser.role, // Add only fields you need
      };

      res.redirect("/");
      
  } catch (error) {
      console.error("Login error:", error);
      res.render("login", { message: "Login failed. Please try again." });
  }
};


//-------------------------------------------------
const logout = async (req,res)=>{
  try {
      req.session.destroy((err)=>{ //destroying session 
          if(err){
              console.log("Session destruction error",err.message);
              return res.redirect("/PageNotFound");
          }

          

          return res.redirect("/login")
      })
  } catch (error) {
      console.log("Logout error",error);
      res.redirect("/PageNotFound");  
  }
}

//-----------------------------------------------------------

module.exports = {
  loadHomepage, 
  pageNotFound, 
  loadSignup, 
  loadShopping,
  signup,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  logout,
  
}