const Product = require("../../models/ProductSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");

const productDetails = async (req, res) => {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);

    const productId = req.query.id;
    const product = await Product.findById(productId).populate('category');
    
    if (!product) {
      return res.status(404).send("Product not found");
    }

    const findCategory = product.category; // The category object
    const categoryOffer = findCategory?.categoryOffer || 0; // Category offer
    const productOffer = product.productOffer || 0; // Product offer
    const totalOffer = categoryOffer + productOffer; // Total offer

    // Render the product details page and pass the required data
    res.render("product-detail", {
      product, // Pass the product data
      category: findCategory, // Explicitly pass the category data
      user: userData, // Optionally pass user data
      totalOffer, // Pass the total offer
    });
  } catch (error) {
    console.error("Error fetching product details:", error);
    res.status(500).send("Internal Server Error");
  }
};

module.exports = {
  productDetails,
};
