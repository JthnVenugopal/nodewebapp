const express  =  require ('express');
const app =  express();
const path = require('path');
const env  = require('dotenv').config();
const session = require("express-session");
const DB =  require("./config/db");
const port = process.env.PORT || 3001;
const userRouter = require("./routes/userRouter");
const adminRouter = require("./routes/adminRouter")
const passport = require("./config/passport")



DB()

app.use(express.json());
app.use(express.urlencoded({extended:true}))

app.use(session({
  secret : process.env.SESSION_SECRET,
  resave:false,
  saveUninitialized:true,
  cookie:{
    secure:false,
    httpOnly:true,
    maxAge:72*60*60*1000
  }
}))

app.use(passport.initialize());
app.use(passport.session());


app.set("view engine", "ejs");
app.set("views", [path.join(__dirname, "views/user"),path.join(__dirname, "views/admin")]);
     
app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRouter)

app.use("/admin",adminRouter);

app.listen(port, () => {
  console.log(`server running at http://localhost:${port}`)
})

module.exports = app;

