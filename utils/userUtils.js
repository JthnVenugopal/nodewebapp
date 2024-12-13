// userUtils.js or databaseUtils.js
const User = require("../models/userSchema")

const getUserWithAddresses = async (userId) => {
  return User.findById(userId).populate('address');
};

module.exports = {
  getUserWithAddresses,
 
};
