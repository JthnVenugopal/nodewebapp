const mongoose = require("mongoose");
const { Schema } = mongoose;
const { v4: uuidv4 } = require("uuid");

const referralSchema = new Schema({
    referralId: {
        type: String,
        unique: true,
        default: () => uuidv4().split('-')[0] 
    },
    referralLink: {
        type: String,
        unique: true,
        default: function() {
            return `http://localhost:3000/signup/${this.referralId}`;
        }
    },
    referrerUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    refereeUserId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false 
    },
    rewardClaimed: {
        type: Boolean,
        default: false 
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Referral = mongoose.model("Referral", referralSchema);
module.exports = Referral;