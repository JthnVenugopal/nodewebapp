const express = require('express');
const router = express.Router();
const adminController = require("../controllers/admin/adminController");
const customerController = require("../controllers/admin/customerController");
const categoryController = require("../controllers/admin/categoryController" )
const {userAuth,adminAuth} = require("../middlewares/auth");
const multer = require("multer");
const storage = require("../helpers/multer");
const uploads = multer({storage:storage});
const brandController = require("../controllers/admin/brandController");
const productController = require("../controllers/admin/productController");
const orderController  = require("../controllers/admin/orderController");
const couponController = require("../controllers/admin/couponController")




router.get("/pageerror",adminController.pageerror);//Error management

router.get("/login",adminController.loadLogin)
router.post("/login",adminController.login);
router.get("/",adminAuth,adminController.loadDashboard);
router.get("/logout",adminController.logout)

//customer management
router.get("/users",adminAuth,customerController.customerInfo);
router.get("/blockCustomer",adminAuth,customerController.customerBlocked )
router.get("/unblockCustomer",adminAuth,customerController.customerunBlocked)

//category management
router.get("/category",adminAuth,categoryController.categoryInfo)
router.post("/addCategory",adminAuth,categoryController.addCategory);
router.post("/addCategoryOffer",adminAuth,categoryController.addCategoryOffer);
router.post("/removeCategoryOffer",adminAuth, categoryController.removeCategoryOffer);
router.get("/listCategory",adminAuth,categoryController.getListCategory);
router.get("/unlistCategory",adminAuth,categoryController.getUnlistCategory );
router.get("/editCategory",adminAuth,categoryController.getEditCategory);
router.post("/editCategory/:id", adminAuth, categoryController.editCategory);
router.delete("/deleteCategory/:id", adminAuth, categoryController.deleteCategory);

//Brand Management
router.get("/brands",adminAuth,brandController.getBrandPage);
router.post("/addBrand",adminAuth,uploads.single("image"),brandController.addBrand);
router.get("/blockBrand",adminAuth,brandController.blockBrand );
router.get("/unBlockBrand",adminAuth,brandController.unBlockBrand);
router.get("/deleteBrand",adminAuth,brandController.deleteBrand);

//Product Management
router.get("/addProducts",adminAuth,productController.getProductAddPage )
router.post("/addProducts",adminAuth,uploads.array("images",4),productController.addProducts);
router.get("/products",adminAuth,productController.getAllProducts);
router.post('/addProductOffer',adminAuth,productController.addProductOffer);
router.post("/removeProductOffer",adminAuth,productController.removeProductOffer);
router.get("/blockProduct",adminAuth,productController.blockProduct)
router.get("/unblockProduct",adminAuth,productController.unblockProduct);
router.get("/editProduct",adminAuth,productController.getEditProduct);
router.post("/editProduct/:id",adminAuth,uploads.array("images",4),productController.editProduct);
router.post("/deleteImage",adminAuth,productController.deleteSingleImage );
router.delete('/deleteProduct', adminAuth, productController.deleteProduct);

//order Management
router.get("/orders",adminAuth,orderController.getOrders);
router.post("/updateOrderStatus",adminAuth,orderController.updateOrderStatus);
router.get("/adminOrderDetails",orderController.getAdminOrderDetails);

//Coupon Management
router.get("/coupon",adminAuth,couponController.loadCoupon); 
router.post("/createCoupon",adminAuth,couponController.createCoupon);
router.get("/editCoupon",adminAuth,couponController.editCoupon);
router.post("/updateCoupon",adminAuth,couponController.updateCoupon);
router.post("/deleteCoupon", adminAuth, couponController.deleteCoupon);

//Sales Report Management
router.get("/salesReport",adminAuth,orderController.getSalesReport);

module.exports = router;