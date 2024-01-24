const rentalModel = require('../models/rentalModel');

module.exports.getFeaturedRentals = async function () {
    let rentals = await rentalModel.find().lean();

    rentals.sort(function (a, b) {
        if (a.headline < b.headline) return -1;
        else if (a.headline > b.headline) return 1;
        else return 0;
    })

    let filtered = [];
    for (let i = 0; i < rentals.length; i++) {
        if (rentals[i].featuredRental) filtered.push(rentals[i]);
    }
    return filtered;
};

module.exports.getRentalsByCityAndProvince = async function () {
    let rentals = await rentalModel.find().lean();
    rentals.sort(function (a, b) {
        if (a.headline < b.headline) return -1;
        else if (a.headline > b.headline) return 1;
        else return 0;
    })

    let filtered = [];

    for (let i = 0; i < rentals.length; i++) {
        let key = `${rentals[i].city}, ${rentals[i].province}`;
        if (!filtered.find((array) => array.cityProvince === key)) {
            filtered.push({cityProvince: key, rentals: []});
        }
        let index = filtered.findIndex((array) => array.cityProvince === key);
        filtered[index].rentals.push(rentals[i]);
    }
    filtered.sort(function (a, b) {
        if (a.cityProvince < b.cityProvince) return -1;
        else if (a.cityProvince > b.cityProvince) return 1;
        else return 0;
    })
    return filtered;
};

module.exports.getRentals = async function () {
    return rentalModel.find().lean();
}