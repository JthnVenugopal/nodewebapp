const mongoose = require("mongoose");
const { Schema } = mongoose;
const {v4:uuidv4} = require("uuid");


const variantSchema = new Schema ({

variantCode: {
  type: String,
  required: true,
  
},
regularPrice:{
  type:Number,
  required:true,
},
salePrice:{
  type:Number,
  required:true
},
offerPrice: {
  type:Number,
  default:0
},
quantity: {
  type: Number,
  default: 0
},
color:{
  type:String,
  required:true
},
productImages:{
  type:[String],
  required:true
},
size:{
  type:[Number],
  required:true,

}

})



// Check if the model already exists, if not, create it
const Variant =  mongoose.models.Variant || mongoose.model("Variant", variantSchema);

module.exports = Variant;