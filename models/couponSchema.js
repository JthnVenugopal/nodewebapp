// const mongoose = require("mongoose");

// const { Schema } = mongoose;

// const couponSchema = new mongoose.Schema({
//   name:{
//     type:String,
//     required:true,
//     unique:true
//   },
//   createdOn: {
//     type: Date,
//     default: Date.now,
//     required:true
//   },
//   expireOn:{
//     type:Date,
//     required:true
//   },
//   offerPrice:{
//     type:Number,
//     required:true
//   },
//   minimumPrice:{
//     type:Number,
//     required:true
//   },
//   isList:{
//     type:Boolean,
//     default:true
//   },
//   userId:[{
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "User"
//   }]


// }, { timestamps: true });

// const Coupon = mongoose.model("Coupon",couponSchema);

// module.exports = Coupon;

////////////////////////////////////////////////////////////

const mongoose = require("mongoose");
const {Schema}  = mongoose;

const couponSchema = new mongoose.Schema({
   code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
     minPurchaseAmount: {
        type:Number,
        required:true
     },
     maxPurchaseAmount:{
        type:Number,
        required:true
     },
     startDate:{
        type:Date,
        required:true
     },
     endDate:{
        type:Date,
        required:true
     },
     discountType:{
        type:String,
        required:true
     },
     discountValue:{
        type:Number,
        required:true
     },
     description:{
      type:String,
      required:true
     },
     usageLimit:{
      type:Number,
      required:true
     },
     usedCount: {
      type:Number,
      required:false
     },
     status:{
        type:String,
        required:true,
        enum:["Expired","Active","Used","Not available"]
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
})

const Coupon = mongoose.model("Coupon",couponSchema);

module.exports = Coupon;