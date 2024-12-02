
const Product = require("../../models/productSchema")
const category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Category = require("../../models/categorySchema");
const { name } = require("ejs");
//---------------------------------------------------------------------
const getProductAddPage = async (req,res) => {
    try {
        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false});
        res.render("product-add",{
            cat:category,
            brand:brand,

        });
    } catch (error) {
        console.log(error);
        res.redirect("/pageerror")
    }
}
//---------------------------------------------------------------------
// const addProducts = async (req, res) => {
//     try {
//         const products = req.body;

//         // Validate required fields
//         if (!products.productName || !products.description || !products.brand || !products.category || !products.regularPrice || !products.quantity || !products.color) {
//             return res.status(400).json("All fields are required.");
//         }

//         const productExists = await Product.findOne({ productName: products.productName });
//         if (productExists) {
//             return res.status(400).json("Product already exists, please try with another name");
//         }

//         const images = [];
//         if (req.files && req.files.length > 0) {
//             for (let i = 0; i < req.files.length; i++) {
//                 const originalImagePath = req.files[i].path;
//                 const resizedImagePath = path.join("public", "uploads", "re-image", `resized-${req.files[i].filename}`);

//                 await sharp(originalImagePath)
//                     .resize({ width: 440, height: 440 })
//                     .toFile(resizedImagePath)
//                     .catch(err => console.error("Sharp error:", err));
                  
    
                
//                 images.push(`resized-${req.files[i].filename}`);
//                 console.log(req.files); // Log the uploaded files
//             }
//         }

//         const categoryId = await Category.findOne({ name: products.category });
//         if (!categoryId) {
//             return res.status(400).json("Invalid category name");
//         }

//         const newProduct = new Product({
//             productName: products.productName,
//             description: products.description,
//             brand: products.brand,
//             category: categoryId._id,
//             regularPrice: products.regularPrice,
//             salePrice: products.salePrice,
//             createdAt: new Date(),
//             quantity: products.quantity,
//             size: products.size,
//             color: products.color,
//             productImages: images,
//             status: "Available",
//         });

//         await newProduct.save();
//         return res.redirect('/admin/addProducts'); // Consider adding a success message

//     } catch (error) {
//         console.error("Error adding product", error);
//         res.redirect('/admin/pageerror'); // Consider sending a more specific error message
//     }
// }

// const addProducts = async (req,res) => {
//     try {
//         const products = req.body;
//         const productExists = await Product.findOne({
//             productName:products.productName
//         })

//         if(!productExists){
//             const images = [];
            
//             if (req.files && req.files.length > 0) {
//                 for (let i = 0; i < req.files.length; i++) {
//                     const originalImagePath = req.files[i].path;
                    
//                     const resizedImagePath = path.join("public", "uploads", "re-image", `resized-${req.files[i].filename}`);
                    
//                     await sharp(originalImagePath)
//                         .resize({ width: 440, height: 440 })
//                         .toFile(resizedImagePath); 
                    
//                     images.push(`resized-${req.files[i].filename}`);
//                 }
//             }
            

//             const categoryId = await Category.findOne({name:products.category})

//             if(!categoryId){
//                 return res.status(400).json("Invalid category name")
//             }

//             const newProduct = new Product({
//                 productName:products.productName,
//                 description:products.description,
//                 brand:products.brand,
//                 category:categoryId._id,
//                 regularPrice:products.regularPrice,
//                 salePrice:products.salePrice,
//                 createdAt:new Date(),
//                 quantity:products.quantity,
//                 color:products.color,
//                 productImages:images,
//                 status:"Available",
//             })

//             await newProduct.save();
//             return res.redirect('/admin/addProducts')

//         }else{
//             return res.status(400).json("Product already exists, please try with another name");
//         }

//     } catch (error) {
//         console.error("Error adding product",error)
//         res.redirect('/admin/pageerror')
//     }
// }



