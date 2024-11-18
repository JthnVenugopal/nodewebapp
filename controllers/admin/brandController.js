const Brand = require("../../models/brandSchema");
const brand = require("../../models/brandSchema");
const product = require("../../models/productSchema");

//------------------------------------------------------------
const getBrandPage = async (req,res) => {

try {
  
const page = parseInt(req.query.page) || 1 ;
const limit = 4;
const skip = (page - 1) * limit;

const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
const totalBrands = await Brand.countDocuments();
const totalPages = Math.ceil(totalBrands / limit);
const reverseBrand = brandData.reverse();
res.render("brand",{
  data:reverseBrand,
  currentPage:page,
  totalPages:totalPages,
  totalBrands: totalBrands
})

} catch (error) {
  res.redirect("/pageerror")
}
}

//------------------------------------------------------------



const addBrand = async (req, res) => {
  try {
    const brandName = req.body.name;
    const findBrand = await Brand.findOne({ brandName });

    // Check if the brand already exists
    if (findBrand) {
      return res.status(400).send("Brand already exists."); // Ensure this line is reached
    }

    if (!req.file) {
      return res.status(400).send("Brand image is required.");
    }

    const image = req.file.filename;
    const newBrand = new Brand({
      brandName: brandName,
      brandImage: image,
    });

    await newBrand.save();
    res.status(200).send("Brand added successfully.");
  } catch (error) {
    console.error(error);
    res.status(500).send("An unexpected error occurred.");
  }
};
//------------------------------------------------------------

const blockBrand = async (req,res) => {
  try {
    
     const id = req.query.id;
     if (!id) {
      console.log("BrandID not available");
      }  

     await Brand.updateOne({_id:id}, {$set:{isBlocked:true}});
     res.redirect("/admin/brands");

  } catch (error) {
    console.error("Error Blocking Brand",error);
    return res.status(500).json({message:"An error occured while blocking the brand"})
  }
}

//------------------------------------------------------------

const unBlockBrand = async (req,res) => {
  try {
    const id = req.query.id;
    if(!id){
      console.log("BrandID not available");
    }

    await Brand.updateOne({_id:id},{$set:{isBlocked:false}});

    res.redirect("/admin/brands");

  } catch (error) {
    console.error("Error Unblocking Brand",error);
    return res.status(500).json({message:"An error occured while Unblocking the brand"})
  }
}

//------------------------------------------------------------

const deleteBrand = async (req,res) => {
  try {
    const id = req.query.id 
    
    if(!id){
      return res.status(400).redirect("/pageerror")
    }

    await Brand.deleteOne({_id:id})
    res.redirect("/admin/brands");

  } catch (error) {
    console.error("Error deleting brand", error);
    res.status(500).redirect("/pageerror");
  }
}



//------------------------------------------------------------



//------------------------------------------------------------

module.exports = {
  getBrandPage,
  addBrand,
  blockBrand,
  unBlockBrand,
  deleteBrand

}