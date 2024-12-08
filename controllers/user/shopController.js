
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const User = require("../../models/userSchema");
const Brand = require("../../models/brandSchema")

const loadShoppingPage = async (req,res) => {
   
  try {
    res.render('shop')
  } catch (error) {
    
  }

  }

  
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