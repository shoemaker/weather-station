var MongoClient = require('mongodb').MongoClient; 

// Init other dependencies
var c = require('../config').config;  // App configuration
var models = require('../models/models');
var twitter = require('../controllers/twitter');
var weather = require('../controllers/weather');
var helper = require('../helper');


/* 
 * Save a new weather reading. 
 */
exports.saveReading = function(req, res) {
    var response = models.wrapper();  // Common response wrapper
        
    if (!req.query.shortCode) {  // Check for a shortCode (required)
        response.message = 'No shortCode provided.';
        response.isSuccessful = false;
        res.status(500).json(response);
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
            
            // Craft a query to update the record
            var query = { 'shortCode' : req.query.shortCode };
        
            // Save the new reading, return a response
            MongoClient.connect(helper.buildMongoURL(c.dbs.common), function(err, db) {
                if(!err) {
                    var collection = db.collection('weather');                        
                    collection.update(query, { $push : { 'readings' : newReading }, $set : { dateUpdated : new Date() } }, {safe:false}, function(err, result) {
                        db.close(function() {
                            if (err) {
                                response.message = 'Encountered error: ' + err + '.';
                                response.isSuccessful = false;
                                res.status(500).json(response);
                            } else {
                                response.message = 'Successfully added new reading.';
                                response.data = newReading;
                                res.status(200).json(response);    
                            }                               
                        });
                    })
                } else {
                    response.message = 'Encountered error connecting to database.' + err + '.';
                    response.isSuccessful = false;
                    res.status(500).json(response);
                }
            });
        } else {
            response.message = 'Did not provide one of the following: tempC, humidity, light.';
            response.isSuccessful = false;
            res.status(500).json(response);            
        }
    }
};

/*
 * Return weather readings by a short code. 
 * This is a work-in-progress. Not needed... yet. 
 */
exports.getByShortCode = function(req, res) {
    var response = models.wrapper();  // Common response wrapper

    if (!req.query.shortCode) {  // Check for a shortCode (required)
        response.message = 'No shortCode provided.';
        response.isSuccessful = false;
        res.status(500).json(response);
    } else {    
        // Build query
        var query = { shortCode : req.query.shortCode };

        // TODO: Do something with this. 
    } 
};


/*
 * Look up the details to tweet a new reading, then tweet it. 
 */
function tweetWeather(shortCode, newReading) {
    // Find the Twitter name for this shortCode
    weather.getWeatherData({ 'shortCode' : shortCode }, { twitter : 1, location : 1 }, function(err, station) { 
        if(!err) { 
            if (!err && station.twitter) { 
                var twitterUsername = station.twitter;

                // Now, look up the user details for this Twitter name to grab token
                MongoClient.connect(helper.buildMongoURL(c.dbs.common), function(err, db) { 
                    db.collection('users', {safe:false}, function(err, collection) {
                        collection.findAndModify({'twitter' : twitterUsername }, [['_id','asc']], { $set : { dateAccessed : new Date() } }, {}, function(err, data) {
                            var user = data.value;

                            // Tweet it.
                            twitter.tweetWeather(user, station, newReading, function(err, result) {
                                // No follow up, this is a fire-and-forget action. 
                            });
                            
                            db.close(function() {
                                // console.log('Weather tweeted, closing DB connection.');
                            });
                        });
                    });
                });
            } else {
                console.log('No Twitter username for ' + shortCode);
                console.log('\n');
            }
        }
    });
}