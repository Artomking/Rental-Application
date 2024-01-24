const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        require: true
    },
    lastName: {
        type: String,
        require: true
    },
    emailAddress: {
        type: String,
        require: true,
        unique: true
    },
    password: {
        type: String,
        require: true
    }
});

userSchema.pre("save", function (next) {
    let user = this;

    bcryptjs.genSalt()
        .then(salt => {
            bcryptjs.hash(user.password, salt)
                .then(hashedPwd => {
                    user.password = hashedPwd;
                    next();
                })
                .catch(err => {
                    console.log(`Error occurred when hashing ... ${err}`);
                });
        })
        .catch(err => {
            console.log(`Error occurred when salting ... ${err}`);
        });
});

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;