/*************************************************************************************
 * WEB322 - 2237 Project
 * I declare that this assignment is my own work in accordance with the Seneca Academic
 * Policy. No part of this assignment has been copied manually or electronically from
 * any other source (including web sites) or distributed to other students.
 *
 * Student Name  : Artom Zabihi
 * Student ID    : 137978227 | azabihi1
 * Course/Section: WEB322 NEE
 *
 **************************************************************************************/

const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const session = require("express-session");
const fileUpload = require("express-fileupload");

//Dotenv path
dotenv.config({path: "./config/keys.env"});

//Express
const app = express();

// Add your routes here
// e.g. app.get() { ... }

//EJS
app.set('view engine', 'ejs');
app.set('layout', 'layouts/main');
app.use(expressLayouts);

app.use(express.static(path.join(__dirname, "/assets")));

//Body-parser
app.use(express.urlencoded({extended: true}));

app.use(fileUpload());

//Express session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true
}));


app.use((req, res, next) => {
    res.locals.user = req.session.user;
    res.locals.role = req.session.role;
    res.locals.cart = req.session.cart;
    next();
});

mongoose.connect(process.env.MONGODB_CONN_STRING).then(() => {
    console.log("Connected to the MongoDB database.");
})



const generalController = require("./controllers/generalController");
const rentalsController = require("./controllers/rentalsController");
const loadDataController = require("./controllers/loadDataController");

app.use("/", generalController);
app.use("/rentals", rentalsController);
app.use("/load-data", loadDataController);

// *** DO NOT MODIFY THE LINES BELOW ***

// This use() will not allow requests to go beyond it
// so we place it at the end of the file, after the other routes.
// This function will catch all other requests that don't match
// any other route handlers declared before it.
// This means we can use it as a sort of 'catch all' when no route match is found.
// We use this function to handle 404 requests to pages that are not found.
app.use((req, res) => {
    res.status(404).send("Page Not Found");
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send("Something broke!")
});

// Define a port to listen to requests on.
const HTTP_PORT = process.env.PORT || 8080;

// Call this function after the http server starts listening for requests.
function onHttpStart() {
    console.log("Express http server listening on: " + HTTP_PORT);
}

// Listen on port 8080. The default port for http is 80, https is 443. We use 8080 here
// because sometimes port 80 is in use by other applications on the machine
app.listen(HTTP_PORT, onHttpStart);