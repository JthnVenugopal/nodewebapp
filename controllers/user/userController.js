const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/ProductSchema");
const Brand =  require("../../models/brandSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();
const bcrypt = require("bcrypt");

//-------------------------------------------------------

const pageNotFound = async (req,res) => {
  try{
    res.render("page-404")
  }catch(error){
    res.redirect("/pageNotFound")
  }
}

//-------------------------------------------------------
// const loadHomepage = async (req, res) => {
//   try {
//       const user = req.session.user;
//       const  categories = await Category.find({isListed:true});
//       let productData = await Product.find(
//           {isBlocked:false,
//               category:{$in:categories.map(category=>category._id)},quantity:{$gt:0}
//           }
//       )

//       productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));// need products added newly
//       productData = productData.slice(0,4);// shows pdt from 0 to 4



//       if (user) {
//           const userData = await User.findOne({ _id: user._id });
//           return res.render("home", { user: userData ,products:productData});
//       } else {
//           return res.render("home", {products:productData}); 
//       }
//   } catch (error) {
//       console.log("Home page not found");
//       return res.status(500).send("Server error");
//   }
// };


const loadHomepage = async (req, res, next) => {
  try {
  

   
    const currentPage = parseInt(req.query.page) || 1;
    const productsPerPage = 8; 

   
    const categories = await Category.find({ isListed: true });

    let productData = await Product.find({
      isBlocked: false,
      category: { $in: categories.map(category => category._id) },
      quantity: { $gte: 0 }
    });

    
    const totalProducts = productData.length;


    const totalPages = Math.ceil(totalProducts / productsPerPage);

    // Slice the product data to only include the products for the current page
    const startIndex = (currentPage - 1) * productsPerPage;
    productData = productData.slice(startIndex, startIndex + productsPerPage);
    // console.log("Product Images:", productData.map(product => product.productImage));
    let userId = req.user || req.session.user;
  let userData = userId
   

  res.locals.user = userData;

   console.log("home page rendering...");
   
      
      // Render homepage with user, product data
      return res.render("home", {
        user: userData,
       
        products: productData,
        currentPage,
        totalPages,
        sortBy: req.query.sortBy || 'name' // Example: you may want to handle sorting
      })
  } catch (error) {
    console.log("Error loading homepage:", error);
    next(error);
  }
};
//------------------------------------------------------
const loadSignup = async (req,res) => {
  try{
    return res.render("signup");
  }catch(error){
    console.log("Signup page not loading", error);
    res.status(500).send('Server Error');

  }
}

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
const login = async (req,res)=>{
  try {
      const {email,password,googleId} = req.body;
      const findUser = await User.findOne({isAdmin:0,email:email});
      if(!findUser){
          return res.render("login",{message:"User not found"});
      }
      if(findUser.isBlocked){
          res.render("login",{message:"User is blocked by admin"})
      }

      const passwordMatch = await bcrypt.compare(password,findUser.password);
      if(!passwordMatch){
          return res.render("login",{message:"Incorrect Password"})
      }

      req.session.user = findUser;
      res.redirect("/");
  } catch (error) {
      console.error("login error",error);
      res.render("login",{message:"Login failed. Please try again."})
  }
}


// const login = async (req, res, next) => {
//   try {
//     const { email, password, googleId } = req.body;

//     // If the user is logging in via Google
//     if (googleId) {
//       let findUser = await User.findOne({ email: email });

//       if (!findUser) {
//         // If the user does not exist in the database, create a new user
//         findUser = new User({
//           email: email,
//           googleId: googleId,
//           role: "user",
//           isVerified: true
//         });
//         await findUser.save();

       
//         const newWallet = new Wallet({ user: findUser._id, balance: 0 });
//         await newWallet.save();
//         findUser.wallet = newWallet._id;


//         await findUser.save();
//       } else {
        
//         if (!findUser.googleId) {
//           findUser.googleId = googleId; // Add Google ID to existing user
//         }

//         if (!findUser.wallet) {
//           const newWallet = new Wallet({ user: findUser._id, balance: 0 });
//           await newWallet.save();
//           findUser.wallet = newWallet._id;
//         }


//         await findUser.save();
//       }

//       // Check if the user is blocked after the Google login process
//       if (findUser.isBlocked) {
//         // If the user is blocked, show an error message and prevent further login
//         return res.render("login", { message: "Your account has been blocked by the admin." });
//       }

//       // If not blocked, proceed to log the user in
//       req.session.user = findUser.toObject(); // Store user data in session
//       sessionActive = true;

//       // Redirect to the homepage or dashboard
//       return res.redirect("/");

//     }

//     // If it's not a Google login, proceed with normal login (email/password)
//     let findUser = await User.findOne({ email: email });

//     if (!findUser) {
//       return res.render("login", { message: "User not found" });
//     }

//     if (findUser.isBlocked) {
//       return res.render("login", { message: "User is blocked by admin" });
//     }

//     if (!findUser.password) {
//       return res.render("login", { message: "Please use Google Sign-In for this account" });
//     }

//     const passwordMatch = await bcrypt.compare(password, findUser.password);

//     if (!passwordMatch) {
//       return res.render("login", { message: "Incorrect password" });
//     }

//     req.session.user = findUser._id;
//     sessionActive = true;

//     res.redirect("/");

//   } catch (error) {
//     console.error("Login error:", error);
//     next(error);
//   }
// };

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


//----------------------------------------------------------

// const loadShoppingPage = async (req,res) => {

//   try {

//     const user =  req.session.user;
//     console.log(user)
//     const userData = await User.findOne({_id:user});
//     const category = await Category.find({isListed:true});
//     const categoryIds = categories.map((category)=>category._id.toString());
//     const page = parseInt(req.query.page) || 1;
//     const limit = 10;
//     const skip = (page - 1) * limit;
//     const products = await Product.find({
//       isBlocked:false,
//       category:{$in:categoryIds},
//       quantity:{$gt:0},

//     }).sort({createdOn:-1}).skip(skip).limit(lmit);

//     const totalProducts = await Product.countDocuments({
//       isBlocked:false,
//       category:{$in:categoryIds},
//       quantity:{$gt:0}
//     });
//     const totalPages = Math.ceil(totalProducts/limit);

//     const brands = await Brand.find({isBlocked:false});
//     const categoriesWithIds = category.map(category => ({_id:category._id,name:category.name}));

//      res.render("shop",
//       {
//       user : userData,
//       products:products,
//       category:categoriesWithIds,
//       brand : brands,
//       totalProducts : totalProducts,
//       currentPage: page,
//       totalPages: totalPages,
//      }
//     );

     
//   } catch (error) {
  
//        res.redirect("/pagerror")

//   }
// }

const loadShoppingPage = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    const categories = await Category.find({ isListed: true });
    const categoryIds = categories.map((category) => category._id.toString());
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      isBlocked: false,
      category: { $in: categoryIds },
      quantity: { $gt: 0 },
    })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit); 

      // console.log(products)

    const totalProducts = await Product.countDocuments({
      isBlocked: false,
      category: { $in: categoryIds },
      quantity: { $gt: 0 },
    });
    const totalPages = Math.ceil(totalProducts / limit);

    const brands = await Brand.find({ isBlocked: false });
    const categoriesWithIds = categories.map(category => ({ _id: category._id, name: category.name }));

    res.render("shop", {
      user: userData,
      products: products,
      categories: categoriesWithIds, // Ensure this matches the EJS variable
      brand: brands,
      totalProducts: totalProducts,
      currentPage: page,
      totalPages: totalPages,
    });
  } catch (error) {
    console.error("Error loading shopping page:", error);
    res.redirect("/pagerror");
  }
};

