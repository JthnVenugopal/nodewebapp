const mongoose =  require("mongoose");
const { Schema } = mongoose;

const sizeSchema = new Schema(
  {
    size: {
      type: String,
      required: true,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);
  


const Size = mongoose.model("Size", brandSchema);
module.exports = Size;
