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


const userCheck = async (req, res, next) => {
    try {
        if (req.session.user) {
            // User is logged in, redirect to home page
            return res.redirect('/home');
        }
        next();
}catch(error){

}
}

// const userIsAuthenticated = (req, res, next) => {
//     if (req.session.user) {
//         // User is authenticated, allow the request to proceed
//         return next(); // Call next() to proceed to the next middleware/route
//     } else {
//         // User is not authenticated, set cache control headers
//         res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//         res.set('Pragma', 'no-cache');
//         res.set('Expires', '0');
//         return res.render('login'); // Render the login page
//     }
// }

module.exports = {
    userAuth,
    adminAuth,
    userCheck,
    // userIsAuthenticated
}