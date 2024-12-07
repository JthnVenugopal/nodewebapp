// // controllers/admin/variantController.js

// const Variant = require("../../models/variantSchema"); // Import the Variant model
// const Product = require("../../models/productSchema"); // Import the Product model

// // Get variants for a specific product
// // controllers/admin/variantController.js

// // Get variants for a specific product and render the variants list
// const getVariantsByProduct = async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     const variants = await Variant.find({ productId });
//     const product = await Product.findById(productId);

//     if (!product) {
//       return res.status(404).json({ message: "Product not found" });
//     }

//     res.render("variantsList", { product, variants });
//   } catch (err) {
//     console.error("Error fetching variants:", err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };




// // Add a new variant
// const addVariant = async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     const { color, size, material, price } = req.body;

//     const newVariant = new Variant({
//       color,
//       size,
//       material,
//       price,
//       productId
//     });

//     await newVariant.save();
//     res.redirect(`/admin/product/${productId}/variants`);
//   } catch (err) {
//     res.status(500).json({ message: "Error adding variant", error: err });
//   }
// };

// // Edit an existing variant
// const editVariant = async (req, res) => {
//   try {
//     const variantId = req.params.id;
//     const updateData = req.body;

//     const updatedVariant = await Variant.findByIdAndUpdate(variantId, updateData, { new: true });
//     res.status(200).json({ message: "Variant updated successfully", variant: updatedVariant });
//   } catch (err) {
//     res.status(500).json({ message: "Error updating variant", error: err });
//   }
// };

// // Delete a variant
// const deleteVariant = async (req, res) => {
//   try {
//     const variantId = req.params.id;

//     await Variant.findByIdAndDelete(variantId);
//     res.status(200).json({ message: "Variant deleted successfully" });
//   } catch (err) {
//     res.status(500).json({ message: "Error deleting variant", error: err });
//   }
// };


// module.exports = {
//   getVariantsByProduct,
//   addVariant,
//   editVariant,
//   deleteVariant
// }
