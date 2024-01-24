const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const router = express.Router();
const rentalModel = require("../models/rentalModel");
//const {getRentals} = require("../models/rentals-db");

router.get("/", (req, res) => {
    //let rentals = getRentals();
    if (req.session.user) {
        if (req.session.role === "dataEntryClerk") {
            rentalModel.countDocuments()
                .then(async count => {
                    if (count === 0) {
                        rentalModel.insertMany(rentals)
                            .then(() => {
                                res.send("Added rentals to the database!");
                            })
                            .catch(err => {
                                res.send("Couldn't insert the documents: " + err);
                            });
                    } else {
                        res.send("Rentals have already been added to the database.");
                    }
                })
                .catch(err => {
                    res.send("There are already documents loaded.");
                })
        } else {
            res.status(401).send(`You are not authorized to add rentals.`)
        }
    } else {
        res.status(401).send("Unauthorized access: You must be logged in to access this page.");
    }
})

module.exports = router;