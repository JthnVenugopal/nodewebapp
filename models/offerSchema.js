const mongoose = require("mongoose");
const {Schema}  = mongoose;

const offerSchema = new mongoose.Schema({
   offerCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    offerType: {
      type: String,
      enum: ['product', 'category', 'cart', 'order'], 
      required: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'flat'], 
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
   
    product :{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:false
    },

    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: false,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'upcoming', 'inactive'],
      default: 'inactive',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }, { timestamps: true });

const Offer = mongoose.model("Offer",offerSchema);

module.exports = Offer;