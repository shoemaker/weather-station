var hogan = require("hogan.js");  // Library for Mustache templates
var fs = require('fs');  // File system access
var express = require('express');  // Express framework

var moment = require('./lib/moment');
var mongo = require('mongodb');  // Init MongoDB library
var c = require('./config').config;  // App configuration
var models = require('./models/models');
var twitter = require('./controllers/twitter');

/* Initialize Dependencies */
var app = express();
app.use(express.cookieParser());
app.use(express.session({secret: 'foo'}));
app.use(express.bodyParser());
var Db = mongo.Db;
var ObjectID = mongo.ObjectID;

// Define paths for serving up static content. 
app.use('/weather/css', express.static(__dirname + '/css'));
app.use('/weather/js', express.static(__dirname + '/js'));
app.use('/weather/img', express.static(__dirname + '/img'));


// Handler to return the default page
app.get('/weather', function(req, res) {

	// TODO: Define the data structure first? 
	
	// Load the default template
	fs.readFile('./views/default.ms', 'utf8', function (err, msTemplate) {
	    if (err) { 
		   	console.log('Encountered error reading template. ' + err);
		   	res.end(JSON.stringify(err));
		} else {
			var template = hogan.compile(msTemplate.toString());  // Compile the Moustache template.
			
			// Calculate how long this project has been running. 
			// The first read date was 01/13/2013 at 17:36. 
			var startDate = moment('01/13/2013 17:36', 'MM/DD/YYYY HH:mm');
			var endDate = moment('04/14/2013 06:22:34', 'MM/DD/YYYY HH:mm:ss');
			var duration = moment.duration(endDate.diff(startDate));
			var durationDisplay = Math.round(duration.asDays()) + ' days, ' + duration.hours() + ' hours, ' + duration.minutes() + ' minutes, ' + duration.seconds() + ' seconds';
			
			// Craft a query for this view
/*
			var endDate = moment();
			var startDate = moment().subtract('days', 7);
			var query = { 
				'shortCode' : c.shortCode,
				$and: [
					{ 'readings.readDate' : { $gt: startDate.toDate() } },
					{ 'readings.readDate' : { $lt: endDate.toDate() } }
				]
			};			
*/
/*
			Using Mongo, I cannot craft a query that returns just a section of a subdocument. 
			This means I cannot query the array of readings within the parent document.
			Since I know I want 7 days worth of data, and I'm taking a reading every hour, just project the last 169 readings: (24*7)+1.
			http://stackoverflow.com/questions/6557508/mongodb-query-to-retrieve-one-array-value-by-a-value-in-the-array
			http://docs.mongodb.org/manual/reference/projection/slice/#_S_slice
			http://docs.mongodb.org/manual/reference/projection/elemMatch/			
*/
			var query = { shortCode : c.shortCode };
			var projection = { title : 1, readings : { $slice : -169 } };
						
			retrieveWeatherData(query, projection, function(err, result) {
				if (!err) {
					result.duration = durationDisplay;
					var output = template.render(result);  // Transform the template with the weather data. 
					res.end(output);
				} else {
					console.log('Encountered error retrieving weather data. ' + err);
					res.end('Encountered error retrieving weather data. ' + err);
				}
			});
		}
	});
});


function retrieveWeatherData(query, projection, callback) {
	Db.connect(buildMongoURL(c.dbs.common), function(err, db) {
		if(!err) {	
			db.collection('weather', {safe:false}, function(err, collection) {
				collection.findOne(query, projection, function(err, data){ 
					if (err) {
						db.close(function() {
							callback(err, null);
						});
					} else {
						// First, calculate the min/max value
						var minTemp, maxTemp, minHumidity, maxHumidity;
						for (var ii=0; ii<data.readings.length; ii++) {
							var currReading = data.readings[ii];
							if (!maxTemp || currReading.tempC > maxTemp)
								maxTemp = currReading.tempC;
							if (!minTemp || currReading.tempC < minTemp)
								minTemp = currReading.tempC;
							if (!maxHumidity || currReading.humidity > maxHumidity)
								maxHumidity = currReading.humidity;
							if (!minHumidity || currReading.humidity < minHumidity)
								minHumidity = currReading.humidity;
						}
						
						// Calculate the percentage change for each reading
						// newValue - oldValue / oldValue * 100
						// New formula: (Current-first)/(max-min)
						var readingsPercent = [];
						var newReading = models.reading();
						newReading.readDate = moment(data.readings[0].readDate).format('ddd h:mma');
						newReading.tempC = 0;
						newReading.humidity = 0;
						newReading.light = 0;
						readingsPercent.push(newReading);
						
						for (var ii=0; ii<data.readings.length; ii++) {
							data.readings[ii].tempF = Math.round(((data.readings[ii].tempC * 1.8) + 32)*100)/100;							
							data.readings[ii].readDate = moment(data.readings[ii].readDate).format('ddd h:mma');
							
							if (ii > 0) {
								newReading = models.reading();
								newReading.readDate = data.readings[ii].readDate;
								newReading.tempC = Math.round(((data.readings[ii].tempC - data.readings[0].tempC) / (maxTemp - minTemp))*10000)/10000;
								newReading.humidity = Math.round(((data.readings[ii].humidity - data.readings[0].humidity) / (maxHumidity - minHumidity))*10000)/10000;
								newReading.light = Math.round(((data.readings[ii].light - data.readings[0].light) / data.readings[0].light)*10000)/10000;
								readingsPercent.push(newReading);
							} 
						}
						
						var response = models.chartResponse();
						response.title = data.title;
						response.readings = JSON.stringify(data.readings);
						response.readingsPercent = JSON.stringify(readingsPercent);
						response.lastReading = data.readings[data.readings.length - 1];
						response.minTemp = minTemp;
						response.maxTemp = maxTemp;
						response.minHumidity = minHumidity;
						response.maxHumidity = maxHumidity;
						
						db.close(function() {
							callback(null, response);							
						});

					}
				});
			});
		} else {
			callback(err, null);
		}
	});
}


