const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const userSchema = new Schema ({
  userId: {
    type: String,
    default: () => uuidv4(),
    unique: true
    },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    sparse:true,
  },
  phone: {

    type: BigInt,
    required: false,
    unique: true,
    sparse: true,// to avoid multiple null
    default:null,

  },
  googleId: {

    type: String,
    required: false,
    unique:true,
    sparse:true

},
  password: {

    type: String,
    required: false,

  },
  gender:{

    type:String,
    required:false

  },
  isBlocked: {

    type: Boolean,
    default: false,

  },
  isActive:{

    type: String,
    enum: ["active","deactivated","deleted"],
    default:"active",
    required:false

  },
  isVerified: {

    type: Boolean,
    default: false

  },
  isAdmin: {

    type: Boolean,
    default: false,

  },
  cart: [{

     type: Schema.Types.ObjectId,
     ref:"Cart",

  }],
  wallet:{

    type:Number,
    default:0,

  },
  wishlist:[{

    type: Schema.Types.ObjectId,
    ref: "Wishlist",

  }],
  orderHistory: [{

    type:Schema.Types.ObjectId,
    ref:"Order",

  }],
  createdOn: {

    type:Date,
    default:Date.now,

  },
  referralCode:{

  type: String,
  default: () => uuidv4().split('-')[0],
  unique: true,
  required : false

  },
  referralLink: {
    type: String,
    unique: true,
    required: false,
    default: function() {
        return `http://localhost:3000/signup/${this.referralCode}`;
    }
  },
  referrals: [{ 
    type: Schema.Types.ObjectId,
    ref: 'Referral'
  }],
  redeemed:{

    type:Boolean,
    default:false

  },
  redeemedUsers:[{

    type:Schema.Types.ObjectId,
    ref:"User",
    // required:true

  }],
  searchHistory: [{

    category: {
      type:Schema.Types.ObjectId,
      ref:"Category"

    },
    brand: {

      type:Schema.Types.ObjectId,
      ref:"Brand",

    },
    searchOn:{

      type:Date,
      default: Date.now

    }
  }],

  address: [{

    type: Schema.Types.ObjectId,
    ref: "Address",

  }]
     ,




}, { timestamps: true });

const User =  mongoose.model("User",userSchema);

module.exports = User;