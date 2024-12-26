
const Product = require("../../models/productSchema")
const category = require("../../models/categorySchema");
const Brand = require("../../models/brandSchema");
const User = require("../../models/userSchema");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const Category = require("../../models/categorySchema");
const Variant = require("../../models/variantSchema");
const { name } = require("ejs");
const mongoose = require("mongoose");
//---------------------------------------------------------------------
const getProductAddPage = async (req,res) => {
    try {
        const category = await Category.find({isListed:true});
        const brand = await Brand.find({isBlocked:false});
        const product = await Product.find({isBlocked:false});



        res.render("product-add",{
            cat:category,
            brand:brand,
            product:product

        });
    } catch (error) {
        console.log(error);
        res.redirect("/pageerror")
    }
}

//--------------------------------------------------------------------------

// const addProducts = async (req, res) => {

//     try {
      
//       const products = req.body;
  
//       // Check if the product already exists
//       const productExists = await Product.findOne({ productName: products.productName });
//       if (productExists) {
//         return res.status(400).json("Product already exists, please try with another name");
//       }
  
//       // Process image uploads
//       const images = [];
//       if (req.files && req.files.length > 0) {
//         for (let i = 0; i < req.files.length; i++) {
//           if (req.files[i].path && req.files[i].filename) {
//             const originalImagePath = req.files[i].path;
//             const resizedImagePath = path.join("public", "uploads", "product-images", req.files[i].filename);
//             await sharp(originalImagePath).resize({ width: 500, height: 500 }).toFile(resizedImagePath);
//             images.push(req.files[i].filename);
//           } else {
//             return res.status(400).json("Invalid file upload");
//           }
//         }
//       }
  
//       // Validate and find category
//       const category = await Category.findOne({ name: products.category });
//       if (!category) {
//         return res.status(400).json("Invalid category name");
//       }
  
//       // Validate and find brand
//       const brand = await Brand.findOne({ brandName: products.brand });
//       if (!brand) {
//         return res.status(400).json("Invalid brand name");
//       }
  
//       // Create new product
//       const newProduct = new Product({
//         productName: products.productName,
//         description: products.description,
//         brand: brand._id,
//         category: category._id,
//         regularPrice: products.regularPrice,
//         salePrice: products.salePrice,
//         quantity: products.quantity || 0,
//         color: products.color,
//         productImages: images,
//         status: "Available",
//       });
  
//       await newProduct.save();
//       return res.redirect('/admin/addProducts');
//     } catch (error) {
//       console.error("Error saving product", error.message);
//       return res.redirect('/admin/pageerror');
//     }
//   };

// const addProducts = async (req, res) => {
//     try {
//         const products = req.body;

//         console.log(req.body); // Log the incoming request body for debugging

//         // Check if all required fields are present
//         if (!products.productName || !products.description || !products.brand || !products.category || 
//             !products.regularPrice || !products.salePrice || !products.quantity || !products.color) {
//             return res.status(400).json("All fields are required.");
//         }

//         // Check if the product already exists
//         const productExists = await Product.findOne({ productName: products.productName });
//         if (productExists) {
//             return res.status(400).json("Product already exists, please try with another name");
//         }

//         // Process image uploads
//         const images = [];
//         if (req.files && req.files.length > 0) {
//             for (let i = 0; i < req.files.length; i++) {
//                 if (req.files[i].path && req.files[i].filename) {
//                     const originalImagePath = req.files[i].path;
//                     const resizedImagePath = path.join("public", "uploads", "product-images", req.files[i].filename);
//                     await sharp(originalImagePath).resize({ width: 500, height: 500 }).toFile(resizedImagePath);
//                     images.push(req.files[i].filename);
//                 } else {
//                     return res.status(400).json("Invalid file upload");
//                 }
//             }
//         }

//         // Validate and find category
//         const category = await Category.findOne({ name: products.category });
//         if (!category) {
//             return res.status(400).json("Invalid category name");
//         }

//         // Validate and find brand
//         const brand = await Brand.findOne({ brandName: products.brand });
//         if (!brand) {
//             return res.status(400).json("Invalid brand name");
//         }

//         const variant = await Variant.findOne({})

//         // Create new product
//         const newProduct = new Product({
//             productName: products.productName,
//             description: products.description,
//             brand: brand._id,
//             category: category._id,
//             variant: { // Include the variant object
//                 regularPrice: products.regularPrice, // Access directly
//                 salePrice: products.salePrice, // Access directly
//                 quantity: products.quantity || 0, // Access directly
//                 color: products.color, // Access directly
//                 productImages: images,
//                 size: products.sizes ,
//                 variantCode : products.variantCode , 
//             },
//             status: "Available",
//         });

//         await newProduct.save();
//         return res.redirect('/admin/addProducts');
//     } catch (error) {
//         console.error("Error saving product", error.message);
//         return res.redirect('/admin/pageerror');
//     }
// };