// Handler to save a new weather reading
app.post('/weather/api', function(req, res) {
	var response = models.wrapper();
		
	// Check for a shortCode (required)
	if (!req.query.shortCode) {
		response.message = 'No shortCode provided.';
		response.isSuccessful = false;
		res.json(500, response);
	} else {		
		// Build up a new reading object
		var post = req.body;
		if (post.tempC || post.humidity || post.light) {
			var newReading = models.reading();
			newReading.readDate = new Date();
			newReading.tempC = post.tempC;
			newReading.humidity = post.humidity;
			newReading.light = post.light;
		
			// If we're posting this to Twitter, fire off that request (fire-and-forget).
			tweetWeather(req.query.shortCode, newReading);
			
			// Craft a query to update the correct record
			var query = { 'shortCode' : req.query.shortCode };
		
			// Save the new reading, return a response
			Db.connect(buildMongoURL(c.dbs.common), function(err, db) {
				if(!err) {
					db.collection('weather', {safe:false}, function(err, collection) {
						
						collection.update(query, { $push : { 'readings' : newReading }, $set : { dateUpdated : new Date() } }, {safe:false}, function(err, result) {
							
							db.close(function() {
								if (err) {
									response.message = 'Encountered error: ' + err + '.';
									response.isSuccessful = false;
									res.json(500, response);
								} else {
									response.message = 'Successfully added new reading.';
									response.data = newReading;
								    res.json(200, response);	
								}								
							});
						});
					})
				} else {
					response.message = 'Encountered error connecting to database.' + err + '.';
					response.isSuccessful = false;
					res.json(500, response);
				}
			});
		} else {
			response.message = 'Did not provide at one of the following: tempC, humidity, light.';
			response.isSuccessful = false;
			res.json(500, response);			
		}
	}
});


// Handler to return weather readings for a date range
app.get(/weather\/api\/([0-9a-zA-Z]{6})/, function(req, res) {
	var response = models.wrapper();

	// Check for a shortCode (required)
	if (!req.query.shortCode) {
		response.message = 'No shortCode provided.';
		response.isSuccessful = false;
		res.json(500, response);
	} else {	
		// Build query
		var query = { shortCode : req.query.shortCode };
	}

	
});

app.listen(8085);


// Look up the details to tweet a new reading, then tweet it. 
function tweetWeather(shortCode, newReading) {
	var query = { 'shortCode' : shortCode };

	// Find the Twitter name for this shortCode
	Db.connect(buildMongoURL(c.dbs.common), function(err, db) {
		if(!err) {	
			db.collection('weather', {safe:false}, function(err, collection) {
				collection.findOne(query, { twitter : 1, location : 1 }, function(err, station){
					if (!err && station.twitter) { 
						var twitterUsername = station.twitter;

						// Now, look up the user details for this Twitter name to grab token
						db.collection('users', {safe:false}, function(err, collection) {
							collection.findAndModify({'twitter' : twitterUsername }, [['_id','asc']], { $set : { dateAccessed : new Date() } }, {}, function(err, user) {
								// Tweet it.
								twitter.tweetWeather(user, station, newReading, function(err, result) {
									// No follow up, this is a fire-and-forget action. 
								});
							});
						});
					} else {
						console.log('No Twitter username for ' + shortCode);
						console.log('\n');
					}
				});
			});
		}
	});
}


// Build the connection string to the MongoDB instance for this application
function buildMongoURL(dbConfig) { 
	if(dbConfig.dbUsername && dbConfig.dbPassword) {
		return 'mongodb://' + dbConfig.dbUsername + ':' + dbConfig.dbPassword + '@' + dbConfig.dbHost + ':' + dbConfig.dbPort + '/' + dbConfig.dbName + '?auto_reconnect=true&safe=true';
	} else { 
		return 'mongodb://' + dbConfig.dbHost + ':' + dbConfig.dbPort + '/' + dbConfig.dbName + '?auto_reconnect=true&safe=true'; 
	}
}

// Add C#-ish string formatting to JavaScript. 
String.prototype.format = function() { 
	var args = arguments; 
	return this.replace(/{(\d+)}/g, function(match, number) { 
		return typeof args[number] != 'undefined' 
			? args[number] 
			: match
		;
	});
};