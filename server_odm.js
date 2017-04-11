var http = require('http');
var url  = require('url');
var mongoose = require('mongoose'); 
var assert = require('assert');
var mongourl = 'mongodb://localhost:27017/test';

var restaurantSchema = require('./restaurant');

var server = http.createServer(function (req,res) {
	console.log("INCOMING REQUEST: " + req.method + " " + req.url);

	var parsedURL = url.parse(req.url,true); //true to get query as object
	var query = parsedURL.query;
	if (!(
		parsedURL.pathname == '/' ||
		parsedURL.pathname == '/display' ||
		parsedURL.pathname == '/create' ||
		parsedURL.pathname == '/read' ||
		parsedURL.pathname == '/update' ||
		parsedURL.pathname == '/delete' 
		)) {
		res.writeHead(404, {"Content-Type": "text/plain"});
		res.write("404 Not Found\n");
		res.end();
	}
	else {
		switch(parsedURL.pathname) {
			case "/":
				displayBorough(res);
				break;
			case "/display":
				display(res, query);
				break;
			case "/read":
				read_n_print(res, query);
				break;
			case "/create":
				insertOne(res, query);
				break;
			default:
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.write(parsedURL.pathname + " not available yet\n");
				res.end();
		}
	}
});

function read_n_print(res, query) {
		mongoose.connect(mongourl);
		var db = mongoose.connection;
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function(callback){
			console.log('Connected to MongoDB\n');
			var Restaurant = mongoose.model('Restaurant', restaurantSchema);
			if(Object.keys(query).length === 0){
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.write(parsedURL.pathname + " data set too large\n");
				res.end();
			} else {
				Restaurant.find(query, function(err, restaurants){
					if(err) return console.error(err);
					db.close();
					mongoose.disconnect();
					console.log('Disconnected MongoDB\n');
					print(res, JSON.stringify(query), restaurants);
				});
			}
		});
}

function print(res, query, restaurants){
	res.writeHead(200, {"Content-Type": "text/html"});
	res.write('<html><head><title>Restaurant</title></head>');
	res.write('<body><H1>Restaurants</H1>');
	res.write('<H2>Showing '+restaurants.length+' document(s)</H2>');
	res.write('<H3>Criteria: ' + query + '</H3>');
	res.write('<ol>');
	for (var i in restaurants) {
		res.write('<li><a href="display?_id='+restaurants[i]._id+'">'+restaurants[i].name+'</a></li>');
	}
	res.write('</ol>');
	res.end('</body></html>');
}

function insertOne(res, query) {
	mongoose.connect(mongourl);
	var db = mongoose.connection;
	db.on('error', console.error.bind(console, 'connection error:'));
	db.once('open', function (callback) {
		var Restaurnat = mongoose.model('Restaurant', restaurantSchema);
		var obj = {
			"address" : {
				"street"   : query.street,
				"zipcode"  : query.zipcode,
				"building" : query.building,
				"coord"   : [query.long, query.lat]
			},
			"borough" : query.borough,
			"cuisine" : query.cuisine,
			"grades"  : [  ],
			"name"    : query.name,
			"restaurant_id" : query.id
		};
		var newRestaurant = new Restaurnat(obj);
		newRestaurant.save(function(err) {
			if (err) throw err //or assert.equal(err,"save() error");

			console.log("Inserted a restaurant into the restaurants collection.");
			db.close();
			mongoose.disconnect();
			console.log('Disconnected MongoDB\n');
			res.writeHead(200, {"Content-Type": "text/html"});
			res.write('<html><head><title>Restaurant</title></head>');
			res.write('<body>Inserted a restaurant into the restaurants collection.');
			res.end('</body></html>');
		});
	});	
}

function displayBorough(res) {
		mongoose.connect(mongourl);
		var db = mongoose.connection;
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function(callback){
			console.log('Connected to MongoDB\n');
			var Restaurant = mongoose.model('Restaurant', restaurantSchema);
			Restaurant.find().distinct('borough', function(error, restaurants){
				db.close();
				mongoose.disconnect();
				console.log('Disconnected MongoDB\n');
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write('<html><head><title>Restaurant</title></head>');
				res.write('<body><form method="GET" action="read">');
				res.write('<font size="5"> Borough: </font> ');
				res.write('<select name="borough">');
				for (var i in restaurants) {
					res.write('<option value="'+restaurants[i]+'">'+restaurants[i]+'</option>');
				}
				res.write('</select> ');
				res.write('<input type="submit" value="Search" />');
				res.end('</form></body></html>');
			});
		});


}

function display(res, query){
		mongoose.connect(mongourl);
		var db = mongoose.connection;
		db.on('error', console.error.bind(console, 'connection error:'));
		db.once('open', function(callback){
			console.log('Connected to MongoDB\n');
			var Restaurant = mongoose.model('Restaurant', restaurantSchema);
			Restaurant.find({"_id": mongoose.Types.ObjectId(query._id)}, function(err, restaurants){
				if(err) return console.error(err);
				db.close();
				mongoose.disconnect();
				console.log('Disconnected MongoDB\n');
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write('<html><head><title>Restaurant</title></head>');
				res.write('<body>');
				restaurant = restaurants[0];
				res.write('<H3>Name: '+ restaurant.name +'</H3>');
				res.write('<H3>Borough: '+ restaurant.borough +'</H3>');
				res.write('<H3>Cuisine: '+ restaurant.cuisine +'</H3>');
				res.write('<H3>Address: </H3>');
				res.write('<p>'+ restaurant.address.building + ', ' + restaurant.address.street + ', ' + restaurant.address.zipcode +'</p>');

				res.write('<input type="button" onclick="window.history.back()" value="Go back" />');
				res.end('</body></html>');
			});
		});
}

server.listen(process.env.PORT || 8099);
