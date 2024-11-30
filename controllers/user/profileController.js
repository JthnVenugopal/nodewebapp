const User = require("../../models/userSchema");
const Address = require("../../models/addressSchema");
const Order = require("../../models/orderSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const passport = require("passport")
const GoogleStrategy = require("passport-google-oauth20").Strategy;

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


const userProfile = async (req, res) => {
  try {
   
    const googleUser  = req.user; 
    const sessionUser  = req.session.user; 
   
    const user = sessionUser  || googleUser ;

    // If user is not found, handle the error
    if (!user) {
      return res.redirect("pageNotFound");
    }

    // Optionally, you can fetch additional user data from the database if needed
    const userId = user._id; // Assuming user has an _id field
    const userData = await User.findById(userId);
    const order = await Order.find({ user: userId }); // Assuming the order schema has a user field
    // console.log(order);
    // console.log("User  ID:", userId);
    // console.log(userData);
    
    // Render the profile page with user data
    res.render("profile", { 
      user: userData || user,// Pass the user data to the template
      order,
    });
  } catch (error) {
    console.error("Error retrieving profile data", error);
    res.redirect("pageNotFound");
  }
};

const getEditProfile = async (req,res) => {
  try {
      const sessionUser = req.session.user;
      const googleUser  = req.user;
      const user = sessionUser || googleUser;

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

    const googleUser  = req.user; 
    const sessionUser  = req.session.user; 

    if(googleUser){
      res.json({message: "since you login using google id , You can't change password"})
    }else{
      res.render("change-password");
    }
    
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
      const googleUser  = req.user; 
      const sessionUser  = req.session.user; 
  
      if(googleUser){
        res.json({message: "since you login using google id , You can't change password"})
      }else{
        res.render("forgot-password");
      }

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
          console.log("Forgot password OTP : "+otp);
          
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
      
    const sessionUser = req.session.user;
    const googleUser  = req.user;
    const user = sessionUser || googleUser;

      res.render("add-address",{user:user})
  } catch (error) {
      res.redirect("/pageNotFound")
  }
}

const showAddress = async (req,res) => {
  try {
     const sessionUser = req.session.user;
     const googleUser  = req.user;
     const user = sessionUser || googleUser;

    const userAddress = await Address.findOne({
      userId:user._id,

    });
    // console.log(user._id)
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

      const sessionUser = req.session.user;
      const googleUser  = req.user;
      const userId = sessionUser || googleUser;
      
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

const deleteAddress = async (req,res) => {
  try {
      const addressId = req.query.id;
      const findAddress = await Address.findOne({"address._id":addressId});

      if(!findAddress){
          return res.status(404).send("Address not found");
      }

      await Address.updateOne({
          "address._id":addressId,
      },
      {
          $pull:{
              address:{
                  _id:addressId,
              }
          }
      }
  )

  res.redirect("/userProfile");
  } catch (error) {
      console.error("Error in delete address",error);
      res.redirect("/pageNotFound");
  }
}

const editAddress = async (req,res) => {
  try {
      const addressId = req.query.id;
      const user = req.session.user;
      const currAddress = await Address.findOne({
          "address._id": addressId,

      })

      if(!currAddress){
          return res.redirect("/pageNotFound");
      }

      const addressData = currAddress.address.find((item)=>{
          return item._id.toString()===addressId.toString();
      })

      if(!addressData){
          return res.redirect("/pageNotFound");
      }

      res.render("edit-address",{address:addressData,user:user})
  } catch (error) {
      console.error("Error in edit address",error);   
      res.redirect("/pageNotFound");
  }
}

const postEditAddress = async (req,res) => {
  try {
      const data = req.body;
      const addressId = req.query.id;
      const user = req.session.user;
      const findAddress = await Address.findOne({"address._id":addressId});
      if(!findAddress){
          res.redirect("/pageNotFound");
      }
      await Address.updateOne(
          {"address._id":addressId},
          {$set:{
              "address.$":{
                  _id:addressId,
                  addressType:data.addressType,
                  name:data.name,
                  city:data.city,
                  landMark:data.landMark,
                  state:data.state,
                  pincode:data.pincode,
                  phone:data.phone,
                  altPhone:data.altPhone
              }
          }}
      )

      res.redirect("/userProfile")
  } catch (error) {
      console.error("Error in edit address",error);
      res.redirect("/pageNotFound");
  }
}


module.exports = {
  userProfile,
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
  postAddAddress,
  deleteAddress,
  editAddress,
  postEditAddress,
}