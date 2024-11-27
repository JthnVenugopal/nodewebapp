// const User = require("../../models/userSchema");
// const Address = require("../../models/addressSchema");
// // const Order = require("../../models/orderSchema");
// // const Wallet = require("../../models/walletSchema");
// // const nodemailer = require("nodemailer");
// // const bcrypt = require("bcrypt");
// // const env = require("dotenv").config();
// const session = require("express-session");

// const userProfile = async (req,res) => {
//   try {
    
//       const userId = req.session.user;
//       const userData = await User.findById(userId);
      
//       res.render("profile", { 
//         user: userData ,
        
//       });

//   } catch (error) {
//     console.error("Error for retrieve profile data",error);
//     res.redirect("pageNotFound")
//   }
// }

// module.exports = {
//   userProfile
// }


const User = require("../../models/userSchema");
// const Address = require("../../models/addressSchema");
// const Order = require("../../models/orderSchema");
// const Wallet = require("../../models/walletSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");

function generateOtp(){
  return Math.floor(100000 + Math.random()*900000).toString();
}

async function sendVerificationEmail(email,otp){
  try{
     
       const transporter = nodemailer.createTransport({
          service:"gmail",
          port:587,
          secure: false,
          requireTLS:true,
          auth:{
            user:process.env.NODEMAILER_EMAIL,
            pass:process.env.NODEMAILER_PASSWORD
          }

       });

       const info = await transporter.sendMail({
        from:process.env.NODEMAILER_EMAIL,
        to:email,
        subject:"Verify Your Account",
        text:`Your verification code is ${otp}`,
        html:`<b>Your OTP : ${otp}</b>`,

       });

       return info.accepted.length > 0

  }catch(error){
        console.error("Error sending email",error);
        return false;
  }
}

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

const changeEmail = async (req,res) => {
  try {
    const user = req.session.user;
    res.render("change-email", {
      user,
    })

  } catch (error) {
    
     res.redirect("/pageNotFound")

  }
}

const changeEmailValid = async (req,res) => {
  try {
    const email = req.body.email;

    const userExists = await User.findOne({email});

    if(userExists){
      const otp = generateOtp();
      const emailSent = await sendVerificationEmail(email,otp);
      if(emailSent){
        
        req.session.userOtp = otp;
        req.session.userData = req.body;
        req.session.email = email;

        res.render("change-email-otp");
        console.log("Email sent : ", email);
        console.log("OTP : ", otp);

      }else{
        res.json("email-error")
      }
    }else{
      res.render("change-email", {
        message : "User with this email not exist!"
      })
    }

  } catch (error) {
    
     res.redirect("/pageNotFound")

  }
}

const verifyEmailOtp = async (req,res) => {
  try {
    
     const enteredOtp = req.body.otp;
     if(enteredOtp === req.session.userOtp){
        req.session.userData = req.body.userData;
        res.render("new-email", {
          userData : req.session.userData,
        })
     }else{
      res.render("change-email-otp",{
        message : "Invalid OTP",
        userData : req.session.userData
      })
     }

  } catch (error) {
    res.redirect("/pageNotFound")
  }
}

const updateEmail = async (req,res) => {
  try {
    
     const newEmail = req.body.newEmail;
     const userId = req.session.user;

     await User.findByIdAndUpdate(userId,{email:newEmail});

     res.redirect("/userProfile");


  } catch (error) {
    res.redirect("/pageNotFound")
  }
}


module.exports = {
  userProfile,
  changeEmail,
  changeEmailValid,
  verifyEmailOtp,
  updateEmail
}