

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
    enum: ["COD", "razorpay", "wallet"],
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

// Adding an index to the orderId field 
  orderSchema.index({ orderId: 1});


const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
