const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/ProductSchema");
const Brand =  require("../../models/brandSchema");
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// const loadShoppingPage = async (req, res) => {
//   try {

//     // Extract Google user or session user
//     const googleUser  = req.user; // This is usually populated by Passport.js
//     const sessionUser  = req.session.user; // Your session user data
//     // Determine which user data to use
//     const user = sessionUser  || googleUser ;

//     const userData = await User.findOne({ _id: user });
//     const categories = await Category.find({ isListed: true });
//     const categoryIds = categories.map((category) => category._id.toString());
//     const page = parseInt(req.query.page) || 1;
//     const limit = 50;
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


// const filterByPrice = async (req,res) => {
//   try {
    
//       // Extract Google user or session user
//     const googleUser  = req.user; // This is usually populated by Passport.js
//     const sessionUser  = req.session.user; // Your session user data
//     // Determine which user data to use
//     const user = sessionUser  || googleUser ;

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

// const filterProduct = async (req,res) => {

//           // Extract Google user or session user
//           const googleUser  = req.user; // This is usually populated by Passport.js
//           const sessionUser  = req.session.user; // Your session user data
//           // Determine which user data to use
//           const user = sessionUser  || googleUser ;
//           const category = req.query.categories;
//           const brand = req.query.brand;

//           // Initialize the query object
//           const query = {
//             isBlocked: false,
//             quantity: { $gt: 0 },
//           };

//           try {
//             // Fetch the selected category
//             if (category) {
//               const findCategory = await Category.findOne({ _id: category });
//               if (findCategory) {
//                 query.category = findCategory._id; // Use the category ID
//               } else {
//                 console.log("Category not found:", category); // Log if category not found
//               }
//             }

//             // Fetch the selected brand
//             if (brand) {
//               const findBrand = await Brand.findOne({ _id: brand });
//               if (findBrand) {
//                 query.brand = { $regex: new RegExp(findBrand.brandName, 'i') }; // Case-insensitive regex
//               } else {
//                 console.log("Brand not found:", brand); // Log if brand not found
//               }
//             }

//             // Fetch products based on the constructed query
//             let findProducts = await Product.find(query).lean();
//             findProducts.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));

//             // Fetch categories for the sidebar
//             const categories = await Category.find({ isListed: true }).lean();

//             // Fetch all brands
//             const brands = await Brand.find({}).lean();

//             // Render the shop view with filtered products
//             res.render("shop", {
//               user,
//               products: findProducts, // Pass the correct variable here
//               categories: categories, // Categories for the sidebar
//               brand: brands, // All brands for rendering
//               selectedCategory: category || null,
//               selectedBrand: brand || null,
//             });
//           } catch (error) {
//             console.error("Error fetching data:", error);
//             res.status(500).render("error", { message: "Internal Server Error" });
//           }

// }

// // const searchProducts = async (req, res) => {
// //     try {
// //       // let search = req.body.query;
  
// //       // // Fetch brands and categories
// //       // const brand = await Brand.find({ isBlocked: false });
// //       // const categories = await Category.find({ isListed: true });
// //       // const categoryIds = categories.map(category => category._id.toString());
  
// //       // let searchResult = [];
  
// //       // // Check if there are filtered products in the session
// //       // if (req.session.filteredProducts && req.session.filteredProducts.length > 0) {
// //       //   searchResult = req.session.filteredProducts.filter(product => product.productName.toLowerCase().includes(search.toLowerCase()));
// //       // } else {
// //       //   // Search for products based on the query
// //       //   searchResult = await Product.find({
// //       //     productName: { $regex: ".*" + search + ".*", $options: "i" },
// //       //     isBlocked: false,
// //       //     quantity: { $gt: 0 },
// //       //     category: { $in: categoryIds },
// //       //   });
// //       // }
  
// //       // // Sort search results by creation date
// //       // searchResult.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
  
// //       // // Pagination setup
// //       // let itemsPerPage = 6;
// //       // let currentPage = parseInt(req.query.page) || 1;
// //       // let startIndex = (currentPage - 1) * itemsPerPage;
// //       // let endIndex = startIndex + itemsPerPage;
// //       // let totalPages = Math.ceil(searchResult.length / itemsPerPage);
// //       // let currentProduct = searchResult.slice(startIndex, endIndex);
  
// //       // // Render the shop view with the search results
// //       // res.render("shop", {
// //       //   user: userData,
// //       //   products: currentProduct,
// //       //   categories: categories,
// //       //   brand: brand, 
// //       //   totalPages,
// //       //   currentPage,
// //       //   count: searchResult.length,
// //       // });
  
