const mongoose =  require("mongoose");
const { Schema } = mongoose;

const cartSchema =  new Schema({
 
  userId: {
    
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true

  },
  items:[{
    productId: {

      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true

    },
    quantity:{

      type:Number,
      required:true,
      default:0,

    },

    variantId: { // Add this line to reference the Variant
      type: Schema.Types.ObjectId,
      ref: 'Variant',
      required: true // Make it required if every item must have a variant
    },

    price:{

      type:Number,
      required:true

    },
    totalPrice: {

      type: Number,
      required: true

    },
    discountAmount:{

       type:Number,
       required:false,
       default:0,
       
    },
    status:{

      type:String,
      default:"placed"

    },
    cancellationReason:{

      type:String,
      default:"none"

    }

  }]

}, { timestamps: true });

const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;
