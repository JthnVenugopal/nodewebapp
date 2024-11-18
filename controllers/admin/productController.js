const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const fs = require("fs"); // need file delete/ file unlink/ image delete time fs needed 
const path = require ("path");
const sharp = require("sharp")// sharp module used to - image resize

//----------------------------------------------------------------

const getProductAddPage = async (req,res) => {
  try {
    
    const category = await Category.find({isListed:true});
    const brand = await Brand.find({isBlocked:false});
    res.render("product-add",{
      cat:category,
      brand:brand
    });

  } catch (error) {
    res.redirect("/pageerror");
  }
}

// const getProductAddPage = async (req, res) => {
//   try {
//     // Fetch categories and brands concurrently
//     const [categories, brands] = await Promise.all([
//       Category.find({ isListed: true }),
//       Brand.find({ isBlocked: false })
//     ]);

//     // Rendering the product add page with fetched categories and brands
//     res.render("product-add", {
//       cat: categories,
//       brand: brands
//     });
//   } catch (error) {
//     console.error("Error fetching categories or brands:", error); // Log the error for debugging
//     res.redirect("/pageerror");
//   }
// };


//----------------------------------------------------------------


//----------------------------------------------------------------



//----------------------------------------------------------------

module.exports = {
 getProductAddPage,


}