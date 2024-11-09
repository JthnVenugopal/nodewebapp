const express  =  require ('express');
const app =  express();
const path = require('path')
const env  = require('dotenv').config();
const DB =  require("./config/db")
const port = process.env.PORT || 3001;
const userRouter = require("./routes/userRouter")
DB()

app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views/user"),path.join(__dirname, "views/admin")]);

app.use(express.static(path.join(__dirname,"public")));

app.use("/", userRouter)


app.listen(port, () => {
  console.log(`server running at http://localhost:3000`)
})

module.exports = app;