const addProducts = async (req, res) => {
    try {
        const products = req.body;

        console.log(req.body); // Log the incoming request body for debugging

        // Check if all required fields are present
        if (!products.productName || !products.description || !products.brand || !products.category || 
            !products.regularPrice || !products.salePrice || !products.quantity || !products.color) {
            return res.status(400).json("All fields are required.");
        }

        // Check if the product already exists
        const productExists = await Product.findOne({ productName: products.productName });
        if (productExists) {
            return res.status(400).json("Product already exists, please try with another name");
        }

        // Process image uploads
        const images = [];
        if (req.files && req.files.length > 0) {
            for (let i = 0; i < req.files.length; i++) {
                if (req.files[i].path && req.files[i].filename) {
                    const originalImagePath = req.files[i].path;
                    const resizedImagePath = path.join("public", "uploads", "product-images", req.files[i].filename);
                    await sharp(originalImagePath).resize({ width: 500, height: 500 }).toFile(resizedImagePath);
                    images.push(req.files[i].filename);
                } else {
                    return res.status(400).json("Invalid file upload");
                }
            }
        }

        // Validate and find category
        const category = await Category.findOne({ name: products.category });
        if (!category) {
            return res.status(400).json("Invalid category name");
        }

        // Validate and find brand
        const brand = await Brand.findOne({ brandName: products.brand });
        if (!brand) {
            return res.status(400).json("Invalid brand name");
        }

        // Create new variant
        const newVariant = new Variant({
            variantCode: products.variantCode,
            regularPrice: products.regularPrice,
            salePrice: products.salePrice,
            quantity: products.quantity || 0,
            color: products.color,
            productImages: images,
            size: products.sizes,
        });

        await newVariant.save(); // Save the variant to the database

        // Create new product
        const newProduct = new Product({
            productName: products.productName,
            description: products.description,
            brand: brand._id,
            category: category._id,
            variant: newVariant._id, // Link the variant to the product
            status: "Available",
        });

        await newProduct.save();
        return res.redirect('/admin/addProducts');
    } catch (error) {
        console.error("Error saving product", error.message);
        return res.redirect('/admin/pageerror');
    }
};
  
  //------------------------------------------------------------------------

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

    // const {brandName , brandImage , } = brand;

       const [variant] = productData ;


    

    if (category && brand) {
      res.render("products", {
        data : productData,
        currentPage : page,
        totalPages : Math.ceil(count / limit),
        cat : category,
        brand : brand,
        variant : variant,

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
        console.log("----------------getEditProduct----------------------");
        
        const id = req.query.id;
        const product = await Product.findOne({_id:id});
        const category = await Category.find({});
        const brand = await Brand.find({});

        const { variant } = product;

        console.log("variant"+variant);

        const variantData = await Variant.findById(variant);

        console.log("variant data : "+variantData);


        console.log("--------------------------------------");

        res.render("edit-product",{
            product:product,
            cat:category,
            brand:brand,
            variant : variantData ,
        })
    } catch (error) {
        res.redirect("/admin/pageerror");
    }
}

//----------------------------------------------------------------------------------




const editProduct = async (req, res) => {
    try {
        console.log("------------------editProduct-------------------");
        const id = req.params.id;
        const data = req.body;

        console.log("req.body ---------------", req.body);

        // Fetch brand ObjectId
        const brand = await Brand.findOne({ brandName: data.brand });
        if (!brand) {
            return res.status(400).json({ error: "Invalid brand." });
        }

        // Fetch category ObjectId
        const category = await Category.findOne({ name: data.category });
        if (!category) {
            return res.status(400).json({ error: "Invalid category." });
        }

        // Check if the product name already exists (excluding the current product)
        const existingProduct = await Product.findOne({
            productName: data.productName,
            _id: { $ne: id }
        });

        if (existingProduct) {
            return res.status(400).json({ error: "Product with this name already exists. Please try with another name." });
        }

        // Fetch the existing product
        const productToUpdate = await Product.findById(id);
        if (!productToUpdate) {
            return res.status(404).json({ error: "Product not found." });
        }

        // Fetch the existing variant
        const variantToUpdate = await Variant.findById(productToUpdate.variant);
        if (!variantToUpdate) {
            return res.status(404).json({ error: "Variant not found." });
        }

        // Prepare the variant update fields
        const variantUpdateFields = {
            regularPrice: data.regularPrice,
            salePrice: data.salePrice,
            quantity: data.quantity,
            color: data.color,
            variantCode: data.variantCode,
            productImages: variantToUpdate.productImages, // Start with existing images
            size: JSON.parse(data.sizes) // Parse sizes
        };

        // Process image uploads
        if (req.files && req.files.length > 0) {
            variantUpdateFields.productImages.push(...req.files.map(file => file.filename));
        }

        // Update the variant
        await Variant.findByIdAndUpdate(productToUpdate.variant, variantUpdateFields, { new: true });

        // Prepare the product update fields
        const productUpdateFields = {
            productName: data.productName,
            description: data.descriptionData,
            brand: brand._id, // Use ObjectId
            category: category._id // Use ObjectId
        };

        // Update the product
        await Product.findByIdAndUpdate(id, productUpdateFields, { new: true });

        res.redirect('/admin/products'); // Redirect on success
    } catch (error) {
        console.error(error);
        res.redirect('/admin/pageerror'); // Redirect on error
    }
};

//------------------------------------------------------------------



const deleteSingleImage = async (req, res) => {
    try {
        const { imageNameToServer, productIdToServer } = req.body;

        // Remove the image from the product's images array
        await Product.findByIdAndUpdate(productIdToServer, { $pull: { productImages: imageNameToServer } });

        // Construct the correct image path
        const imagePath = path.join("public", "uploads", "re-image", imageNameToServer);

        // Check if the image exists and delete it
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageNameToServer} deleted successfully`);
        } else {
            console.log(`Image ${imageNameToServer} not found`);
        }

        // Send a success response
        res.send({ status: true });
    } catch (error) {
        console.error("Error deleting image:", error);
        res.status(500).json({ status: false, message: "Internal server error" });
    }
};

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
    deleteProduct
    
}