const express = require("express");
const router = express.Router();
const path = require("path");
const rentalModel = require('../models/rentalModel');
const fs = require("fs");

const {getRentalsByCityAndProvince, getRentals} = require("../models/rentalFunctions");

router.get("/", async (req, res) => {
    const rentalsByCity = await getRentalsByCityAndProvince();
    res.render("rentals/home", {
        rentalsByCity,
        title: "Rentals",
    });
})

router.get("/list", async (req, res) => {
    const rentals = await getRentals();
    if (req.session.user) {
        if (req.session.role === "dataEntryClerk") {
            res.render("rentals/list", {
                rentals,
                title: "Rental List",
                user: req.session.user
            })
        } else {
            res.status(401).send(`Unauthorized access: You do not have the required role of data entry clerk.`)
        }
    } else {
        res.status(401).send("Unauthorized access: You must be logged in to access this page.");
    }

})
router.get("/add", (req, res) => {
    res.render("rentals/add", {
        title: "Add Rental",
    });
})


router.post("/add", (req, res) => {
    const {headline, numSleeps, numBedrooms, numBathrooms, pricePerNight, city, province, featuredRental} = req.body;

    const newRental = new rentalModel({
        headline,
        numSleeps,
        numBedrooms,
        numBathrooms,
        pricePerNight,
        city,
        province,
        featuredRental: !!featuredRental,
        imageUrl: ""
    });

    newRental.save()
        .then(newRental => {
            console.log(`Rental ${newRental.headline} has been added to the database.`);

            const imageFile = req.files.imageUrl;
            let uniqueName = `rental-pics/${newRental._id}${path.parse(imageFile.name).ext}`;
            imageFile.mv(`assets/${uniqueName}`)
                .then(()=> {
                    rentalModel.updateOne({
                        _id: newRental._id
                    }, {
                        imageUrl: uniqueName
                    })
                        .then(() => {
                            console.log("Updated the rental picture");
                            res.redirect("/");
                        })
                        .catch(err => {
                            console.log(`Error updating rental picture... ${err}`);
                            res.redirect("/");
                        });
                })
                .catch(err => {
                    console.log(`Error adding rental pic... ${err}`);
                    res.redirect("/");
                })
        })
        .catch(err => {
            console.log(`Error adding rental to the database ... ${err}`);
            res.render("rentals/add", {
                title: "Add Rental",

            });
        });
})

router.get("/edit/:id", async (req, res) => {
    const rental = await getRentals()
    const rentals = rental.find(rental => rental._id.toString() === req.params.id);
    res.render('rentals/edit', {rental : rentals, title: "Edit Rental"});
})

