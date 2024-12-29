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
//------------------------------------------------------------
function generateOtp(){
  return Math.floor(100000 + Math.random()*900000).toString();
}
//------------------------------------------------------------

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

//------------------------------------------------------------

const userProfile = async (req, res) => {
  try {
    console.log("--------------------userprofile---------------");
    // console.log("req.user:", req.user);
    // console.log("req.session:", req.session);

    const userId = req.session?.user?.id || req?.user?.id || req.session.user._id;
    if (!userId) {
      throw new Error("User ID not found in session or request.");
    }
    // console.log("userID:", userId);

    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const count = await Order.countDocuments();
    const totalPages = Math.ceil(count / limit);

    const userData = await User.findById(userId);
    const addressData = await Address.findOne({ userId: userId });
    const orders = await Order.find({ user: userId })
      .sort({ createdOn: -1 })
      .skip(skip)
      .limit(limit);

    res.render('profile', {
      user: userData,
      userAddress: addressData,
      orders,
      currentPage: page,
      totalPages,
      userDetails: userId
    });
  } catch (error) {
    console.error("Error retrieving profile data:", error.message);
    res.redirect("/pageNotFound");
  }
};
//------------------------------------------------------------
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
//------------------------------------------------------------
const UpdateProfile = async (req, res) => {
  try {
    const sessionUser = req.session.user;
    const googleUser  = req.user;
    const user = sessionUser || googleUser;

    const { name, email, phone } = req.body;
      
      const findUser = await User.findById(user.id);
      if (!findUser) {
          return res.redirect("/pageNotFound");
      }

      await User.updateOne(
          { _id: user.id },
          {
              $set: {
                  name,
                  email,
                  phone,
              }
          }
      );

      res.redirect("/userProfile");
  } catch (error) {
      console.error("Error in updating profile:", error);
      res.redirect("/pageNotFound");
  }
};
//------------------------------------------------------------
const changePassword = async (req,res) => {
  try {

    console.log("--------------------------changePassword-------------------------");
    

    const googleUser  = req.user; 
    const sessionUser  = req.session.user.id; 

    console.log("session-user : "+sessionUser)

    if(googleUser){
      res.json({message: "since you login using google id , You can't change password"})
    }else{
      res.render("change-password",{
        user : sessionUser
      });
    }
    
  } catch (error) {
      res.redirect("/pageNotFound")
  }
}
//------------------------------------------------------------
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

//------------------------------------------------------------
const updatePassword = async (req, res) => {
  try {
     
      const  userId  = req.session.user.id; // Assuming session contains user details

      const { currentPassword, newPassword, confirmPassword } = req.body;

      // Validate inputs
      if (!currentPassword || !newPassword || !confirmPassword) {
          return res.status(400).json({ message: "All fields are required." });
      }

      if (newPassword === currentPassword) {
          return res.status(400).json({ message: "New password cannot be the same as the current password." });
      }

      if (newPassword.length < 6) {
          return res.status(400).json({ message: "Password must be at least 6 characters long." });
      }

      if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: "Passwords do not match." });
      }

      const user = await User.findById(userId); 

      console.log(userId);
      console.log(user);
      
      
      // Ensure the user exists
      if (!user) {
          return res.status(404).json({ message: "User not found." });
      }

      // Verify the current password against the stored hashed password
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
          return res.status(400).json({ message: "Current password is incorrect." });
      }

      // Hash the new password
      const saltRounds = 10; // Recommended value
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update the user's password in the database
      user.password = hashedPassword;
      await user.save();

       // Destroy the session
    req.session.destroy(err => {
      if (err) {
        console.error("Error ending session:", err);
        return res.status(500).json({ message: "Could not end session." });
      }

      // Respond with success message and redirect URL
      return res.status(200).json({ message: "Password changed successfully.", redirectUrl: '/login' });
    });

    

  } catch (error) {

      console.error("Error updating password:", error.message);
      return res.status(500).json({ message: "Internal server error. Please try again." });

  }
};
//----------------------------------------------------------------------
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
//------------------------------------------------------------
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
//------------------------------------------------------------

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
//------------------------------------------------------------

const postNewPassword = async (req, res) => {
  try {
    const { newPass1, newPass2 } = req.body;
    const email = req.session.email;

    if (newPass1 === newPass2) {
      const passwordHash = await securePassword(newPass1);

      await User.updateOne({ email: email }, { $set: { password: passwordHash } });

      // End session
      req.session.destroy(err => {
        if (err) {
          console.error("Error ending session:", err);
          return res.status(500).json({ message: "Could not end session." });
        }

        // Respond with success message and redirect URL
        return res.status(200).json({ message: "Password changed successfully.", redirectUrl: "/login" });
      });
    } else {
      return res.status(400).json({ message: "Passwords do not match." });
    }
  } catch (error) {
    console.error("Error in updating password:", error);
    return res.status(500).json({ message: "An error occurred. Please try again." });
  }
};

