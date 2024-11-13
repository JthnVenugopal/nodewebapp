const express = require('express');
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const {userAuth,adminAuth} = require("../middlewares/auth");
const customerController = require("../controllers/admin/customerController");

router.get("/pageerror",adminController.pageerror)
router.get("/login",adminController.loadLogin);
router.post("/login",adminController.login);
router.get("/",adminController.loadDashboard);
router.get("/logout",adminController.logout);

//customer management
router.get("/user",adminAuth,customerController.customerInfo);


module.exports = router;