router.post('/edit/:id', async (req, res) => {
    try {
        const { headline, numSleeps, numBedrooms, numBathrooms, pricePerNight, city, province, featuredRental } = req.body;

        await rentalModel.findByIdAndUpdate(req.params.id, {
            headline,
            numSleeps,
            numBedrooms,
            numBathrooms,
            pricePerNight,
            city,
            province,
            featuredRental: !!featuredRental,
        })
            .then(newRental => {
                console.log(`Rental ${newRental.headline} has been updated.`);

                const imageFile = req.files.imageUrl;
                if (imageFile != null) {
                    let uniqueName = `rental-pics/${newRental._id}${path.parse(imageFile.name).ext}`;
                    imageFile.mv(`assets/${uniqueName}`)
                        .then(() => {
                            rentalModel.updateOne({
                                _id: newRental._id
                            }, {
                                imageUrl: uniqueName
                            })
                                .then(() => {
                                    console.log("Updated the rental picture");
                                    res.redirect('/rentals/list');
                                })
                                .catch(err => {
                                    console.log(`Error updating rental picture... ${err}`);
                                    res.redirect("/");
                                });
                        })
                        .catch(err => {
                            console.log(`Error adding rental pic... ${err}`);
                            res.redirect("/");
                        })
                }
            })
            .catch(err => {
                console.log(`Rental picture in database has not been updated`);
                res.redirect("/rentals/list");
            });

    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
});

router.get("/remove/:id", async (req, res) => {
    const rental = await getRentals()
    const rentals = rental.find(rental => rental._id.toString() === req.params.id);
    res.render('rentals/remove', {rental: rentals, title: "Remove Rental"});
})

router.post("/remove/:id", async (req, res) => {

    const rental = await rentalModel.findById(req.params.id);
    fs.unlinkSync("assets/" + rental.imageUrl);
    await rentalModel.findByIdAndDelete(req.params.id);
    res.redirect('/rentals/list');
})

router.get("/cart", (req, res) => {
    if (req.session.role) {
        if (req.session.role === "customer") {

            let cart = req.session.cart = req.session.cart || { rentals: [] };
            let hasRentals = cart.rentals.length > 0;
            if (cart.hasRentals){
                cart.cartTotal = 0;
                cart.rentals.forEach(cartRental => {
                    cart.cartTotal += (cartRental.rental.pricePerNight * cartRental.numOfNights);
                })
            }
            if (!hasRentals) {
                req.session.cart = {
                    hasRentals: hasRentals,
                    rentals: [],
                    cartTotal: 0
                }
            } else {
                req.session.cart = cart;
            }

            res.render("rentals/cart", {
                title: "Rental List",
                rentalCart: req.session.cart
            })
        } else {
            res.status(401).send(`Unauthorized access: You do not have the required role of customer.`)
        }
    } else {
        res.status(401).send("Unauthorized access: You must be logged in to access this page.");
    }
})

router.get("/add-rental/:id", async (req, res) => {
    if (req.session.role === "customer") {
        let cart = req.session.cart = req.session.cart || { rentals: [] };
        let rentals = await getRentals();
        let rental = rentals.find(rental => rental._id.toString() === req.params.id);

        if (rental) {
            let found = false;

            if (cart.hasRentals) {
                cart.rentals.forEach(cartRental => {
                    if (cartRental._id.toString() === req.params.id) {
                        found = true;
                        cartRental.numOfNights++;
                    }
                })
            }
            if (!found){
                cart.rentals.push({
                    _id: req.params.id,
                    numOfNights : 1,
                    rental
                });
                cart.hasRentals = true;

                cart.rentals.sort((a, b) => a.rental.headline.localeCompare(b.rental.headline));
            }

            req.session.cart = cart;
        } else {
            res.status(401).send("The rental was not found in the database.");
        }
    } else {
        res.status(401).send("Unauthorized access: You must be logged in as a customer to access this page.");
    }

    res.redirect("/rentals/cart");
})

router.get("/remove-rental/:id", (req,res)=>{
    let cart = req.session.cart;
    if (cart.hasRentals) {
        cart.rentals = cart.rentals.filter(cartRental => cartRental._id.toString() !== req.params.id);
    }
    req.session.cart = cart;
    res.redirect("/rentals/cart");
})

router.get("/place-order", (req, res) => {
    const mailjet = require('node-mailjet').apiConnect(
        process.env.MJ_APIKEY_PUBLIC,
        process.env.MJ_APIKEY_PRIVATE
    )
    const request = mailjet.post('send').request({
        FromEmail: 'azabihi1@myseneca.ca',
        FromName: 'Rento',
        Subject: 'Thank you for your order!',
        'Text-part':
            `Dear ${req.session.user.firstName} ${req.session.user.lastName}, thank you for your order!`,
        'Html-part':
            '<h3>Dear ${req.session.user.firstName} ${req.session.user.lastName}, thank you for your recent order of:<br/>',
        Recipients: [{Email: req.session.user.emailAddress}],
    })
    req.session.cart.rentals.forEach(cartRental => {
        request['Html-part'] += `<p>${cartRental.rental.headline} for ${cartRental.numOfNights} nights</p>`;
    });
    request['Html-part'] += '</h3>';
    request
        .then(result => {
            console.log("Email sent:", result.body)
        })
        .catch(err => {
            console.log(err.statusCode)
        })
    req.session.cart = undefined;
    res.redirect("/rentals/cart");
})

router.get("/increase/:id", (req, res) => {
    let cart = req.session.cart = req.session.cart || { rentals: [] };
    if (cart.hasRentals) {
        cart.rentals.forEach(cartRental => {
            if (cartRental._id.toString() === req.params.id) {
                cartRental.numOfNights++;
            }
        })
    }
    req.session.cart = cart;
    res.redirect("/rentals/cart");
})
router.get("/decrease/:id", (req, res) => {
    let cart = req.session.cart = req.session.cart || { rentals: [] };
    if (cart.hasRentals) {
        cart.rentals.forEach(cartRental => {
            if (cartRental._id.toString() === req.params.id) {
                cartRental.numOfNights--;
                if (cartRental.numOfNights <= 0){
                    cart.rentals = cart.rentals.filter(cartRental => cartRental._id.toString() !== req.params.id);
                }
            }
        })
    }
    req.session.cart = cart;
    res.redirect("/rentals/cart");
})
router.post("/add", (req, res) => {
    const {headline, numSleeps, numBedrooms, numBathrooms, pricePerNight, city, province, featuredRental} = req.body;

    const newRental = new rentalModel({
        headline,
        numSleeps,
        numBedrooms,
        numBathrooms,
        pricePerNight,
        city,
        province,
        featuredRental: !!featuredRental,
    });

    newRental.save()
        .then(newRental => {
            console.log(`Rental ${newRental.headline} has been added to the database.`);

            const imageFile = req.files.imageUrl;
            let uniqueName = `rental-pics/${newRental._id}${path.parse(imageFile.name).ext}`;
            imageFile.mv(`assets/${uniqueName}`)
                .then(()=> {
                    rentalModel.updateOne({
                        _id: newRental._id
                    }, {
                        imageUrl: uniqueName
                    })
                        .then(() => {
                            console.log("Updated the rental picture");
                            res.redirect("/");
                        })
                        .catch(err => {
                            console.log(`Error updating rental picture... ${err}`);
                            res.redirect("/");
                        });
                })
                .catch(err => {
                    console.log(`Error adding rental pic... ${err}`);
                    res.redirect("/");
                })
        })
        .catch(err => {
            console.log(`Error adding rental to the database ... ${err}`);
            res.render("rentals/add", {
                title: "Add Rental",

            });
        });
})

module.exports = router;