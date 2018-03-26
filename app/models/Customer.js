const mongoose = require('mongoose');

var Schema = mongoose.Schema;

var customerSchema = new Schema({
	branch: String,
	email: String,
	emmaAccount: String,
	fullName: String
});

module.exports = mongoose.model('Customer', customerSchema);