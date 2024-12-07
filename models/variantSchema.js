const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define the variant schema
const variantSchema = new Schema({
  color: {
    type: String,
    required: true, // Ensures color is always provided
  },
  size: {
    type: String,
    required: true, // Ensures size is always provided
  },
  material: {
    type: String,
    required: true, // Ensures material is always provided
  },
  price: {
    type: Number,
    required: true, // Ensures price is always provided
  },
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product", // Connects to the Product model
    required: true, // Ensures productId is always provided
  }
});

// Check if the model already exists, if not, create it
const Variant = mongoose.models.Variant || mongoose.model("Variant", variantSchema);

module.exports = Variant;
