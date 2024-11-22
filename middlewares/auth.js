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




const userIsAuthenticated = (req, res, next) => {


    console.log('Session:', req.session);
    const isAuthenticated =req.session.user || req.isAuthenticated()  ;

    if (isAuthenticated) {
     
        return next(); 
    } else {
       
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
        return res.render('login'); // Render the login page
    }
}


// const adminAuthenticated = (req,res,next) => {
//     try {
        
//     } catch (error) {
        
//     }
// }

module.exports = {
    userAuth,
    adminAuth,
    userIsAuthenticated
   
}