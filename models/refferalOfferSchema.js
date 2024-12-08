const mongoose = require("mongoose");
const { Schema } = mongoose;

const referralOfferSchema = new Schema({
    offerCode: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: String,
    referrerReward: { 
        type: Number,
        required: false,
    },
    refereeReward: { 
        type: Number,
        required: false,
    },
    walletCreditAmount: {
        type: Number,
        default: 0,
    },
    firstOrderDiscountPercentage: {
        type: Number,
        default: 0,
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
        enum: ['active', 'inactive'],
        default: 'active',
    },
}, { timestamps: true });

const ReferralOffer = mongoose.model("ReferralOffer", referralOfferSchema);

module.exports = ReferralOffer;