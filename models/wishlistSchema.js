// const mongoose = require("mongoose");
// const { Schema } = mongoose;

// const wishlistSchema = new Schema({
//     userId: {
//         type: Schema.Types.ObjectId,
//         ref: "User",
//         required: true
//     },
//     items: [{
//         variantId : {
            
//             type: Schema.Types.ObjectId,
//             ref: "Variant",
//             required: true
//         },
//         productId: {  
//             type: Schema.Types.ObjectId,
//             ref: "Product",
//             required: true
//         },
//         price: {
//             type: Number,
//             required: true
//         }
//     }],
//     createdAt: {
//         type: Date,
//         default: Date.now
//     },
//     updatedAt: {
//         type: Date,
//         default: Date.now
//     }
// }, {
//     timestamps: true
// });

// const Wishlist = mongoose.models.Wishlist || mongoose.model('Wishlist', wishlistSchema);
// module.exports = Wishlist;


const mongoose = require("mongoose");
const { Schema } = mongoose;

const wishlistSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    items: [
        {
            product: {
                type: Object,
                required: true,
            },
            variant: {
                type: Object,
                required: true,
            },
        },
    ],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});

const Wishlist = mongoose.models.Wishlist || mongoose.model("Wishlist", wishlistSchema);
module.exports = Wishlist;
