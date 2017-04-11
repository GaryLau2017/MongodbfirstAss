var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var restaurantSchema = new Schema({
	address: {
		street: String,
		zipcode: String,
		building: String,
		coord: [Number, Number]
	},
	borough: String,
	cuisine: String,
	grades: [{
			date: {type: Date, default: Date.now},
			grade: String,
			score: Number
		}],
	name: String,
	restaurant_id: Number
});

module.exports = restaurantSchema;
