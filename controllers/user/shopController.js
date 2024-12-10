
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Brand = require("../../models/brandSchema");
const Variant = require("../../models/variantSchema")

// const loadShoppingPage = async (req, res) => { 
//   try { 
//     const user = req.session.user || req.user;

//     console.log(req.body);

//     const products = await Product.find({ isBlocked: false }); 
    
//     res.render('shop', { 
//       user: user,
//       products: products,

//      }); } 

//     catch (error) {

//        console.error("Error loading shopping page:", error);
//         res.status(500).send("Internal Server Error"); 

//       } };

const loadShoppingPage = async (req, res) => { 
  try { 
    const user = req.session.user || req.user;

    console.log(req.body);
    
    // Use populate to get the variant associated with each product
    const products = await Product.find({ isBlocked: false }).populate('variant'); 
    
    res.render('shop', { 
      user: user,
      products: products,
    }); 
  } catch (error) {
    console.error("Error loading shopping page:", error);
    res.status(500).send("Internal Server Error"); 
  } 
};


 /////////////////////////////////////////////////////////////////

//   const filterProduct = async (req, res) => {
    
// };


//   const searchProducts = async (req, res) => {
   
//   };



//   const sortPrice = async (req, res) => {
   
//   };
  


//   const sortByAlpha  = async (req, res) => {
 
//   };
  


//   const  clearFilters = async (req, res) => {
  
//   };
  


  
//   const filterByPrice = async(req,res)=>{
   
//   }












  module.exports = {
    loadShoppingPage,
 

  }