const express =  require("express");
const router = express.Router();
const userController = require("../controllers/user/userController");

router.get("/pageNotFound",userController.pageNotFound);

router.get("/signup", userController.loadSignup);

//path to join home page 
router.get("/", userController.loadHomepage);


module.exports = router;