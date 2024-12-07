// // 

// // const getShop = async (req,res) => {
// //     try {

// //         const page = parseInt(req.query.page) || 1;
// //         const limit = 8;
// //         const skip = (page - 1) * limit;
// //         const count = await Product.countDocuments();
// //         const totalPages = Math.ceil(count / limit);

// //         const user = req.session.user;
        
// //         const  categories = await Category.find({isListed:true});

// //         const selectedCategory = req.query.category;

// //         let productQuery = { isBlocked: false };
// //         if (selectedCategory) {
// //             productQuery.category = selectedCategory; 
// //         } else {
// //             productQuery.category = { $in: categories.map(category => category._id) };
// //         }

// //         let productData = await Product.find(productQuery).skip(skip).limit(limit);



// //         productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));
// //         productData = productData.slice(0);



// //         if (user) {
// //             const userData = await User.findOne({ _id: user._id });
// //             return res.render("shop", { user: userData ,products:productData,categories, selectedCategory,currentPage:page,totalPages});
// //         } else {
// //             return res.render("shop", {products:productData , categories, selectedCategory,currentPage:page,totalPages}); 
// //         }
// //     } catch (error) {
// //         console.error("Error loading shop page",error);
// //         return res.status(500).send("Server error");
// //     }

// // }

// // module.exports = {
// //     getShop
// // }

// const getShop = async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1;
//         const limit = 8;
//         const skip = (page - 1) * limit;
//         const count = await Product.countDocuments();
//         const totalPages = Math.ceil(count / limit);

//         const user = req.session.user;
//         const categories = await Category.find({ isListed: true });

//         const selectedCategory = req.query.category;
//         const sortOption = req.query.sort; // Retrieve the sort option from query parameter

//         let productQuery = { isBlocked: false };
//         if (selectedCategory) {
//             productQuery.category = selectedCategory;
//         } else {
//             productQuery.category = { $in: categories.map(category => category._id) };
//         }

//         // Fetch products based on query
//         let productData = await Product.find(productQuery)
//             .skip(skip)
//             .limit(limit);

//         // Sorting logic based on the sortOption
//         switch (sortOption) {
//             case "priceHighToLow":
//                 productData.sort((a, b) => b.price - a.price);
//                 break;
//             case "priceLowToHigh":
//                 productData.sort((a, b) => a.price - b.price);
//                 break;
//             case "nameAZ":
//                 productData.sort((a, b) => a.name.localeCompare(b.name));
//                 break;
//             case "nameZA":
//                 productData.sort((a, b) => b.name.localeCompare(a.name));
//                 break;
//             case "popularity":
//                 productData.sort((a, b) => b.purchaseCount - a.purchaseCount);
//                 break;
//             case "newArrivals":
//                 productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn));
//                 break;
//             case "averageRating":
//                 productData.sort((a, b) => b.averageRating - a.averageRating);
//                 break;
//             default:
//                 productData.sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn)); // Default to New arrivals
//                 break;
//         }

//         if (user) {
//             const userData = await User.findOne({ _id: user._id });
//             return res.render("shop", {
//                 user: userData,
//                 products: productData,
//                 categories,
//                 selectedCategory,
//                 currentPage: page,
//                 totalPages,
//                 sortOption // Pass sortOption for rendering
//             });
//         } else {
//             return res.render("shop", {
//                 products: productData,
//                 categories,
//                 selectedCategory,
//                 currentPage: page,
//                 totalPages,
//                 sortOption // Pass sortOption for rendering
//             });
//         }
//     } catch (error) {
//         console.error("Error loading shop page", error);
//         return res.status(500).send("Server error");
//     }
// };

// module.exports = {
//     getShop
// };


//////////////////////////////////////////////////////////
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Brand = require("../../models/brandSchema")

