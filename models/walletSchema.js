const mongoose = require("mongoose");
const {Schema} = mongoose;
const {v4:uuidv4} = require("uuid");

const walletSchema = new mongoose.Schema({
   
        balance: {
            type:Number,
            required:true,
            default:0
        },
        transactions:[{
            transactionId:{
                type:String,
                default: ()=>uuidv4(),
                unique:true,
                sparse:true
            },
            type: {
                type: String,
                enum: ["credit", "debit"],
                required: true,
              },
            amount:{
                type:Number,
                required:true
            },
            description:{
                type:String,
                required:false
            },
            date:{
                type: Date,
                dafault: Date.now
            },
        }]
});

const Wallet = mongoose.model("Wallet",walletSchema)

module.exports = Wallet;