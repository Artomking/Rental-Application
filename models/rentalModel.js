const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const rentalSchema = new mongoose.Schema({
    headline : {
        type: String,
        require: true
    },
    numSleeps : {
        type: Number,
        require: true
    },
    numBedrooms : {
        type: Number,
        require: true
    },
    numBathrooms : {
        type: Number,
        require: true
    },
    pricePerNight : {
        type: Number,
        require: true
    },
    city : {
        type: String,
        require: true
    },
    province : {
        type: String,
        require: true
    },
    imageUrl : {
        type: String,
        require: true
    },
    featuredRental : {
        type: Boolean,
        require: true
    }
});

const rentalModel = mongoose.model("rentals", rentalSchema);

module.exports = rentalModel;