const addProducts = async (req, res) => {
    try {
        const products = req.body;

        const productExists = await Product.findOne({
            productName: products.productName,
        });

        if (!productExists) {
            const images = [];

            if (req.files && req.files.length > 0) {
                for (let i = 0; i < req.files.length; i++) {
                    const originalImagePath = req.files[i].path;

                    const resizedImagePath = path.join(
                        "public",
                        "uploads",
                        "re-image",
                        req.files[i].filename
                    );
                    await sharp(originalImagePath)
                        .resize({ width: 500, height: 500 })
                        .toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                }
            }

            const categoryId = await Category.findOne({ name: products.category }); // no need to access `.name`
         
            if (!categoryId) {
                       return res.status(400).json("Invalid category name");
             }

            const newProduct = new Product({
                productName: products.productName,
                description: products.description,
                brand: products.brand,
                category: categoryId,
                regularPrice: products.regularPrice,
                salePrice: products.salePrice,
                createdOn: new Date(),
                quantity: products.quantity,
                color: products.color,
                productImage: images,
                status: "Available",
            });

            await newProduct.save();
             res.redirect('/products')
            
        } else {
            return res.status(400).json("Product already exists, please try with another name");
        }
    } catch (error) {
        console.error("Error saving product", error);
        // return res.status(500).json({ message: "Internal server error" });
        return res.redirect('/admin/pageerror')
    }
};



 
  


//---------------------------------------------------------------------


// const getAllProducts = async (req,res) => {
//     try {
        
//         const search = req.query.search || "";
//         const page = req.query.page || 1;
//         const limit = 4;

//         const productData = await Product.find({
//             $or:[
                
//                 {productName:{$regex:new RegExp(".*"+search+".*","i")}},
//                 {brand:{$regex:new RegExp(".*"+search+".*","i")}},


//             ],
//         }).limit(limit*1)
//         .skip((page-1)*limit)
//         .populate("category","name")
//         .exec();

//         const count = await Product.find({
//             $or:[
//                 {productName:{$regex:new RegExp(".*"+search+".*","i")}},
//                 {brand:{$regex:new RegExp(".*"+search+".*","i")}},
//             ]
//         }).countDocuments();

//         const category = await Category.find({isListed:true});
//         const brand = await Brand.find({isBlocked:false});

//         if(category && brand){
//             res.render("products",{
//                 data:productData,
//                 currentPage:page,
//                 totalPages:Math.ceil(count / limit),
//                 cat:category,
//                 brand:brand,
//             })
            
//         }else{
//             res.render("page-404");
//         }

//     } catch (error) {
//         console.log(error);
//         res.redirect("/admin/pageerror");
//     }
// }

const getAllProducts = async (req, res) => {
  try {
    const search = req.query.search || "";
    const page = req.query.page || 1;
    const limit = 4;

    // Build the search query
    const searchQuery = {
      $or: [
        { productName: { $regex: new RegExp(search, "i") } },
      ],
    };

    if (search) {
      const brands = await Brand.find({ brandName: { $regex: new RegExp(search, "i") } });
      if (brands.length > 0) {
        searchQuery.$or.push({ brand: { $in: brands.map(brand => brand._id) } });
      }
    }

    // Fetch products based on the constructed query
    const productData = await Product.find(searchQuery)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("category", "name")
      .populate("brand", "brandName") // Assuming 'brand' is a reference to the Brand model
      .exec();

    // Get the total count of matching documents
    const count = await Product.countDocuments(searchQuery);

    const category = await Category.find({ isListed: true });
    const brand = await Brand.find({ isBlocked: false });

    if (category && brand) {
      res.render("products", {
        data: productData,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        cat: category,
        brand: brand,
      });
    } else {
      res.render("page-404");
    }
  } catch (error) {
    console.log(error);
    res.redirect("/admin/pageerror");
  }
};



//-------------------------------------------------------------------------

