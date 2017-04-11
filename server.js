var http = require('http');
var url  = require('url');
var MongoClient = require('mongodb').MongoClient; 
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var mongourl = 'mongodb://localhost:27017/test';

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
			case "/read":
				read_n_print(res, query);
				break;
			case "/create":
				insertOne(res, query);
				break;
			case "/display":
				display(res, query);
				break;
			default:
				res.writeHead(500, {"Content-Type": "text/plain"});
				res.write(parsedURL.pathname + " not available yet\n");
				res.end();
		}
	}
});

function read_n_print(res, query) {
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			if(Object.keys(query).length === 0)
				findRestaurants(db,function(restaurants) {
					db.close();
					console.log('Disconnected MongoDB\n');
					print(res, null, restaurants);
				});
			else
				findRestaurantsByCriteria(db,query,function(restaurants) {
					db.close();
					console.log('Disconnected MongoDB\n');
					print(res, JSON.stringify(query), restaurants);
				});
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

function findRestaurants(db,callback) {
	var restaurants = [];
	cursor = db.collection('restaurants').find().limit(20); 
	cursor.each(function(err, doc) {
		assert.equal(err, null); 
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants); 
		}
	});
}

function findRestaurantsByCriteria(db,query,callback) {
	var restaurants = [];
	cursor = db.collection('restaurants').find(query); 
	cursor.each(function(err, doc) {
		assert.equal(err, null); 
		if (doc != null) {
			restaurants.push(doc);
		} else {
			callback(restaurants); 
		}
	});
}

function insertDocument(res, db, obj , callback){
	db.collection('restaurants').insertOne(obj, function(err, result) {
		assert.equal(err, null);
		console.log("Inserted a restaurant into the restaurants collection.");
		res.writeHead(200, {"Content-Type": "text/html"});
		res.write('<html><head><title>Restaurant</title></head>');
		res.write('<body>Inserted a restaurant into the restaurants collection.');
		res.end('</body></html>');
		callback(result);
	});
}

function insertOne(res, query) {
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			var obj = {
				"address" : {
					"street"   : query.street,
					"zipcode"  : query.zipcode,
					"building" : query.building,
					"coord:"   : [query.long, query.lat]
				},
				"borough" : query.borough,
				"cuisine" : query.cuisine,
				"grades"  : [  ],
				"name"    : query.name,
				"restaurant_id" : query.id
			};
			insertDocument(res, db, obj, function() {
				db.close();
				console.log('Disconnected MongoDB\n');
			});
		});
}

function displayBorough(res) {
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			findDistinctBorough(db, function(restaurants) {
				db.close();
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

function findDistinctBorough(db, callback) {
	db.collection("restaurants").distinct("borough", function(err, doc){
		assert.equal(err, null);
		if (doc != null) {
			callback(doc);
		} 
	});
}

function display(res, query){
		MongoClient.connect(mongourl, function(err, db) {
			assert.equal(err,null);
			console.log('Connected to MongoDB\n');
			displayRestaurantDetials(db, query, function(restaurant) {
				db.close();
				console.log('Disconnected MongoDB\n');
				res.writeHead(200, {"Content-Type": "text/html"});
				res.write('<html><head><title>Restaurant</title></head>');
				res.write('<body>');
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

function displayRestaurantDetials(db, query, callback){
	cursor = db.collection('restaurants').find({"_id": new ObjectId(query._id)}); 
	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			callback(doc);
		}
	});
}

server.listen(process.env.PORT || 8099);
