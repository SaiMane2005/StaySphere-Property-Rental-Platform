if(process.env.NODE_ENV != "production"){
  require('dotenv').config()
}
// console.log(process.env.SECRET)

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const {listingSchema, reviewSchema}=require("./schema.js");
const Review = require("./models/review.js");
const listingRouter=require("./routes/listing.js")
const reviewRouter=require("./routes/review.js")
const session=require("express-session");
const MongoStore = require('connect-mongo').default;

const flash=require("connect-flash")
const passport=require("passport");
const LoacalStrategy=require("passport-local")
const User=require("./models/user.js")
const userRouter= require("./routes/user.js");
const dbUrl = process.env.ATLASdb_URI;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.set("views", path.join(__dirname, "views"));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: "mysupersecretstring"
  },
  touchAfter: 24 * 3600, // time period in seconds
});
store.on("error", function (e) {
  console.log("ERRO IN MONGO SESSION STORE", e);
});

const sessionOptions={
  store:store,
  secret:"mysupersecretstring",
  resave:false,
  saveUninitialized:true,
  cookie:{
    expires:Date.now() + 7 * 24 * 60 * 60* 1000,
    maxAge: 7 * 24 * 60 * 60* 1000,
    httpOnly: true
  }
}
// app.get("/", (req, res) => {
//   res.send("Hi,I am root");
// });

app.use(session(sessionOptions));
app.use(flash())

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LoacalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use( (req,res,next)=>{
  res.locals.success=req.flash("success");
  res.locals.error=req.flash("error");
  res.locals.currUser=req.user;
  console.log(res.locals.currUser);
  next();

})

// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";
async function main() {
  await mongoose.connect(dbUrl);
}
main()
  .then(() => console.log("connected to the db"))
  .catch((err) => console.log(err));


app.listen(8080, () => {
  console.log("server is listening at port 8080");
});

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter)
app.use("/",userRouter);

//error handling for the not existing pages
app.all(/.*/, (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});



// Error Handler
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong" } = err;
 // res.status(statusCode).send(message);
  res.render("listings/error.ejs",{err});

  // res.status(statusCode).render("./listings/error.ejs",{err});
});

