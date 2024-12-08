const mongoose = require("mongoose")

const imageSchema = new mongoose.Schema({

    image: {
        type: String,
        required: true,
    },
    altText:{
        type: String,
    },
    imageType: {                                      
        type: String,
        enum: ['banner', 'background'],
        required: true
      },
      page: {    type: String,
        enum: ['home', 'shop','about'],
        required: true }, 

    createdAt:{
    type:Date,
    default:Date.now
}
})

const Image = mongoose.model('Image', imageSchema);
module.exports = Image;