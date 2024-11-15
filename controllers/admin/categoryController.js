const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");

const categoryInfo = async (req,res)=>{

  try {
    const page =  parseInt(req.query.page) || 1 ;
    const limit = 4;
    const skip = (page-1)*limit;

    const categoryData = await Category.find({})
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit);

    const totalCategories = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategories / limit);
    res.render("category",{
      cat:categoryData,
      currentPage:page,
      totalPages:totalPages,
      totalCategories:totalCategories
    })
  } catch (error) {
    console.error(error);
    res.redirect("/pageerror")
  }

}

//-------------------------------------------------------------

const addCategory =  async (req,res) =>{
  const {name,description} = req.body;

  try {
    const existingCategory = await Category.findOne({name});// checking that category already exist or not 
    if(existingCategory){
      return res.status(400).json({error:"Category already exists"});// if there passing error
    }

    const newCategory = new Category({//  if not exists creating a new category and saving inside DB
      name,
      description,
    })
    await newCategory.save()//saving in DB
    return res.json({message:"Category Added Successfully"})
  } catch (error) {
    return res.status(500).json({error:"Internal Server error"})
  }
}

//------------------------------------------------------------

const addCategoryOffer = async (req, res) => {
  try {
    const percentage = parseInt(req.body.percentage);
    const categoryId = req.body.categoryId;

    // Check if percentage is a valid number
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      return res.status(400).json({ status: false, message: "Invalid percentage value" });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    const products = await Product.find({ category: category._id });
    const hasProductOffer = products.some((product) => product.productOffer > percentage);
    if (hasProductOffer) {
      return res.json({ status: false, message: "Products within this category already have product offer" });
    }

    // Set the category offer
    await Category.updateOne({ _id: categoryId }, { $set: { categoryOffer: percentage } });

    // Reset product offers and sale prices
    for (const product of products) {
      product.productOffer = 0;
      product.salePrice = product.regularPrice; // Reset sale price
      await product.save();
    }

    res.json({ status: true, message: "Offer added successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//-----------------------------------------------------------

const removeCategoryOffer = async (req, res) => {
  try {
    const categoryId = req.body.categoryId;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ status: false, message: "Category not found" });
    }

    const percentage = category.categoryOffer;
    const products = await Product.find({ category: category._id });

    if (products.length > 0) {
      for (const product of products) {
        // Adjust the sale price based on the category offer
        product.salePrice += Math.floor(product.regularPrice * (percentage / 100));
        product.productOffer = 0; // Reset product offer
        await product.save();
      }
    }

    // Reset the category offer
    category.categoryOffer = 0;
    await category.save();

    res.json({ status: true, message: "Offer removed successfully" });
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

//------------------------------------------------------------

module.exports = {
  categoryInfo,
  addCategory,
  addCategoryOffer,
  removeCategoryOffer
}