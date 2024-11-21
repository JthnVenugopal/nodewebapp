const Product = require("../../models/ProductSchema");
const Category = require("../../models/categorySchema");
const User = require("../../models/userSchema");

const productDetails = async (req,res)=> {
  try {
    const userId = req.session.user;
    const userData = await User.findById(userId);
    const productId = req.querry.id;
    const product = await Product.findById(ProductId).populate('category');
    const findCategory = product.category;
    const categoryOffer = findCategory ?.categoryOffer || 0;//fetching catwgory offer offer
                                                            // 0 because when there is a product offer category offer will be 0

    const productOffer = product.productOffer || 0;

    const totalOffer = categoryOffer + productOffer;

    res.render("product-details");




  } catch (error) {
    
  }
}




module.exports = {
  productDetails
}