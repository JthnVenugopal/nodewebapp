const User = require("../models/userSchema");

const userAuth = (req,res,next)=>{
    if(req.session.user){
        User.findById(req.session.user)
        .then(data=>{
            if(data && !data.isBlocked){
                next();
            }else{
                res.redirect("/login")
            }
        })
        .catch(error=>{
            console.log("Error in user auth middleware");
            res.status(500).send("Internal Server error")
        })
    }else{
        res.redirect("/login")
    }
}

//-----------------------------------------------------------

const adminAuth = (req,res,next)=>{
    User.findOne({isAdmin:true})
    .then(data=>{
        if(data){
            next()
        }else{
            res.redirect("/admin/login")
        }
    })
    .catch(error=>{
        console.log("Error in adminauth middleware",error);
        res.status(500).send("Internal Server Error")
    })
}

//-----------------------------------------------------------



const userIsAuthenticated = (req, res, next) => {
    try {
        // Avoid logging sensitive information
        // console.log('Session:', req.session); // Remove or limit what you log

        const isAuthenticated = req.isAuthenticated();
        const userCheck = req.session.user;

        if (isAuthenticated || userCheck) {
            return next(); 
        }

        // Set headers to prevent caching
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        
        return res.render('login'); // Render the login page
    } catch (error) {
        console.error("Error during authentication check:", error);
        res.status(500).send("Internal Server Error");
    }
};




//-----------------------------------------------------------
module.exports = {
    userAuth,
    adminAuth,
    userIsAuthenticated
   
}