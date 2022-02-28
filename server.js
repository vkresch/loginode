if (process.env.NODE_ENV !== "production"){
    require("dotenv").config()
}

const express = require("express")
const app = express()
const bcrypt = require("bcrypt")
const passport = require("passport")
const flash = require("express-flash")
const session = require("express-session")
const methodOverride = require("method-override")
const crypto = require("crypto");

const initializePassport = require("./passport-config")

initializePassport(passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id),
)

const users = [{
    id: 0,
    name: "admin",
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASS
}]
let valid_tag = crypto.randomBytes(16).toString("hex")

console.log(users)

app.set("view-engine", "ejs")
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride("_method"))

app.get("/", checkAuthenticated, (req, res) => {
    machineurl = req.get("host") + "/machine/" + valid_tag
    res.render("index.ejs", { name: req.user.name, machineurl: machineurl})
})

app.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("login.ejs")
})

app.get("/genmachine", checkAuthenticated, (req, res) => {
    valid_tag = crypto.randomBytes(16).toString("hex")
    machineurl = req.get("host") + "/machine/" + valid_tag
    res.render("index.ejs", { name: req.user.name, machineurl: machineurl})
})

app.get("/machine/:tag_id", (req, res) => {
    if(req.params.tag_id == valid_tag){
        res.render("machine.ejs", { tag_id: req.params.tag_id})
    } else {
        res.status(404).send("Machine does not exist anymore!")
    }    
})

app.post("/login", checkNotAuthenticated, passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
    failureFlash: true,
}))

app.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("register.ejs")
})

app.post("/register", checkNotAuthenticated, async (req, res) => {
    try {
        const hashed_password = await bcrypt.hash(req.body.password, 10)
        users.push(
            {
                id: Date.now().toString(),
                name: req.body.name,
                email: req.body.email,
                password: hashed_password
            }
        )
        res.redirect("/login")
    } catch {
        res.redirect("/register")        
    }
    console.log(users)
})

app.delete("/logout", (req, res) => {
    req.logOut()
    res.redirect("/login")
})

function checkAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return next()
    }
    return res.redirect("/login")
}

function checkNotAuthenticated(req, res, next){
    if(req.isAuthenticated()){
        return res.redirect("/")
    }
    return next()
}

app.listen(3000)