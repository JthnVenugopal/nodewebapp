const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Brand = require("../../models/brandSchema");
const Variant = require("../../models/variantSchema")

// const productDetails = async (req, res) => {
//   try {

//     let user = req.session.user || req.user ;

//     const productId = req.query.id;

//     const product = await Product.findById(productId);

//     const {variant, brand , category } = product;

//     const brandData = await Brand.findById(brand);

//     const categoryData = await Category.findById(category)

//     const {size , variantCode } = variant;

//     const sameVariant =  await Product.find({
//       "variant.variantCode" : product.variant.variantCode,
//     });

//     
   
    

//        res.render('product-detail',{
            
//            product : product,
//            variant : variant , 
//            brand : brandData,
//            category : categoryData,
//            size : size ,
//            user : user,
//            sameVariant : sameVariant,
//        })

//         }catch(error){
//           console.log(error)
//         }
//   }

//////////////////////////////
// const productDetails = async (req, res) => {
//   try {
//     let user = req.session.user || req.user;

//     const productId = req.query.id;

//     // Use populate to get the variant associated with the product
//     const product = await Product.findById(productId).populate('variant');

//     if (!product) {
//       return res.status(404).send("Product not found");
//     }

//     const { variant, brand, category } = product;

//     // Populate brand and category if needed
//     const brandData = await Brand.findById(brand);
//     const categoryData = await Category.findById(category);
  
//     // Get the size and variantCode from the populated variant
//     const { size, variantCode } = variant;

//     const sameVariant = await Variant.find({ "variant.variantCode": variant.variantCode });

    

//     res.render('product-detail', {
//       product: product,
//       variant: variant,
//       brand: brandData,
//       category: categoryData,
//       size: size,
//       user: user,
//       sameVariant: sameVariant,
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

/////////////////////////////
// const productDetails = async (req, res) => {
//   try {
//     let user = req.session.user || req.user;

//     const productId = req.query.id;

//     // Use populate to get the variant associated with the product
//     const product = await Product.findById(productId).populate('variant');

//     if (!product) {
//       return res.status(404).send("Product not found");
//     }

//     const { variant, brand, category } = product;

//     // Populate brand and category if needed
//     const brandData = await Brand.findById(brand);
//     const categoryData = await Category.findById(category);
  
//     // Get the size and variantCode from the populated variant
//     const { size, variantCode } = variant;

//     // Find products with the same variantCode
//     const sameVariants = await Product.find({ "variant.variantCode": variantCode }).populate('variant');


//   

//     res.render('product-detail', {
//       product: product,
//       variant: variant,
//       brand: brandData,
//       category: categoryData,
//       size: size,
//       user: user,
//       sameVariants: sameVariants, // Pass the same variants to the front end
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

////////////////////////////////////

// const productDetails = async (req, res) => {
//   try {
//     let user = req.session.user || req.user;

//     const productId = req.query.id;

//     // Use populate to get the variant associated with the product
//     const product = await Product.findById(productId).populate('variant');

//     if (!product) {
//       return res.status(404).send("Product not found");
//     }

//     const { variant, brand, category } = product;

//     // Populate brand and category if needed
//     const brandData = await Brand.findById(brand);
//     const categoryData = await Category.findById(category);
  
//     // Get the variantCode from the populated variant
//     const { variantCode , size } = variant;

//     // Find variants with the same variantCode
//     const sameVariants = await Variant.find({ variantCode: variantCode });

//     // Optionally, you can also find products that use these same variants
//     const sameVariantProducts = await Product.find({ variant: { $in: sameVariants.map(v => v._id) } }).populate('variant');

    
    

//     res.render('product-detail', {
//       product: product,
//       variant: variant,
//       brand: brandData,
//       category: categoryData,
//       user: user,
//       sameVariants: sameVariants,
//       sameVariantProducts: sameVariantProducts ,
//       size : size 
//     });
//   } catch (error) {
//     console.log(error);
//     res.status(500).send("Internal Server Error");
//   }
// };

/////////////////////////////////////

// module.exports = {
//   productDetails,
// };


////////////////////////////////////////////////////////////////////////////




///////////////////////////////////////////////////////////////


const productDetails = async (req, res) => {
  try {
    let user = req.session.user || req.user;

    const productId = req.query.id;

    // Fetch the product
    const product = await Product.findById(productId).populate('variant');

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Fetch the variant
    const {variant} = product ;
    const { size } = variant;
    
    // Populate brand and category if needed
    const brandData = await Brand.findById(product.brand);
    const categoryData = await Category.findById(product.category);

    // Get the variantCode from the product's variant
    const variantCode = product.variant.variantCode;

    // Fetch all variants with the same variantCode
    const sameVariants = await Variant.find({ variantCode: variantCode });

    

    const colors = sameVariants.map(variant => variant.color);
    const variantImages = sameVariants.map(variant => variant.productImages);

    va



    res.render('product-detail', {
      product: product,
      sameVariants: sameVariants, // Pass all variants with the same variantCode to the front end
      brand: brandData,
      category: categoryData,
      user: user,
      variant : variant,
      size : size,
      user : user,
      colors:colors,
      variantImages : variantImages,
    });
    
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  productDetails,
};

