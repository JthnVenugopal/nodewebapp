const mongoose =  require("mongoose");
const {Schema} = mongoose;
const {v4:uuidv4} = require("uuid");//default node id (the last 12 digits in the UUID) is generated once, randomly, on process startup, and then remains unchanged

