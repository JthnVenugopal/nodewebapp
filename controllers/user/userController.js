const User = require("../../models/userSchema");

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

const signup = async (req,res)=>{
  const {name,email,phNumber,password,confirmPassword} = req.body;
  try{
       
      const newUser = new User({name,email,phNumber, password, confirmPassword});

      await newUser.save();

      return res.redirect("/signup")

  }catch(error){

     console.error("Error for save user",error) ;

     res.status(500).send("Internal server error")

  }
}

module.exports = {
  loadHomepage, 
  pageNotFound, 
  loadSignup, 
  loadShopping,
  signup,
}