const mongoose = require("mongoose");
const { Schema } = mongoose;
const {v4:uuidv4} = require("uuid");

const productSchema = new Schema ({

  productName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  skuNumber:{
    type:String,
    default: ()=>uuidv4(),
    unique:true
  },
  brand: {
     type:Schema.Types.ObjectId,
     ref: 'Brand',
     required: false,
  },
  category:{
    type:Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },

  variant: {

    type:Schema.Types.ObjectId,
    ref: "Variant",
    required: true,

  },

  popularity: {
    type: Number,
    default: 0,
  },
  averageRating: {
    type: Number,
    default: 0,
  },
  numberOfRatings: {
    type: Number,
    default: 0,
  },

  isBlocked:{
    type:Boolean,
    default:false
  },
  status:{
    type: String,
    enum:["Available","Out of stock", "Discontinued"],
    required:true,
    default:"Available"
  }},{timestamps:true });
  //automatically adds two fields to schema:createdAt and updatedAt


// Check if the model already exists, if not, create it
const Product =  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;

