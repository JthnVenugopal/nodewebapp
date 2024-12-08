// const mongoose =  require("mongoose");
// const {Schema} = mongoose;
// const {v4:uuidv4} = require("uuid");//default node id (the last 12 digits in the UUID) is generated once, randomly, on process startup, and then remains unchanged


// const orderSchema = new Schema({
//   orderId:{

//       type:String,
//       default: () => uuidv4().split('-')[0],
//       unique:true,

//   },

//   orderedItems:[{
//       product:{
//           type:Schema.Types.ObjectId,
//           ref:"Product",
//           required:true,
//       },
//       quantity:{
//           type:Number,
//           required:true,
//       },
//       regularPrice: {
//         type: Number,
//         default: 0
//       },
//       price:{
//           type:Number,
//           default:0,
//       },
//       saledPrice: {
//         type: Number,
//         default: 0
//       },
//       itemOrderStatus: {
//         type: String,
//         required: false,
//         enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Return Requested","Return Approved","Return Rejected","Returned"],
//          default: "Pending"
//       },
//       cancelReason: {
//         type: String
//       },
//       returnRequestedReason: {
//         type: String
//       },
//       returnRejectedReason: {
//         type: String
//       },
//       deliveryDate: {
//         type: Date
//       },
//       returnReason: {
//         type: String
//       }
      
//   }],

//   actualPrice: {
//     type: Number,
//     required: true
//   },
//   totalPrice:{
//       type:Number,
//       required:true,
//   },
//   discount:{
//       type:Number,
//       default:0,
//   },
//   finalAmount:{
//       type:Number,
//       required:true, 
//   },

//   address: {
//     house: {
//       type: String,
//       required: true
//     },
//     place: {
//       type: String,
//       required: true
//     },
//     city: {
//       type: String,
//       required: true
//     },
//     state: {
//       type: String,
//       required: true
//     },
//     landMark: {
//       type: String,
//       required: false  
//     },
//     pin: {
//       type: Number,
//       required: true
//     },
//     contactNo: {
//       type: String,  
//       required: true
//     }
//   },
//   invoiceDate:{
//       type:Date,
//   },
//   status:{
//       type:String,
//       required:true,
//       enum:["Pending","Processing","Shipped","Delivered","Cancelled","Return Request","Returned"],
//       default:"Pending"
//   },

//   paymentMethod:{
//     type:String,
//     enum:["Cash on delivery","Online Payment","Wallet Payment "],
//     required:true
//   },
//   paymentStatus: {
//       type: String,
//       enum: [
//           "Pending",
//           "Completed",
//           "Failed",
//           "Refunded",
//           "Not Applicable"  
//       ],
//       default: "Pending"
//   },
//   razorpayOrderId: {
//     type: String,
//     required: false  
//   },
//   createdOn:{
//       type:Date,
//       default:Date.now,
//       required:true,
//   },
//   couponApplied:{
//       type:Boolean,
//       default:false,
//   },
//   orderType: {
//     type: String,
//     enum: ["Retail", "Wholesale", "Subscription"]
//   },
//   user:{
//       type:Schema.Types.ObjectId,
//       ref:"User",
//       required:true,
//   },
//   paymentMethod:{
//       type:String,
//       required:true,
//       enum:["COD","online","wallet"],

//   },

//   trackingNumber: {
//     type: String
//   },
//   cancelReason: {
//     type: String
//   },

//   couponCode:{
//       type:String,
//   }

// })

// const Order = mongoose.model("Order",orderSchema);
// module.exports = Order;

//////////////////////////////////////////////////////////

const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const orderSchema = new Schema({
  orderId: {
    type: String,
    default: () => uuidv4().split('-')[0],
    unique: true,
  },
  orderedItems: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      regularPrice: {
        type: Number,
        default: 0,
      },
      price: {
        type: Number,
        default: 0,
      },
      salePrice: {
        type: Number,
        default: 0,
      },
      itemOrderId: {
        type: String,
        default: () => uuidv4().split('-')[0],
      },
      itemOrderStatus: {
        type: String,
        enum: [
          "Pending",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
          "Return Requested",
          "Return Approved",
          "Return Rejected",
          "Returned",
        ],
        default: "Pending",
      },
      cancelReason: String,
      returnRequestedReason: String,
      returnRejectedReason: String,
      deliveryDate: Date,
    },
  ],
  actualPrice: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    default: 0,
  },
  finalAmount: {
    type: Number,
    required: true,
  },
  address: {
    house: { type: String, required: true },
    place: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    landMark: String,
    pin: { type: Number, required: true },
    contactNo: { type: String, required: true },
  },
  invoiceDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ["Pending", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
    default: "Pending",
  },
  paymentMethod: {
    type: String,
    enum: ["Cash on delivery", "Online Payment", "Wallet Payment"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["Pending", "Completed", "Failed", "Refunded", "Not Applicable"],
    default: "Pending",
  },
  razorpayOrderId: String,
  couponApplied: {
    type: Boolean,
    default: false,
  },
  orderType: {
    type: String,
    enum: ["Retail", "Wholesale", "Subscription"],
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  trackingNumber: String,
  couponCode: String,
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
