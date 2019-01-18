const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var customerSchema = new Schema({
    branch: String,
    email: String,
    firstname: String,
    lastname: String,
});

module.exports = mongoose.model('Customer', customerSchema);
