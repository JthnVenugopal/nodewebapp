const mongoose = require("mongoose");
const { Schema } = mongoose;
const ratingSchema = new Schema({
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',  
      required: true
    },
   
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',  
      required: true
    },
    review: {
      type: String,  
      required: true
    },
    rating: {
      type: Number,  
      min: 1,
      max: 5,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now  
    }
  });

  // Create a unique index to prevent multiple ratings from the same user for the same product
ratingSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Rating = mongoose.model("Rating", ratingSchema);
module.exports = Rating