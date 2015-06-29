var https = require('https');
var moment = require('moment');
var OAuth = require('oauth').OAuth; 
var _ = require('lodash');

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


/*
 * Tweet weather details for a specific user. 
 */
exports.tweetWeather = function(user, station, reading, callback) { 
    // Build up the tweet text
    var tweetTemplate = _.template('[<%=readDate%>] Temperature: <%=tempF%> F, <%=tempC%> C; Humidity: <%=humidity%>%; Light: <%=light%>%. http://shoe.io/weather');
    
    var readDate = moment(reading.readDate);
    var statusModel = {
        readDate : readDate.format('ddd MMM Do, h:mma'),
        tempF : (Math.round(((reading.tempC * 1.8) + 32)*100)/100),
        tempC : reading.tempC,
        humidity : reading.humidity,
        light : (Math.round((reading.light / 1024)*10000)/100)
    }
    var statusText = tweetTemplate(statusModel);

    // Build up the params for this tweet
    var params = {
        'status' : statusText,
        'lat' : station.location.latitude,
        'long' : station.location.longitude,
        'display_coordinates' : 'false'  // Don't want to display the exact location?
    };

    // Send the tweet
    oa.post('https://api.twitter.com/1.1/statuses/update.json',
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