

const Product = require("../../models/productSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");
const Rating = require("../../models/ratingSchema"); // Import the Rating model
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const Brand = require("../../models/brandSchema");
const Variant = require("../../models/variantSchema");

const productDetails = async (req, res) => {
  try {
    let user = req.session.user || req.user;

    const productId = req.query.id;

    // Fetch the product and populate the variant
    const product = await Product.findById(productId).populate('variant');

    if (!product) {
      return res.status(404).send("Product not found");
    }

    // Fetch the variant and its size
    const { variant } = product;
    const { size } = variant;

    // console.log(variant)

    // Populate brand and category
    const brandData = await Brand.findById(product.brand);
    const categoryData = await Category.findById(product.category);

    // Get the variantCode from the product's variant
    const variantCode = product.variant.variantCode;

    // Fetch all variants with the same variantCode
    const sameVariants = await Variant.find({ variantCode: variantCode });

    // Fetch existing ratings for the product
    const ratings = await Rating.find({ productId: productId }).populate('userId'); // Assuming userId is referenced in the Rating schema

    // Prepare colors and images for the same variants
    const colors = sameVariants.map(variant => variant.color);
    const variantImages = sameVariants.map(variant => variant.productImages);

    res.render('product-detail', {
      product: product,
      sameVariants: sameVariants,
      brand: brandData,
      category: categoryData,
      user: user,
      variant: variant,
      size: size,
      colors: colors,
      variantImages: variantImages,
      ratings: ratings // Pass the ratings to the view
    });

  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

const selectSize = async (req, res) => {
  try {
     
      const { productId, size } = req.body; 


      // console.log(size)
     
      if (!productId || !size) {
          return res.status(400).json({ message: 'Product ID and size are required.' });
      }

      
      const product = await Product.findById(productId); 

      if (!product) {
          return res.status(404).json({ message: 'Product not found.' });
      }

      
      if (!product.sizes.includes(size)) {
          return res.status(400).json({ message: 'Selected size is not available.' });
      }

      
      const cartItem = await Cart.addItem(req.user.id, productId, size);

    
      return res.status(200).json({ message: 'Size selected successfully.', cartItem });
  } catch (error) {
      console.error('Error selecting size:', error);
      return res.status(500).json({ message: 'An error occurred while selecting the size.' });
  }
};


module.exports = {
  productDetails,
  selectSize,

};

