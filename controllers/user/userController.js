const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const env = require("dotenv").config();

const pageNotFound = async (req,res) => {
  try{
    res.render("page-404")
  }catch(error){
    res.redirect("/pageNotFound")
  }
}


const loadHomepage = async (req,res) => {
  try{
    return res.render("home");
  }catch(error){
    console.log("Home page not found");
    res.status(500).send("Server error");
  }
}

const loadSignup = async (req,res) => {
  try{
    return res.render("signup");
  }catch(error){
    console.log("Signup page not loading", error);
    res.status(500).send('Server Error');

  }
}

const loadShopping = async (req,res) => {
  try  {
    return res.render('shop');
  }catch (error) {
    console.log("Shopping page is not loading", error);
    res.status(500).send("Server error")
  }
}

// const signup = async (req,res)=>{
//   const {name,email,phone,password,confirmPassword} = req.body;

  
//   try{
       
//       const newUser = new User({name,email,phone, password, confirmPassword});

//       await newUser.save();

//       return res.redirect("/signup")

//   }catch(error){

//      console.error("Error for save user",error) ;

//      res.status(500).send("Internal server error")

//   }
// }

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

const signup = async (req,res) => {
  try{
     const {name, email,phone, password, confirmPassword} = req.body;

     if(password !== confirmPassword ){
       return res.render("signup",{message:"Password do not match"});
     }

     const findUser = await User.findOne({email});
     if(findUser){
      return res.render("signup",{message:"User with this email already exist "});
     }

     const otp = generateOtp();

     const emailSent = await sendVerificationEmail(email,otp);
     if(!emailSent){
      return res.json("email.error")
     }
     req.session.userOTP = otp;
     req.session.userData = {email,password};

    //  res.render("verify-otp");
     console.log("OTP Sent",otp);

  } catch (error) {

    console.error("Error signing up", error);
    res.redirect("pageNotFound");

  }

}

module.exports = {
  loadHomepage, 
  pageNotFound, 
  loadSignup, 
  loadShopping,
  signup,
}