const mongoose =  require("mongoose");
const {Schema} = mongoose;
const {v4:uuidv4} = require("uuid");//default node id (the last 12 digits in the UUID) is generated once, randomly, on process startup, and then remains unchanged


const orderSchema = new Schema({
  orderId:{
      type:String,
      default:()=>uuidv4(),
      unique:true,

  },
  orderedItems:[{
      product:{
          type:Schema.Types.ObjectId,
          ref:"Product",
          required:true,
      },
      quantity:{
          type:Number,
          required:true,
      },
      price:{
          type:Number,
          default:0,
      }
  }],
  totalPrice:{
      type:Number,
      required:true,
  },
  discount:{
      type:Number,
      default:0,
  },
  finalAmount:{
      type:Number,
      required:true, 
  },
  address:{
      type:Schema.Types.ObjectId,
      ref:"User",
      required:true,
  },
  invoiceDate:{
      type:Date,
  },
  status:{
      type:String,
      required:true,
      enum:["Pending","Processing","Shipped","Delivered","Cancelled","Return Request","Returned"],
      default:"Pending"
  },
  paymentStatus: {
      type: String,
      enum: [
          "Pending",
          "Completed",
          "Failed",
          "Refunded",
          "Not Applicable"  
      ],
      default: "Pending"
  },
  createdOn:{
      type:Date,
      default:Date.now,
      required:true,
  },
  couponApplied:{
      type:Boolean,
      default:false,
  },
  user:{
      type:Schema.Types.ObjectId,
      ref:"User",
      required:true,
  },
  paymentMethod:{
      type:String,
      required:true,
      enum:["COD","online","wallet"],

  },
  couponCode:{
      type:String,
  }

})

const Order = mongoose.model("Order",orderSchema);
module.exports = Order;