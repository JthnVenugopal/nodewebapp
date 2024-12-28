const Razorpay = require('razorpay'); 
const env = require("dotenv").config();

const razorpayInstance = new Razorpay({  
    key_id: process.env.RAZOR_PAY_KEY_ID,
    key_secret: process.env.RAZOR_PAY_KEY_SECRET
});

module.exports = razorpayInstance;