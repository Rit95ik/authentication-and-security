//jshint esversion:6
require('dotenv').config();     
const express=require ("express");
const bodyParser=require ("body-parser");
const ejs=require ("ejs");
const mongoose = require ("mongoose");
const bcrypt = require("bcrypt");
const saltRounds=10;

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded(
    {extended : true}
));

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
        password : String
})


const user = mongoose.model("user",userSchema);



app.get("/",(req,res)=>{
    res.render("home");
})


app.get("/register",(req,res)=>{
    res.render("register");
})

app.get("/login",(req,res)=>{
    res.render("login");
})


app.post("/register",(req,res)=>{

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const newUser= new user({
            email : req.body.username,
            password : hash
        })
        
        newUser.save().then( ()=>{
            res.render("secrets");
        }).catch((err)=>{
            res.send(err);
        })
    });

    
})

app.post("/login",(req,res)=>{

    const username = req.body.username;
    const password = req.body.password;

    user.findOne({email: username}).then( (foundUser)=>{
        bcrypt.compare(password, foundUser.password, function(err, result) {
            if(result === true){
                res.render("secrets");
            }
        });

})
})


app.listen(3000,function(){
    console.log("server is running on port 3000");
})

