var https = require('https');
var moment = require('../lib/moment');
var OAuth = require('../lib/node-oauth/oauth').OAuth;  // Using this rather than NPM install to resolve "!" when POSTing to Twitter.
var c = require('../config').config;  // App configuration

var oa = new OAuth(
	'http://' + c.twitter.rootUrl + c.twitter.requestPath,
	'http://' + c.twitter.rootUrl + c.twitter.tokenPath,
	c.twitter.consumerKey,
	c.twitter.consumerSecret,
	'1.0A',
	null,
	'HMAC-SHA1'
);


// Tweet weather details for a specific user
exports.tweetWeather = function(user, station, reading, callback) {
	// Build up the tweet text
	var readDate = moment(reading.readDate);
	var statusText = '[' + readDate.format('ddd MMM Do, h:mma') + ']';
	statusText += ' Temperature: ' + (Math.round(((reading.tempC * 1.8) + 32)*100)/100) + ' F, ' + reading.tempC + ' C; Humidity: ' + reading.humidity + '%; Light: ' + (Math.round((reading.light / 1024)*10000)/100) + '%. ';
	statusText += 'http://shoe.io/weather';

	// Build up the params for this tweet
	var params = {
		'status' : statusText,
		'lat' : station.location.latitude,
		'long' : station.location.longitude,
		'display_coordinates' : 'false'  // Don't want to display the exact location?
	};

	// Send the tweet
	oa.post("https://api.twitter.com/1.1/statuses/update.json",
		user.services.twitter.token, user.services.twitter.tokenSecret, params, 
        	function (err, data, response) {
	        	if(err){
		        	console.log('Failed to post new tweet for ' + station.twitter + '. ' + JSON.stringify(err));
		        } else {
			        // console.log('Posted new tweet to ' + station.twitter + '.');
			    }
		}
	);

}