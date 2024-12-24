const User = require("../models/userSchema");

const adminAuth = (req, res, next) => {
  User.findOne({ isAdmin: true })
    .then(data => {
      if (data) {
        next();
      } else {
        res.redirect("/admin/login");
      }
    })
    .catch(error => {
      console.log("Error in adminauth middleware", error);
      res.status(500).send("Internal Server Error");
    });
};

const userIsAuthenticated = (req, res, next) => {
  try {
    const isAuthenticated = req.isAuthenticated();
    const userCheck = req.session.user;

    if (isAuthenticated || userCheck) {
      // Set headers to prevent caching
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      return next();
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

module.exports = {
  adminAuth,
  userIsAuthenticated
};
