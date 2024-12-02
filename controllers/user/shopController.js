const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");



const getShop = async (req,res) => {
    try {
      const sessionUser = req.session.user;
      const googleUser  = req.user;
      const user = sessionUser || googleUser;
        
        const  categories = await Category.find({isListed:true});

        const selectedCategory = req.query.category;

        let productQuery = { isBlocked: false };
        if (selectedCategory) {
            productQuery.category = selectedCategory; 
        } else {
            productQuery.category = { $in: categories.map(category => category._id) };
        }

        let productData = await Product.find(productQuery);



        productData.sort((a,b)=>new Date(b.createdOn)-new Date(a.createdOn));
        productData = productData.slice(0);



        if (user) {
            const userData = await User.findOne({ _id: user._id });
            return res.render("shop", { user: userData ,products:productData,categories, selectedCategory});
        } else {
            return res.render("shop", {
              products:productData , categories, selectedCategory}); 
        }
    } catch (error) {
        console.error("Error loading shop page",error);
        return res.status(500).send("Server error");
    }

}

const sortProducts = async (req, res) => {
  try {
    const sortOption = req.query.sort || 'default';
    let sortCriteria;

    switch (sortOption) {
      case 'popularity':
        sortCriteria = { popularity: -1 };
        break;
      case 'price-low-high':
        sortCriteria = { salePrice: 1 };
        break;
      case 'price-high-low':
        sortCriteria = { salePrice: -1 };
        break;
      case 'rating':
        sortCriteria = { rating: -1 };
        break;
      case 'new-arrivals':
        sortCriteria = { createdAt: -1 };
        break;
      case 'alphabetical-a-z':
        sortCriteria = { productName: 1 };
        break;
      case 'alphabetical-z-a':
        sortCriteria = { productName: -1 };
        break;
      default:
        sortCriteria = { createdAt: -1 };
    }

    const products = await Product.find().sort(sortCriteria);
    res.json({ products });

  } catch (error) {
    console.error('Error fetching sorted products:', error);
    res.status(500).json({ message: 'An error occurred while sorting products.' });
  }
};

module.exports = {
    getShop,
    sortProducts,
    
}