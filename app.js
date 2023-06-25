//jshint esversion:6
require('dotenv').config();     
const express=require ("express");
const bodyParser=require ("body-parser");
const ejs=require ("ejs");
const mongoose = require ("mongoose");
const encrypt =require("mongoose-encryption")

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

userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields:["password"] });

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
    const newUser= new user({
        email : req.body.username,
        password : req.body.password
    })
    
    newUser.save().then( ()=>{
        res.render("secrets");
    }).catch((err)=>{
        res.send(err);
    })
})

app.post("/login",(req,res)=>{
    const password=req.body.password;

    user.findOne({email: req.body.username}).then( (foundUser)=>{
        if(foundUser.password === password){
            res.render("secrets");
        }
    }).catch((err)=>{
        res.send(err);
    })
})


app.listen(3000,function(){
    console.log("server is running on port 3000");
})

