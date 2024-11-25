const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
// const Order = require("../../models/orderSchema");
// const Wallet = require("../../models/walletSchema");
// const nodemailer = require("nodemailer");
// const bcrypt = require("bcrypt");
// const env = require("dotenv").config();
const session = require("express-session");

const userProfile = async (req,res) => {
  try {
    
      const userId = req.session.user;
      const userData = await User.findById(userId);
      
      res.render("profile", { 
        user: userData ,
        
      });

  } catch (error) {
    console.error("Error for retrieve profile data",error);
    res.redirect("pageNotFound")
  }
}

module.exports = {
  userProfile
}