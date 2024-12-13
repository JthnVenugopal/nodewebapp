
// const Category = require("../../models/categorySchema");
// const Product = require("../../models/productSchema");
// const User = require("../../models/userSchema");
// const Brand = require("../../models/brandSchema");
// const Variant = require("../../models/variantSchema")

// // const loadShoppingPage = async (req, res) => { 
// //   try { 
// //     const user = req.session.user || req.user;

// //     console.log(req.body);

// //     const products = await Product.find({ isBlocked: false }); 
    
// //     res.render('shop', { 
// //       user: user,
// //       products: products,

// //      }); } 

// //     catch (error) {

// //        console.error("Error loading shopping page:", error);
// //         res.status(500).send("Internal Server Error"); 

// //       } };

// const loadShoppingPage = async (req, res) => { 
//   try { 
//     const user = req.session.user || req.user;

//     console.log(req.body);
    
//     // Use populate to get the variant associated with each product
//     const products = await Product.find({ isBlocked: false }).populate('variant'); 

//     const categories = await Category.find({isListed:true}); 
//     const brands = await Brand.find({isBlocked:false}); 

//     const brandNames = brands.map(brand => brand.brandName);

    

    
//     res.render('shop', { 
//       user: user,
//       products: products,
//       categories: categories, 
//       brands: brands,
//       brandNames : brandNames 
//     }); 
//   } catch (error) {
//     console.error("Error loading shopping page:", error);
//     res.status(500).send("Internal Server Error"); 
//   } 
// };


//  /////////////////////////////////////////////////////////////////

//  const filterProduct = async (req, res) => {
//   try {
//     const user = req.session.user || req.user;

//     // Extract filter criteria from the request body
//     const { category, brand, minPrice, maxPrice } = req.body;

//     // Build the filter object
//     let filter = { isBlocked: false };

//     // Filter by category if provided
//     if (category) {
//       filter.category = category; // Assuming category is an ObjectId
//     }

//     // Filter by brand if provided
//     if (brand) {
//       filter.brand = brand; // Assuming brand is an ObjectId
//     }

//     // Filter by price range if provided
//     if (minPrice || maxPrice) {
//       filter.price = {};
//       if (minPrice) {
//         filter.price.$gte = minPrice; // Greater than or equal to minPrice
//       }
//       if (maxPrice) {
//         filter.price.$lte = maxPrice; // Less than or equal to maxPrice
//       }
//     }

//     // Fetch filtered products
//     const products = await Product.find(filter).populate('variant');

//     // Fetch categories and brands for the filter form
//     const categories = await Category.find(); // Assuming you have a Category model
//     const brands = await Brand.find(); // Assuming you have a Brand model

//     // Render the shop page with filtered products and available categories and brands
//     res.render('shop', { 
//       user: user,
//       products: products,
//       categories: categories,
//       brands: brands,
//     }); 
//   } catch (error) {
//     console.error("Error filtering products:", error);
//     res.status(500).send("Internal Server Error"); 
//   } 
// };


// //   const searchProducts = async (req, res) => {
   
// //   };



// //   const sortPrice = async (req, res) => {
   
// //   };
  


// //   const sortByAlpha  = async (req, res) => {
 
// //   };
  


// //   const  clearFilters = async (req, res) => {
  
// //   };
  


  
// //   const filterByPrice = async(req,res)=>{
   
// //   }












//   module.exports = {
//     loadShoppingPage,
//     filterProduct
 

//   }


const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Brand = require("../../models/brandSchema");
const Variant = require("../../models/variantSchema");

const loadShoppingPage = async (req, res) => { 
  try { 
    const user = req.session.user || req.user;

    // Fetch all products initially
    const products = await Product.find({ isBlocked: false }).populate('variant'); 
    const categories = await Category.find({ isListed: true }); 
    const brands = await Brand.find({ isBlocked: false }); 

    res.render('shop', { 
      user: user,
      products: products,
      categories: categories, 
      brands: brands,
    }); 
  } catch (error) {
    console.error("Error loading shopping page:", error);
    res.status(500).send("Internal Server Error"); 
  } 
};

const filterProduct = async (req, res) => {
  try {
    const user = req.session.user || req.user;

    // Extract filter criteria from the request body
    const { category, brand, minPrice, maxPrice, sort, search } = req.body;

    // Build the filter object
    let filter = { isBlocked: false };

    // Filter by category if provided
    if (category) {
      filter.category = category; // Assuming category is an ObjectId
    }

    // Filter by brand if provided
    if (brand) {
      filter.brand = brand; // Assuming brand is an ObjectId
    }

    // Filter by price range if provided
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = minPrice; // Greater than or equal to minPrice
      }
      if (maxPrice) {
        filter.price.$lte = maxPrice; // Less than or equal to maxPrice
      }
    }

    // Search functionality
    if (search) {
      filter.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    // Fetch filtered products
    let products = await Product.find(filter).populate('variant');

    // Sorting functionality
    // if (sort) {
    //   switch (sort) {
    //     case 'popularity':
    //       products.sort((a, b) => b.popularity - a.popularity); // Assuming you have a popularity field
    //       break;
    //     case 'priceAsc':
    //       products.sort((a, b) => a.variant.salePrice - b.variant.salePrice);
    //       break;
    //     case 'priceDesc':
    //       products.sort((a, b) => b.variant.salePrice - a.variant.salePrice);
    //       break;
    //     case 'averageRating':
    //       products.sort((a, b) => b.averageRating - a.averageRating); // Assuming you have an averageRating field
    //       break;
    //     case 'featured':
    //       products = products.filter(product => product.isFeatured); // Assuming you have an isFeatured field
    //       break;
    //     case 'newArrivals':
    //       products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Assuming you have a createdAt field
    //       break;
    //     case 'nameAsc':
    //       products.sort((a, b) => a.productName.localeCompare(b.productName));
    //       break;
    //     case 'nameDesc':
    //       products.sort((a, b) => b.productName.localeCompare(a.productName));
    //       break;
    //     default:
    //       break;
    //   }
    // }

    if (sort) {
      if (sort === 'popularity') {
        products.sort((a, b) => b.popularity - a.popularity); // Assuming you have a popularity field
      } else if (sort === 'priceAsc') {
        products.sort((a, b) => a.variant.salePrice - b.variant.salePrice);
      } else if (sort === 'priceDesc') {
        products.sort((a, b) => b.variant.salePrice - a.variant.salePrice);
      } else if (sort === 'averageRating') {
        products.sort((a, b) => b.averageRating - a.averageRating); // Assuming you have an averageRating field
      } else if (sort === 'featured') {
        products = products.filter(product => product.isFeatured); // Assuming you have an isFeatured field
      } else if (sort === 'newArrivals') {
        products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Assuming you have a createdAt field
      } else if (sort === 'nameAsc') {
        products.sort((a, b) => a.productName.localeCompare(b.productName));
      } else if (sort === 'nameDesc') {
        products.sort((a, b) => b.productName.localeCompare(a.productName));
      }
    }
    


    // Fetch categories and brands for the filter form
    const categories = await Category.find({ isListed: true });
    const brands = await Brand.find({ isBlocked: false });

    // Render the shop page with filtered products and available categories and brands
    res.render('shop', { 
      user: user,
      products: products,
      categories: categories,
      brands: brands,
    }); 
  } catch (error) {
    console.error("Error filtering products:", error);
    res.status(500).send("Internal Server Error"); 
  } 
};

module.exports = {
  loadShoppingPage,
  filterProduct,
};