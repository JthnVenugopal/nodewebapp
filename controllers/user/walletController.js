const User = require('../../models/userSchema');
const Address = require('../../models/addressSchema');
const Cart = require('../../models/cartSchema');
const Product = require("../../models/productSchema");
const Orders = require('../../models/orderSchema');
const Wallet = require('../../models/walletSchema')
const bcrypt = require('bcrypt');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');


const getWalletPage = async (req, res) => {
  try {
      console.log('--------getWalletPage-----------');
      const userData = req.session.user || req.user;
      const userId = req.session.user.id || req.session.user._id;
      
      const user = await User.findById(userId).populate('wallet');
      console.log(user.wallet)
      
      res.render('wallet', { user: user , });
  } catch (error) {
      console.error(error);
      res.status(500).send("Error occurred while loading wallet page.");
  }
};



module.exports = {
  getWalletPage,

}