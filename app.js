//jshint esversion:6
require('dotenv').config();     
const express=require ("express");
const bodyParser=require ("body-parser");
const ejs=require ("ejs");
const mongoose = require ("mongoose");
const session = require("express-session");
const passport=require("passport");
const passportLocal =require("passport-local");
const passportLocalMongoose=require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy= require('passport-facebook').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded(
    {extended : true}
));

app.use(session({
    secret:"this is my secret.",
    resave: false,
    saveUninitialized: false,
    
  }))

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://127.0.0.1:27017/user1DB",{useNewUrlParser:true}).then(
    () =>{
        console.log("conected to DB");
    },

    err =>{
        console.log(err)
    }
)

const userSchema = new mongoose.Schema({
        email : String,
        password : String,
        googleId :String,
        facebookId : String,
        secret : String

})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = mongoose.model("user",userSchema);

passport.use(User.createStrategy());


// code to serialize and deserialize the session cookie for all type of strategies
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      cb(null, { id: user.id });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });

// code of authentication by googleStrategy 
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ username: profile.displayName ,googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

// code of authentication by facebookStrategy 
passport.use(new FacebookStrategy({
    clientID: process.env.APP_ID,
    clientSecret: process.env.APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile)
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/",(req,res)=>{
    res.render("home");
})

app.get("/auth/google",
    passport.authenticate('google', { scope: ['profile'] }
));

app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect to secrets.
    res.redirect('/secrets');
  });

app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/secrets",(req,res)=>{
    // User.find({"secret": {$ne: null}}) = this statement is for mongoDB field not null
    User.find({"secret": {$ne: null}}).then(function(foundUsers){
        if (foundUsers) {
            res.render("secrets", {usersWithSecrets: foundUsers});
          }
        }).catch(function(err){
           console.log(err);
        })
})

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){

        res.render("submit");
    }
    else{
        res.redirect("/login");
    }
})

app.get("/login",(req,res)=>{
    res.render("login");
})

app.get("/logout",(req,res)=>{

    req.logout( (err)=> {
        if (err) { 
            res.send(err);
        }
        else{
            res.redirect('/');
        }
      });
})

app.post("/submit",(req,res)=>{
    const submittedSecret =req.body.secret;

    // Once the user is authenticated and their session gets saved, their user details are saved to req.user.
    // console.log(req.user);

    User.findById(req.user.id).then(function(foundUser){
        if(foundUser){
            foundUser.secret = submittedSecret;
            foundUser.save().then(function(){
                res.redirect("/secrets");
            }).catch(function(err){
                console.log(err);
            })
        }
    }).catch(function(err){
        console.log(err);
    })
})


app.post("/register",(req,res)=>{

    User.register({username: req.body.username }, req.body.password, function(err) {
        if (err) {
            res.send(err);
            res.redirect("/register");
         }
        else{

            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
        
        
      });
    
})

app.post("/login",(req,res)=>{

    const user = new User({
        username : req.body.username,
        password : req.body.password
    })
    
    req.login(user,function(err){
        if(err){
            res.send(err);
        }
        else{

            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })

})




app.listen(3000,function(){
    console.log("server is running on port 3000");
})