const addProductOffer = async (req,res) => {
    try {
        
        const {productId,percentage} = req.body;
        const findProduct = await Product.findOne({_id:productId});
        const findCategory = await Category.findOne({_id:findProduct.category});
        if(findCategory.categoryOffer > percentage){
            return res.json({status:false,message:"This product category already has a category offer"})
        }
        findProduct.salePrice = findProduct.salePrice - Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer =  parseInt(percentage);
        await findProduct.save();
        findCategory.categoryOffer = 0;
        await findCategory.save();
        res.json({status:true})

    } catch (error) {
        res.redirect("/admin/pageerror");
        console.log(error);
        res.status(500).json({status:false,message:"Internal Server Error"})
    }
}

//---------------------------------------------------------------------------
const removeProductOffer = async (req,res) => {
    try {
        const {productId} = req.body;
        const findProduct = await Product.findOne({_id:productId});
        const percentage = findProduct.productOffer;
        findProduct.salePrice = findProduct.salePrice + Math.floor(findProduct.regularPrice*(percentage/100));
        findProduct.productOffer = 0;
        await findProduct.save();
        res.json({status:true});

    } catch (error) {
        console.log(error);
        res.redirect("/admin/pageerror");
    }
}

//-------------------------------------------------------------------------------

const blockProduct = async (req,res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/products")
    } catch (error) {
        res.redirect("/admin/pageerror")
        console.log(error);
    }
}

//-------------------------------------------------------------------------------

const unblockProduct = async (req,res) => {
    try {
        let id = req.query.id;
        await Product.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/products");
    } catch (error) {
        res.redirect("/admin/pageerror");
    }
}

//-----------------------------------------------------------------------------------

const getEditProduct = async (req,res) => {
    try {
        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({});
        const brand = await Brand.find({});
        res.render("edit-product",{
            product:product,
            cat:category,
            brand:brand,
        })
    } catch (error) {
        res.redirect("/admin/pageerror");
    }
}

//----------------------------------------------------------------------------------

const editProduct = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findOne({ _id: id });
        const data = req.body;

        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id },
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try with another name" });
        }

        const images = req.files && req.files.length > 0 ? req.files.map(file => file.filename) : [];
    

        const updateFields = {
            productName: data.productName,
            description: data.descriptionData,
            brand: data.brand,
            category: product.category,
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            size: data.size,
            color: data.color,
        };

        if (images.length > 0) {
            updateFields.$push = { productImages: { $each: images } };
        }

        await Product.findByIdAndUpdate(id, updateFields, { new: true });
        res.redirect("/admin/products");

    } catch (error) {
        console.error(error);
        res.redirect("/admin/pageerror");
    }
};

//------------------------------------------------------------------

const deleteSingleImage = async (req,res) => {
    try {
        const {imageNameToServer,productIdToServer} = req.body;
        const product = await Product.findByIdAndUpdate(productIdToServer,{$pull:{productImages:imageNameToServer}});
        const imagePath = path.join("public","uploads","re-image","imageNameToServer");
        if(fs.existsSync(imagePath)){
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        }else{
            console.log(`Image ${imageNameToServer} not found`);
        }

        res.send({status:true});
    } catch (error) {
        res.redirect("/admin/pageerror");
    }
}

//-----------------------------------------------------------------

const deleteProduct = async (req, res) => {
    try {
      const id = req.query.id;
      const deletedProduct= await Product.findByIdAndDelete(id);
  
      if (deletedProduct) {
        res.json({ status: true, message: 'Product successfully deleted' });
      } else {
        res.status(404).json({ status: false, message: 'Product not found' });
      }
    } catch (error) {
      res.status(500).json({ status: false, message: 'Internal server error' });
    }
};

//------------------------------------------------------------------------

const getSize = async (req,res) => {
    try {
        res.render('size')
    } catch (error) {
        
    }
}



module.exports = {
    getProductAddPage,
    addProducts,
    getAllProducts,
    addProductOffer,
    removeProductOffer,
    blockProduct,
    unblockProduct,
    getEditProduct,
    editProduct,
    deleteSingleImage,
    deleteProduct,
    getSize
    
}