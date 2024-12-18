const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Variant = require("../../models/variantSchema");



const addToWishlist = async (req,res)=>{

try {
  

  console.log("-------------------------addToWishlist---------------------------");
  
  const { productId, variantId, color,name } = req.body;
  const user = req.session.user || req.user;

  const userId = req.session.user.id || req.user.id;

  const userData =  await User.findById(userId);

  const productData = await Product.findById(productId);

  // console.log("ProductData---------- : "+ productData)

  const variantData = await Variant.findById(variantId);

   console.log("variantData---------- : "+ variantData);

   


  res.render('wishlist',{
    user:user,
    product : productData,
    variant:variantData,
    color:color,
    name:name


  })


} catch (error) {
  
}



}

///////////////////////////////////////////////////////////////////

const loadWishlist = async (req,res) =>{


  try {

    
    
  } catch (error) {
    
  }




}

module.exports = {

  loadWishlist,
  addToWishlist


}