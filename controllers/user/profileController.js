const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
// const Order = require("../../models/orderSchema");
// const Wallet = require("../../models/walletSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");

//------------------------------------------------------------

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error; // Re-throw the error to handle it in the calling function
  }
};

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

const getEditProfile = async (req,res) => {
  try {
      const user = req.session.user;
      res.render("edit-profile",{
        user : user,
        name : user.name,
        phone : user.phone,
        email : user.email
      });
  } catch (error) {
      res.redirect("/userProfile",{message:"Error while editing user profile"})
  }
}

const UpdateProfile = async (req, res) => {
  try {
      const data = req.body; 
      const user = req.session.user; 
      
      const findUser = await User.findById(user._id);
      if (!findUser) {
          return res.redirect("/pageNotFound");
      }

      await User.updateOne(
          { _id: user._id },
          {
              $set: {
                  name: data.name,
                  email: data.email,
                  phone: data.phone,
              }
          }
      );

      res.redirect("/userProfile");
  } catch (error) {
      console.error("Error in updating profile:", error);
      res.redirect("/pageNotFound");
  }
};

const changePassword = async (req,res) => {
  try {
      res.render("change-password")
  } catch (error) {
      res.redirect("/pageNotFound")
  }
}

const changePasswordValid = async (req,res) => {
  try {
      const {email} = req.body;
      const userExists = await User.findOne({email});
      if(userExists){
          const otp = generateOtp();
          const emailSent = await sendVerificationEmail(email,otp);
          if(emailSent){
              req.session.userOtp = otp;
              req.session.userData = req.body;
              req.session.email = email;
              res.render("change-password-otp");
              console.log("OTP:",otp);
          }else{
              res.json({success:false,message:"Failed to send OTP. Please try again"})
          }
      }else{
          res.render("change-password",{message:"User with this email does not exists"})
      }
  } catch (error) {
      console.log("Error in change password validation",error);
      res.redirect("/pageNotFound")
  }
}

const resendOtp = async (req,res) => {
  try {
      const otp = generateOtp();
      req.session.userOtp = otp;
      const email = req.session.email;
      console.log("Resending OTP to email:",email);
      const emailSent = await sendVerificationEmail(email,otp);
      if(emailSent){
          console.log("Resend OTP:",otp);
          res.status(200).json({success:true,message:"Resend OTP Successful"})
      }
  } catch (error) {
      console.error("Error in resending OTP",error);
      res.status(500).json({success:false,message:"Inernal Sever Error"})
  }
}

const verifyChangePassOtp = async (req,res) => {
  try {
      
      const enteredOtp = req.body.otp;
      if(enteredOtp === req.session.userOtp){
          res.json({success:true,redirectUrl:"/reset-password"});
      }else{
          res.json({success:false,message:"OTP not matching"});
      }

  } catch (error) {
      res.status(500).json({success:false,message:"An error occured. Please try again later"})
  }
}

const getResetPassPage = async (req,res) => {
  try {
      const user = req.session.user;

      res.render("reset-password",{
        user
      })
  } catch (error) {
      res.redirect("/pageNotFound")
  }
}

const postNewPassword = async (req,res) => {
  try {
      const {newPass1, newPass2} = req.body;
      const email = req.session.email;
      if(newPass1 === newPass2){
          const passwordHash = await securePassword(newPass1);
          await User.updateOne(
              {email:email},
              {$set:{password:passwordHash}}
          )
          res.redirect("/login");
      }else{
          res.render("reset-password",{message:"Password do not match"})
      }
  } catch (error) {
    console.error("Error in updating password:", error);
    res.redirect("/pageNotFound");
  }
}

const getForgotPassPage = async (req,res) => {
  try {
      res.render("forgot-password");
  } catch (error) {
      console.error(error)
      res.redirect("/pageNotfound");
  }
}

const forgotEmailValid = async (req,res) => {
  try {
      const {email} = req.body;
      const findUser = await User.findOne({email:email});
      if(findUser){
          const otp = generateOtp();
          const emailSent = await sendVerificationEmail(email,otp);
          if(emailSent){
              req.session.userOtp = otp;
              req.session.email = email;
              res.render("forgotPass-otp");   
              console.log("OTP:",otp);
          }else{
              res.json({success:false,message:"Failed to send OTP. Please try again"})
          }
      }else{
          res.render("forgot-password",{
              message:"User with this email does not exists"
          })
      }
  } catch (error) {
      res.redirect("/pageNotFound");
  }
}

const verifyForgotPassOtp = async (req,res) => {
  try {
      const enteredOtp = req.body.otp;
      if(enteredOtp === req.session.userOtp){
          res.json({
            success:true,
            redirectUrl:"/reset-password", 
            message:"Password changed Successfully"})
      }else{
          res.json({success:false,message:"OTP not matching"})
      }
  } catch (error) {
      res.status(500).json({success:false,message:"An error occured. Please try again"})
  }
}

const addAddress = async (req,res) => {
  try {
      const user = req.session.user;
      res.render("add-address",{user:user})
  } catch (error) {
      res.redirect("/pageNotFound")
  }
}

const showAddress = async (req,res) => {
  try {
    const user = req.session.user;

    const userAddress = await Address.findOne({
      userId:user._id,

    });

    if(!userAddress){
      res.render("add-address");
    }

    // console.log(userAddress.address)

    res.render("show-address",{
      user:user,
      userAddress:userAddress.address
    })
  } catch (error) {
    console.error(error);
    res.redirect("/pageNotFound");
  }
}

const postAddAddress = async (req, res) => {
  try {
      const userId = req.session.user;
      if (!userId) {
          return res.redirect("/login");
      }

      const userData = await User.findOne({ _id: userId });
      if (!userData) {
          return res.redirect("/pageNotFound");
      }

      const { addressType, name, city, landMark, state, pincode, phone, altPhone } = req.body;
      if (!addressType || !name || !city || !state || !pincode || !phone) {
          return res.status(400).send("Missing required fields");
      }

      const userAddress = await Address.findOne({ userId: userData._id });
      if (!userAddress) {
          const newAddress = new Address({
              userId: userData._id,
              address: [{ addressType, name, city, landMark, state, pincode, phone, altPhone }],
          });
          await newAddress.save();
      } else {
          userAddress.address.push({ addressType, name, city, landMark, state, pincode, phone, altPhone });
          await userAddress.save();
      }

      res.render("profile",{
        user : userId
      });
  } catch (error) {
      console.error("Error adding address", error);
      res.status(500).send("Internal Server Error");
  }
}


module.exports = {
  userProfile,
  changeEmail,
  changeEmailValid,
  verifyEmailOtp,
  updateEmail,
  getEditProfile,
  UpdateProfile,
  changePassword,
  changePasswordValid,
  verifyChangePassOtp,
  postNewPassword,
  getResetPassPage,
  resendOtp,
  getForgotPassPage,
  forgotEmailValid,
  verifyForgotPassOtp,
  addAddress,
  showAddress,
  postAddAddress

}