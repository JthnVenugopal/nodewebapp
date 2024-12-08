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
const Rating = mongoose.model("Rating", ratingSchema);
module.exports = Rating