const loadShoppingPage = async (req,res) => {
    try  {
      const  user = req.session.user || req.user;
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
  
      //console.log("category with  ids :",categoriesWithIds);
      
      
  
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
        console.log(error);
      res.redirect('/pageNotFound')
      
    }
  }

  // const filterProduct  = async(req,res)=>{
  //   try {
  //     const user = req.session.user || req.user;
  //     const category = req.query.category;
  //     const brand = req.query.brand;

  //     const findCategory = category ? await Category.findOne({_id : category}) : null;
  //     const findBrand= brand ? await Brand.findOne({_id : brand}) : null;
  //     const brands = await Brand.find({}).lean();

  //     const query = {
  //       isBlocked : false,
  //       quantity : {$gt :0},

  //     }
  //       if(findCategory){
  //         query.category = findCategory._id;

  //       }

  //       if(findBrand){
  //         query.brand = findBrand.brandName;
  //       }
      
  //       let findProducts = await Product.find(query).lean();//retrive as objects from mongoDB
  //       findProducts.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));

  //       const categories = await Category.find({isListed :true});

  //       let itemsPerPage = 6;
  //       let currentPage = parseInt(req.query.page) || 1
  //       let startIndex = (currentPage-1) * itemsPerPage
  //       let endIndex = (startIndex+itemsPerPage)
  //       let totalPages = Math.ceil(findProducts.length/itemsPerPage)
  //       let currentProduct = findProducts.slice(startIndex,endIndex);
  //       let userData = null;
  //       if(user){
  //         userData = await User.findOne({_id : user});
  //         if(userData){
  //           const searchEntry = {
  //             category : findCategory ? findCategory._id : null,
  //             brand : findBrand ? findBrand.brandName : null,
  //             searchedOn : new Date()
  //         }
  //         userData.searchHistory.push(searchEntry)
  //         await userData.save()
  //       }
  //     }

  //     req.session.filteredProducts =  currentProduct;

  //     return res.render('shop',{
  //       user : userData,
  //       products : currentProduct,
  //       category: categories,
  //       brand : brands,
  //       totalPages,
  //       currentPage,
  //       selectedCategory : category || null,
  //       selectedBrand : brand || null
  //     })
      
      

  //   } catch (error) {
  //     console.error("Error in filterProduct:", error);
  //     res.redirect('/pageNotFound')
      
  //   }
  // }

  const filterProduct = async (req, res) => {
    try {
        const user = req.session.user || req.user;
        const categoryId = req.query.category;
        const brandId = req.query.brand;

        // Fetch the user data if logged in
        const userData = user ? await User.findOne({ _id: user }) : null;

        // Fetch all brands for rendering
        const brands = await Brand.find({}).lean();
        const categories = await Category.find({ isListed: true }).lean();

        // Build the query for filtering products
        const query = {
            isBlocked: false,
            quantity: { $gt: 0 },
        };

        // Add category filter if provided
        if (categoryId) {
            const findCategory = await Category.findOne({ _id: categoryId });
            if (findCategory) {
                query.category = findCategory._id; // Use category ID
            }
        }

        // Add brand filter if provided
        if (brandId) {
            const findBrand = await Brand.findOne({ _id: brandId });
            if (findBrand) {
                query.brand = findBrand._id; // Use brand ID
            }
        }

        // Fetch products based on the constructed query
        let findProducts = await Product.find(query).lean();
        findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination setup
        const itemsPerPage = 6;
        const currentPage = parseInt(req.query.page) || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(findProducts.length / itemsPerPage);
        const currentProduct = findProducts.slice(startIndex, endIndex);

        // Store filtered products in session for potential future use
        req.session.filteredProducts = currentProduct;

        // Provide feedback if no products are found
        if (currentProduct.length === 0) {
            return res.render('shop', {
                user: userData,
                products: [],
                category: categories,
                brand: brands,
                totalPages,
                currentPage,
                message: 'No products found for the selected filters.'
            });
        }

        // Render the shop page with the filtered products
        return res.render('shop', {
            user: userData,
            products: currentProduct,
            category: categories,
            brand: brands,
            totalPages,
            currentPage,
            selectedCategory: categoryId || null,
            selectedBrand: brandId || null
        });

    } catch (error) {
        console.error("Error in filterProduct:", error);
        res.redirect('/pageNotFound');
    }
};


  const searchProducts = async (req, res) => {
    try {
      const user = req.session.user || req.user;
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
       
      });
    } catch (error) {
      console.error("Error in searchProducts:", error);
      if (!res.headersSent) {
        return res.redirect("/pageNotFound");
      }
    }
  };



  const sortPrice = async (req, res) => {
    try {
      const user = req.session.user || req.user;
      const userData = user ? await User.findOne({ _id: user }) : null;
      const category = await Category.find({}).lean();
      const brand = await Brand.find({}).lean();

      const sort = req.query.sort || 'desc'; 
    
      let products = await Product.find({ isBlocked: false, quantity: { $gt: 0 } }).lean();
  
      if (sort === 'asc') {
        products.sort((a, b) => a.salePrice - b.salePrice); 
      } else if (sort === 'desc') {
        products.sort((a, b) => b.salePrice - a.salePrice); 
      }

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage-1) * itemsPerPage
      let endIndex = startIndex+itemsPerPage;
      let totalPages = Math.ceil(products.length/itemsPerPage)
      const currentProduct = products.slice(startIndex,endIndex)
    
      
      res.render('shop', {
        user: userData,
        products: currentProduct,
        category: category,
        brand: brand,
        sort, 
        totalPages,
        currentPage,
      });
    } catch (error) {
      console.error('Error in sortPrice:', error);
      res.redirect('/pageNotFound');
    }
  };
  


  const sortByAlpha  = async (req, res) => {
    try {
      const user = req.session.user || req.user;
      const userData = user ? await User.findOne({ _id: user }) : null;
      const category = await Category.find({}).lean();
      const brand = await Brand.find({}).lean();
  
      
      const sort = req.query.sort || 'desc'; 
  
     
      let products = await Product.find({ isBlocked: false, quantity: { $gt: 0 } }).lean();
  
      if (sort === 'az') {
        
        products.sort((a, b) => a.productName.localeCompare(b.productName));
      } else if (sort === 'za') {
       
        products.sort((a, b) => b.productName.localeCompare(a.productName));
      }
  
      // Pagination
      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(products.length / itemsPerPage);
      const currentProduct = products.slice(startIndex, endIndex);
  
      // Render the shop page
      res.render('shop', {
        user: userData,
        products: currentProduct,
        category: category,
        brand: brand,
        sort, 
        totalPages,
        currentPage,
      });
    } catch (error) {
      console.error('Error in sortPrice:', error);
      res.redirect('/pageNotFound');
    }
  };
  


  const  clearFilters = async (req, res) => {
    try {
      req.session.products = null;
      res.redirect("/shop");
    } catch (error) {
      console.error(error);
    }
  };
  


  
  const filterByPrice = async(req,res)=>{
    try {

      const user = req.session.user || req.user;
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












  module.exports = {
    loadShoppingPage,
    filterProduct,
    searchProducts,
    sortPrice,
    sortByAlpha,
    clearFilters,
    filterByPrice

  }