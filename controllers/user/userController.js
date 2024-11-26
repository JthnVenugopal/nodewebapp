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


// const loadShoppingPage = async (req, res) => {
//   try {
//     const user = req.session.user;
//     const userData = await User.findOne({ _id: user });
//     const categories = await Category.find({ isListed: true });
//     const categoryIds = categories.map((category) => category._id.toString());
//     const page = parseInt(req.query.page) || 1;
//     const limit = 30;
//     const skip = (page - 1) * limit;

//     const products = await Product.find({
//       isBlocked: false,
//       category: { $in: categoryIds },
//       quantity: { $gt: 0 },
//     })
//       .sort({ createdOn: -1 })
//       .skip(skip)
//       .limit(limit); 

//       // console.log(products)

//     const totalProducts = await Product.countDocuments({
//       isBlocked: false,
//       category: { $in: categoryIds },
//       quantity: { $gt: 0 },
//     });
//     const totalPages = Math.ceil(totalProducts / limit);

//     const brand = await Brand.find({ isBlocked: false });
//     const categoriesWithIds = categories.map(category => ({ _id: category._id, name: category.name }));

//     res.render("shop", {
//       user: userData,
//       products: products,
//       categories: categoriesWithIds, // Ensure this matches the EJS variable
//       brand: brand,
//       totalProducts: totalProducts,
//       currentPage: page,
//       totalPages: totalPages,
//     });
//   } catch (error) {
//     console.error("Error loading shopping page:", error);
//     res.redirect("/pagerror");
//   }
// };

//-----------------------------------------------------------

// const filterProduct = async (req, res) => {
//   try {
    
//     const user = req.session.user;
//     const category = req.query.categories;
//     const brand = req.query.brand;
    

//     // Initialize the query object
//     const query = {
//       isBlocked: false,
//       quantity: { $gt: 0 }
//     };

//     // Fetch the selected category and brand
//     if (category) {
//       const findCategory = await Category.findOne({ _id: category });
//       if (findCategory) {
//         query.category = findCategory._id; // Use the category ID
//       } else {
//         console.log("Category not found:", category); // Log if category not found
//       }
//     }

//     if (brand) {
//       const findBrand = await Brand.findOne({ _id: brand });
//       if (findBrand) {
//         // Use a case-insensitive regex for brand name
//         query.brand = { $regex: new RegExp(findBrand.brandName, 'i') }; // Case-insensitive
//       } else {
//         console.log("Brand not found:", brand); // Log if brand not found
//       }
//     }

//     // Fetch products based on the constructed query
//     let findProducts = await Product.find(query).lean();
//     findProducts.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));


//     // Fetch categories for the sidebar
//     const categories = await Category.find({ isListed: true }).lean();
  

//     // Pagination setup
//     let itemsPerPage = 6;
//     let currentPage = parseInt(req.query.page) || 1;
//     let startIndex = (currentPage - 1) * itemsPerPage;
//     let endIndex = startIndex + itemsPerPage;

//     // Calculate total pages
//     let totalProducts = findProducts.length; // Total products found
//     let totalPages = Math.ceil(totalProducts / itemsPerPage); // Calculate total pages

//     // Slice products for the current page
//     const currentProduct = findProducts.slice(startIndex, endIndex);

//     let userData = null;

//     // If user is logged in, update search history
//     if (user) {
//       userData = await User.findOne({ _id: user._id }).lean();
//       if (userData) {
//         const searchEntry = {
//           category: category ? category : null,
//           brand: brand ? findBrand.brandName : null,
//           searchedOn: new Date()
//         };
//         userData.searchHistory.push(searchEntry); // Save user activity
//         await userData.save();
//       }
//     }

//     // Render the shop view with filtered products
//     res.render("shop", {
//       user: userData,
//       products: currentProduct,
//       categories: categories, // Ensure categories are passed correctly
//       brand: await Brand.find({}).lean(), // Fetch all brands for rendering
//       totalProducts: totalProducts,
//       currentPage: currentPage,
//       totalPages: totalPages,
//       selectedCategory: category || null,
//       selectedBrand: brand || null,
//     });

//   } catch (error) {
//     console.error("Error filtering products:", error);
//     res.redirect("/pageNotFound");
//   }
// };

//-----------------------------------------------------------

// const filterByPrice = async (req,res) => {
//   try {
    
//       const user = req.session.user;
//       const userData = await User.findOne({_id:user});
//       const brand = await Brand.find({}).lean();
//       const categories = await Category.find({isListed:true}).lean();

//       let findProducts = await Product.find({
//         salePrice: {$gt:req.query.gt, $lt: req.query.lt},
//         isBlocked:false,
//         quantity:{$gt:0},
//       }).lean();

//       findProducts.sort((a,b)=> new Date(b.createdOn) - new Date(a.createdOn));

//       let itemsPerPage = 9;
//       let currentPage = parseInt(req.query.page) || 1;
//       let startIndex = (currentPage - 1)*itemsPerPage;
//       let endIndex = startIndex + itemsPerPage;
//       let totalPages = Math.ceil(findProducts.length/itemsPerPage);
//       const currentProduct = findProducts.slice(startIndex,endIndex);

//       req.session.filteredProducts = findProducts;

//       res.render("shop" , {
//         user:userData,
//         products:currentProduct,
//         categories: categories,
//         brand : brand,
//         totalPages,
//         currentPage,

//       })

//   } catch (error) {
//       console.log(error);
//       res.redirect("/pageNotFound")    
//   }
// }

//-----------------------------------------------------------
// const searchProducts = async (req, res) => {
//   try {
//     const user = req.session.user;
//     const userData = await User.findOne({ _id: user });
//     let search = req.body.query;

//     // Fetch brands and categories
//     const brand = await Brand.find({ isBlocked: false }).lean();
//     const categories = await Category.find({ isListed: true }).lean();
//     const categoryIds = categories.map(category => category._id.toString());

//     let searchResult = [];

//     // Check if there are filtered products in the session
//     if (req.session.filteredProducts && req.session.filteredProducts.length > 0) {
//       searchResult = req.session.filteredProducts.filter(product => product.productName.toLowerCase().includes(search.toLowerCase()));
//     } else {
//       // Search for products based on the query
//       searchResult = await Product.find({
//         productName: { $regex: ".*" + search + ".*", $options: "i" },
//         isBlocked: false,
//         quantity: { $gt: 0 },
//         category: { $in: categoryIds },
//       });
//     }

//     // Sort search results by creation date
//     searchResult.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

//     // Pagination setup
//     let itemsPerPage = 6;
//     let currentPage = parseInt(req.query.page) || 1;
//     let startIndex = (currentPage - 1) * itemsPerPage;
//     let endIndex = startIndex + itemsPerPage;
//     let totalPages = Math.ceil(searchResult.length / itemsPerPage);
//     let currentProduct = searchResult.slice(startIndex, endIndex);

//     // Render the shop view with the search results
//     res.render("shop", {
//       user: userData,
//       products: currentProduct,
//       categories: categories,
//       brand: brand, 
//       totalPages,
//       currentPage,
//       count: searchResult.length,
//     });

//   } catch (error) {
//     console.log("Error:", error);
//     res.redirect("/pageerror");
//   }
// }

//-----------------------------------------------------------




//-----------------------------------------------------------




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
  // loadShoppingPage,
  // filterProduct,
  // filterByPrice,
  // // searchProducts,
  
}