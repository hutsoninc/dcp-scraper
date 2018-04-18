require('dotenv').config();
const mongoose = require('mongoose');

var today = new Date();
var todayString = (today.getMonth() + 1) + '-' + today.getDate() + '-' + today.getFullYear();


exports.startup = function(){

	return new Promise(function(resolve, reject){
			
		// Set up default mongoose connection
		var mongoDB = process.env.DB_LOCATION;

		mongoose.connect(mongoDB, function(err) {

			if(err) return logger.error(err);

		});

		// Get the default connection
		var db = mongoose.connection;

		db.on('connected', function(ref){

			console.log('MongoDB connected');
			resolve();

		});

		db.on('error', function(err){

			console.log('MongoDB error: ' + err);
			reject(err);

		});

	});

}