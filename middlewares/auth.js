const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
    try {
        // Check if the user is authenticated using Passport
        const isAuthenticated = req.isAuthenticated();
        const userCheck = req.session.user;

        // If the user is authenticated or there's a user in the session
        if (isAuthenticated || userCheck) {
            // If userCheck exists, fetch the user data from the database
            if (userCheck) {
                User.findById(userCheck)
                    .then(data => {
                        // Check if user exists and is not blocked
                        if (data && !data.isBlocked) {
                            req.user = data; // Attach user data to the request object
                            return next(); // Proceed to the next middleware
                        } else {
                            return res.redirect("/login"); // Redirect to login if user is blocked
                        }
                    })
                    .catch(error => {
                        console.log("Error in user auth middleware", error);
                        return res.status(500).send("Internal Server Error");
                    });
            } else {
                return next(); // If authenticated but no userCheck, proceed
            }
        } else {
            // Set headers to prevent caching
            res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.set('Pragma', 'no-cache');
            res.set('Expires', '0');
            
            return res.render('login'); // Render the login page
        }
    } catch (error) {
        console.error("Error during authentication check:", error);
        res.status(500).send("Internal Server Error");
    }
};


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



// const userIsAuthenticated = (req, res, next) => {
//     try {
//         // Avoid logging sensitive information
//         // console.log('Session:', req.session); // Remove or limit what you log

//         const isAuthenticated = req.isAuthenticated();
//         const userCheck = req.session.user;

//         if (isAuthenticated || userCheck) {
//             return next(); 
//         }else{
//         // Set headers to prevent caching
//         res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
//         res.set('Pragma', 'no-cache');
//         res.set('Expires', '0');
        
//         return res.render('login'); // Render the login page
//         }

       
//     } catch (error) {
//         console.error("Error during authentication check:", error);
//         res.status(500).send("Internal Server Error");
//     }
// };




//-----------------------------------------------------------
module.exports = {
    userAuth,
    adminAuth,
    // userIsAuthenticated
   
}