// //       let search = req.body.query;
      


// //     } catch (error) {
// //       console.log("Error:", error);
// //       res.redirect("/pageerror");
// //     }
// //   }

// const searchProducts = async (req, res) => {
//   try {
//     const user = req.session.user;
//     const userData = user ? await User.findOne({ _id: user }) : null;
//     const search = req.body.query?.trim(); 
//     if (!search) {
//       return res.render('shop', {
//         user: userData,
//         products: [],
//         category: [],
//         brand: [],
//         totalPages: 0,
//         currentPage: 1,
//         count: 0,
//       });
//     }

//     const brands = await Brand.find({}).lean();
//     const categories = await Category.find({ isListed: true }).lean(); 
//     const categoryIds = categories.map((category) => category._id.toString());
//     let searchResult = [];

//     if (req.session.filteredProducts && req.session.filteredProducts.length > 0) {
//       // Filter from session-stored products
//       searchResult = req.session.filteredProducts.filter((product) =>
//         product.productName.toLowerCase().includes(search.toLowerCase())
//       );
//     } else {
//       // Query database for products matching the search
//       searchResult = await Product.find({
//         productName: { $regex: ".*" + search + ".*", $options: "i" },
//         isBlocked: false,
//         quantity: { $gt: 0 },
//         category: { $in: categoryIds },
//       }).lean();
//     }

    
//     searchResult.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

//     // const itemsPerPage = 6;
//     // const currentPage = parseInt(req.query.page) || 1;
//     // const startIndex = (currentPage - 1) * itemsPerPage;
//     // const endIndex = startIndex + itemsPerPage;
//     // const totalPages = Math.ceil(searchResult.length / itemsPerPage);
//     // const currentProduct = searchResult.slice(startIndex, endIndex);

    
//     return res.render('shop', {
//       user: userData,
//       categories: categories,
//       brand: brands,
//       totalPages,
//       currentPage,
//       count: searchResult.length,
//       //sortOption,
//     });
//   } catch (error) {
//     console.error("Error in searchProducts:", error);
//     if (!res.headersSent) {
//       return res.redirect("/pageNotFound");
//     }
//   }
// };

const loadShoppingPage = async (req,res) => {
  try  {
    const  user = req.session.user;
    const userData  = await User.findOne({_id : user})
    const categories = await Category.find({isListed : true})
    const categoryIds = categories.map((category)=> category._id.toString())
    const page  = parseInt(req.query.page) || 1;
    const limit  = 9;
    const skip = (page-1)*limit;

    //console.log("category ids:",categoryIds);
    

    const products = await Product.find({
      isBlocked : false,
      category : {$in :categoryIds},
      quantity :{$gt :0},

    }).sort({createdAt : -1}).skip(skip).limit(limit)
    
    const totalProducts = await Product.countDocuments({
      isBlocked: false,
      category :{$in : categoryIds},
      quantity : {$gt :0}
    })
    const totalPages = Math.ceil(totalProducts/limit);
    const brands = await Brand.find({isBlocked : false})
    const categoriesWithIds = categories.map(category =>({_id : category._id,name :category.name}))

     res.render('shop',{
      user : userData,
      products : products,
      category : categoriesWithIds,
      brand : brands,
      totalProducts : totalProducts,
      currentPage : page,
      totalPages : totalPages
     });

     //console.log(products);
     

  }catch (error) {
    res.redirect('/pageNotFound')
    
  }
}

const filterProduct  = async(req,res)=>{
  try {
    const user = req.session.user;
    const category = req.query.category;
    const brand = req.query.brand;

    const findCategory = category ? await Category.findOne({_id : category}) : null;
    const findBrand= brand ? await Brand.findOne({_id : brand}) : null;
    const brands = await Brand.find({}).lean();

    const query = {
      isBlocked : false,
      quantity : {$gt :0},

    }
      if(findCategory){
        query.category = findCategory._id;

      }

      if(findBrand){
        query.brand = findBrand.brandName;
      }
    
      let findProducts = await Product.find(query).lean();//retrive as objects from mongoDB
      findProducts.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

      const categories = await Category.find({isListed :true});

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage-1) * itemsPerPage
      let endIndex = (startIndex+itemsPerPage)
      let totalPages = Math.ceil(findProducts.length/itemsPerPage)
      let currentProduct = findProducts.slice(startIndex,endIndex);
      let userData = null;
      if(user){
        userData = await User.findOne({_id : user});
        if(userData){
          const searchEntry = {
            category : findCategory ? findCategory._id : null,
            brand : findBrand ? findBrand.brandName : null,
            searchedOn : new Date()
        }
        userData.searchHistory.push(searchEntry)
        await userData.save()
      }
    }

    req.session.filteredProducts =  currentProduct;

    return res.render('shop',{
      user : userData,
      products : currentProduct,
      category: categories,
      brand : brands,
      totalPages,
      currentPage,
      selectedCategory : category || null,
      selectedBrand : brand || null
    })
    
    

  } catch (error) {
    console.error("Error in filterProduct:", error);
    res.redirect('/pageNotFound')
    
  }
}