//------------------------------------------------------------

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

//------------------------------------------------------------

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

//------------------------------------------------------------

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
//------------------------------------------------------------
const addAddress = async (req,res) => {
  try {
      
    const sessionUser = req.session.user;
    const googleUser  = req.user;
    const user = sessionUser.id || googleUser;

    const userData = await User.findById(user)

    console.log("userData - addAddress : ",userData)

      res.render("add-address",{
        user:userData,
      })
  } catch (error) {
      res.redirect("/pageNotFound")
  }
}
//------------------------------------------------------------

const showAddress = async (req, res) => {
  try {

    console.log("---------------------Show address----------------------------");
    
    // Validate session and Google users
    const sessionUser = req.session?.user; // Use optional chaining to avoid errors
    const googleUser = req?.user;

    const userData = sessionUser || googleUser;

    // Determine the user
    const user = sessionUser?.id || googleUser;

    if (!user) {
      console.error("User not found or not logged in.");
      return res.redirect("/login"); // Redirect to login if no user is found
    }

    // Fetch user address based on userId in Address schema
    const userAddress = await Address.find({ userId: user }) // Query Address collection using userId
      .select('address') // Select the "address" array field
      .lean(); // Convert Mongoose documents to plain JavaScript objects for easier manipulation

    if (!userAddress.length) {
      console.warn("No address found for user:", user);
      return res.render("show-address", {
        user: user,
        userAddress: [],
      });
    }

    // Restructure the address data
    const structuredAddress = userAddress.flatMap(item => item.address.map(addr => ({
      addressId: addr._id, // Include the address ID
      addressType: addr.addressType,
      name: addr.name,
      city: addr.city,
      landMark: addr.landMark,
      state: addr.state,
      pincode: addr.pincode,
      phone: addr.phone,
      altPhone: addr.altPhone,
      isDeliveryAddress: addr.isDeliveryAddress,
      

    })));

    // console.log('Structured User Address Backend:', structuredAddress);

    // Render address page
    res.render("show-address", {
      user : userData,
      userAddress: structuredAddress, // Pass structured data
    });

  } catch (error) {
    console.error("Error in showAddress:", error);
    res.redirect("/pageNotFound");
  }
};

//------------------------------------------------------------

const postAddAddress1 = async (req, res) => {
  try {
      
      const sessionUser = req.session.user;
      const googleUser  = req.user;
      const userId = sessionUser.id || googleUser;
      
      if (!userId) {
          return res.redirect("/login");
      }

      const userData = await User.findOne({ _id: userId });
      if (!userData) {
          return res.redirect("/pageNotFound");
      }

      // console.log("postAddAddres : userData - ",userData)

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

      res.redirect("/show-address");
  } catch (error) {
      console.error("Error adding address", error);
      res.status(500).send("Internal Server Error");
  }
}

//------------------------------------------------------------

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

  res.redirect("/show-address");
  } catch (error) {
      console.error("Error in delete address",error);
      res.redirect("/pageNotFound");
  }
}

//------------------------------------------------------------


const editAddress = async (req, res) => {
  try {
    console.log("----------------------editAddress----------------------------");

    const userId = req.session.user?.id || req.user?.id;
    const addressId = req.query.id;
    console.log("Address ID: " + addressId);
    console.log("User ID: " + userId);

    // Find the address by userId and addressId
    const userAddress = await Address.findOne({ userId: userId, 'address._id': addressId });
    
    if (!userAddress) {
      console.error("Address not found for userId: " + userId + " and addressId: " + addressId);
      return res.status(404).send("Address not found");
    }

    // Find the specific address within the user's addresses
    const selectedAddress = userAddress.address.id(addressId);
    console.log("Selected Address: ", selectedAddress);

    if (!selectedAddress) {
      console.error("Address not found for ID: " + addressId);
      return res.status(404).send("Address not found");
    }

    res.render("edit-address", {
      address: selectedAddress,
    });
  } catch (error) {
    console.error("Error in edit address", error);
    res.status(500).send("Internal Server Error");
  }
};

//------------------------------------------------------------

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

      res.redirect("/show-address");
      
  } catch (error) {
      console.error("Error in edit address",error);
      res.redirect("/pageNotFound");
  }
}

//------------------------------------------------------------

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
  postAddAddress1,
  deleteAddress,
  editAddress,
  postEditAddress,
  updatePassword,

}