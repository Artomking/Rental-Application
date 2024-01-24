const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const router = express.Router();
const userModel = require("../models/userModel");
const bcryptjs = require("bcryptjs");

const {getFeaturedRentals} = require('../models/rentalFunctions');


router.get("/", async (req, res) => {
    const featuredRentals = await getFeaturedRentals();
    res.render("home", {
        featuredRentals,
        title: "Home Page",
    });
})

router.get("/sign-up", (req, res) => {
    res.render("sign-up", {
        title: "Sign Up",
        values: {
            firstName: "",
            lastName: "",
            emailAddress: "",
            password: "",
            login: false
        },
        validationMessages: {},
    });
})

router.get("/log-in", (req, res) => {
    res.render("log-in", {
        title: "Log In",
        values: {
            emailAddress: "",
            password: "",
            login: true
        },
        validationMessages: {},
    });
})

router.get("/logout", (req, res) => {
    req.session.role = undefined;
    req.session.destroy();
    res.redirect("/");
})

router.get("/checkStatus", (req, res) => {
    if (req.session.role === "dataEntryClerk") {
        res.redirect("rentals/list");
    } else {
        res.redirect("rentals/cart");
    }

})

router.get("/welcome", (req, res) => {
    res.render("welcome", {
        title: "Welcome",
    })
})
router.post("/sign-up", async (req, res) => {
    const {firstName, lastName, emailAddress, password} = req.body;

    let passedValidation = true;
    let validationMessages = {};

    if (typeof firstName !== "string" || firstName.trim().length === 0) {
        passedValidation = false;
        validationMessages.firstName = "You must specify a first name.";
    } else if (typeof firstName !== "string" || firstName.trim().length < 2) {
        passedValidation = false;
        validationMessages.firstName = "The first name should be at least 2 characters.";
    }

    if (typeof lastName !== "string" || lastName.trim().length === 0) {
        passedValidation = false;
        validationMessages.lastName = "You must specify a last name.";
    } else if (typeof lastName !== "string" || lastName.trim().length < 2) {
        passedValidation = false;
        validationMessages.lastName = "The last name should be at least 2 characters.";
    }

    if (typeof emailAddress !== "string" || emailAddress.trim().length === 0 || emailAddress.indexOf("@") === -1) {
        passedValidation = false;
        validationMessages.emailAddress = "You must enter a valid email address.";
    }

    if (typeof password !== "string" || password.trim().length === 0) {
        passedValidation = false;
        validationMessages.password = "Please enter a valid password.";
    }

    const existingEmail = await userModel.findOne({emailAddress});
    if (existingEmail) {
        passedValidation = false;
        validationMessages.emailAddress = "Email address already found in the database."
    }

    const newUser = new userModel({
        firstName,
        lastName,
        emailAddress,
        password
    });
    newUser.save()
        .then(userSaved => {
            console.log(`User ${userSaved.firstName} has been added to the database.`);
        })
        .catch(err => {
            passedValidation = false;
            console.log(`Error adding user to the database ... ${err}`);
        });
    //Every API app I've signed up for has blocked me except for Mailjet
    //Mailjet doesn't even fully send the emails they just soft-bounce so I'm just hoping for partial marks
    if (passedValidation) {
        const mailjet = require('node-mailjet').apiConnect(
            process.env.MJ_APIKEY_PUBLIC,
            process.env.MJ_APIKEY_PRIVATE
        )
        const request = mailjet.post('send').request({
            FromEmail: 'azabihi1@myseneca.ca',
            FromName: 'Rento',
            Subject: 'Welcome to Rento!',
            'Text-part':
                `Dear ${firstName} ${lastName}, Artom Zabihi says welcome on behalf of the Rento team!`,
            'Html-part':
                '<h3>Dear ${firstName} ${lastName}, Artom Zabihi says welcome on behalf of the <a href="https://web322-azabihi1.cyclic.app">Rento</a> team!<br/>',
            Recipients: [{Email: emailAddress}],
        })
        request
            .then(result => {
                console.log(result.body)
            })
            .catch(err => {
                console.log(err.statusCode)
            })
        res.redirect("welcome");

    } else {
        res.render("sign-up", {
            title: "Sign Up",
            values: {
                emailAddress: emailAddress,
                password: password
            },
            validationMessages: validationMessages,
        });
    }
})

router.post("/log-in", async (req, res) => {
    const {emailAddress, password, role} = req.body;

    let passedValidation = true;
    let validationMessages = {};


    if (typeof emailAddress !== "string" || emailAddress.trim().length === 0 || emailAddress.indexOf("@") === -1) {
        passedValidation = false;
        validationMessages.emailAddress = "Sorry, you have entered an invalid email address";
    }

    if (typeof password !== "string" || password.trim().length === 0) {
        passedValidation = false;
        validationMessages.password = "Sorry, you have entered an invalid password.";
    }


    let errors = [];


    userModel.findOne({
        emailAddress
    })
        .then(user => {
            if (user) {
                bcryptjs.compare(password, user.password)
                    .then(isMatched => {
                        if (isMatched) {
                            req.session.user = user;
                            req.session.role = role;

                            if (role === "dataEntryClerk") res.redirect("/rentals/list");
                            else res.redirect("/rentals/cart");
                        } else {
                            validationMessages.password = "Password does not match the database.";
                            console.log(validationMessages.password);
                            res.render("log-in", {
                                errors,
                                title: "Log In",
                                values: {
                                    emailAddress: emailAddress,
                                    password: password
                                },
                                validationMessages: validationMessages,
                            });
                        }
                    }).catch(err => {
                    validationMessages.password = "Password could not be validated ... " + err;
                    console.log(validationMessages.password);

                    res.render("log-in", {
                        errors,
                        title: "Log In",
                        values: {
                            emailAddress: emailAddress,
                            password: password
                        },
                        validationMessages: validationMessages,
                    });
                });
            } else {
                validationMessages.emailAddress = "Email was not found in the database";
                console.log(validationMessages.emailAddress);

                res.render("log-in", {
                    errors,
                    title: "Log In",
                    values: {
                        emailAddress: emailAddress,
                        password: password
                    },
                    validationMessages: validationMessages,
                });
            }
        })
        .catch(err => {
            validationMessages.emailAddress = "Error finding the user in the database ... " + err;
            console.log(validationMessages.emailAddress);

            res.render("log-in", {
                errors,
                title: "Log In",
                values: {
                    emailAddress: emailAddress,
                    password: password
                },
                validationMessages: validationMessages,
            });
        });
});

module.exports = router;