//-----------------------------------------------------------

const filterProduct = async (req,res) => {
  try {
    
     const user = req.session.user;
     const category = req.query.category;
     const brand = req.query.brand;
     const findCategory = category ? await Category.findOne({_id:category}) : null ;
     const findBrand = brand ? await Brand.findOne({_id:brand}) : null ;
     const brands = await Brand.find({}).lean();

     const query = {
      isBlocked: false,
      quantity: {$gt:0}
     }

     if(findCategory){
      query.category = findCategory._id
     }

     if(findBrand){
      query.brand = findBrand.brandName;
     }

     let findProducts = await Product.find(query).lean();
     findProducts.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));

     const categories = await Category.find({isListed:true});
     
     let itemsPerPage = 6;

     let currentPage = parseInt(req.query.page) || 1;
     let startIndex = (currentPage-1) *  itemsPerPage;
     let endIndex = startIndex+itemsPerPage;
     let totalProducts = Math.ceil(findProducts.length/itemsPerPage);

     const currentProduct = findProducts.slice(startIndex.endIndex);
     let userData = null;

     if(user) {
      userData = await User.findOne({_id:user._id}).lean();
      if(userData){
        const searchEntry = {
          category:findCategory ? findCategory._id:null,
          brand:findBrand ? findBrand.brandName:null,
          searchedOn : new Date()

        }
            userData.searchHistory.push(searchEntry); //saved user activity saved on DB
            await userData.save();
      }
     }

      req.session.filteredProducts = currentProduct;

      res.render("shop",{

          user : userData,
          products:currentProduct,
          category : categories,
          brand : brands ,
          totalPages,
          currentPage,
          selectedCategory : category || null ,
          selectedBrand : brand || null ,
      })
     
  } catch (error) {
    
     res.redirect("/pageNotFound")

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
  loadShoppingPage,
  filterProduct
}