const filterByPrice = async(req,res)=>{
  try {

    const user = req.session.user;
    const userData = await User.findOne({_id: user})
    const brands = await Brand.find({}).lean()
    const categories = await Category.find({isListed : true}).lean();
    
    let findProducts = await Product.find({
      salePrice : {$gt: req.query.gt,$lt : req.query.lt},
      isBlocked : false,
      quantity : {$gt :0}
    }).lean()

    findProducts.sort((a,b)=>new Date(b.createdAt) - new Date(a.createdAt))

    let itemsPerPage = 6;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage-1) * itemsPerPage
    let endIndex = startIndex+itemsPerPage;
    let totalPages = Math.ceil(findProducts.length/itemsPerPage)
    const currentProduct = findProducts.slice(startIndex,endIndex)

    req.session.filteredProducts = findProducts;
    return res.render('shop',{
      user : userData,
      products :  currentProduct,
      category : categories,
      brand : brands,
      totalPages,
      currentPage,



    })


    
  } catch (error) {
    console.error("Error in filtering products",error);
    res.redirect('/pageNotFound')
    
  }
}

const searchProducts = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = user ? await User.findOne({ _id: user }) : null;
    const search = req.body.query?.trim(); 
    if (!search) {
      return res.render('shop', {
        user: userData,
        products: [],
        category: [],
        brand: [],
        totalPages: 0,
        currentPage: 1,
        count: 0,
      });
    }

    const brands = await Brand.find({}).lean();
    const categories = await Category.find({ isListed: true }).lean(); 
    const categoryIds = categories.map((category) => category._id.toString());
    let searchResult = [];

    if (req.session.filteredProducts && req.session.filteredProducts.length > 0) {
      // Filter from session-stored products
      searchResult = req.session.filteredProducts.filter((product) =>
        product.productName.toLowerCase().includes(search.toLowerCase())
      );
    } else {
      // Query database for products matching the search
      searchResult = await Product.find({
        productName: { $regex: ".*" + search + ".*", $options: "i" },
        isBlocked: false,
        quantity: { $gt: 0 },
        category: { $in: categoryIds },
      }).lean(); // Use .lean() for plain JavaScript objects
    }

    
    searchResult.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));


  

    
    const itemsPerPage = 6;
    const currentPage = parseInt(req.query.page) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalPages = Math.ceil(searchResult.length / itemsPerPage);
    const currentProduct = searchResult.slice(startIndex, endIndex);

    
    return res.render('shop', {
      user: userData,
      products: currentProduct,
      category: categories,
      brand: brands,
      totalPages,
      currentPage,
      count: searchResult.length,
      //sortOption,
    });
  } catch (error) {
    console.error("Error in searchProducts:", error);
    if (!res.headersSent) {
      return res.redirect("/pageNotFound");
    }
  }
};

const filterByAlphabets = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = user ? await User.findOne({ _id: user }) : null;
    const category = await Category.find({ isListed: true }).lean()
    const brand =  await Brand.find({}).lean();

    const sortOption = req.query.sort || "asc"; // Default to ascending order
    const products = await Product.find({ isBlocked: false, quantity: { $gt: 0 } }).lean();

    // Apply sorting based on sortOption
    if (sortOption === "asc") {
      products.sort((a, b) => a.productName.localeCompare(b.productName, "en", { sensitivity: "base" }));
    } else if (sortOption === "desc") {
      products.sort((a, b) => b.productName.localeCompare(a.productName, "en", { sensitivity: "base" }));
    }

    return res.render("shop", {
      user: userData,
      products,
      category, 
      brand,
      sortOption, // Pass sortOption to identify active filter
    });
  } catch (error) {
    console.error("Error in filterByAlphabets:", error);
    res.redirect("/pageNotFound");
  }
};





module.exports = {
  loadShoppingPage,
  filterByPrice,
  filterProduct,
  searchProducts,
  filterByAlphabets
}