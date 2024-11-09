const express  =  require ('express');
const app =  express();
const env  = require('dotenv').config();
const DB =  require("./config/db")
const port = process.env.PORT || 3001;
DB()

// console.log(process.env.PORT)
// console.log(port)

app.listen(port, () => {
  console.log(`server running at http://localhost:3000`)
})

module.exports = app;

