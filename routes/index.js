var moment = require('moment');

// Init other dependencies
var c = require('../config').config;  // App configuration
var weather = require('../controllers/weather');

/* 
 * Handler to return the default page
 */
exports.index = function(req, res) {
    var model = {
        duration : null,
        displayOfflineMsg : c.displayOfflineMsg,
        error : null
    };

    // Calculate how long this project has been running. 
    // The first read date was 01/13/2013 at 17:36. 
    var startDate = moment('01/13/2013 17:36', 'MM/DD/YYYY HH:mm');
    var endDate = moment();
    var duration = moment.duration(endDate.diff(startDate));
    model.duration = Math.floor(duration.get('years')) + ' years, ' + duration.months() + ' months, ' + duration.days() + ' days, ' + duration.hours() + ' hours, ' + duration.minutes() + ' minutes, ' + duration.seconds() + ' seconds';

/*
    // Craft a query for this view
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
               
    // Retreive the weather, render it.  
    weather.getWeatherData(query, projection, function(err, result) {
        if (!err) {
            model.data = result;
        } else {
            console.log('Encountered error retrieving weather data. ' + err);
            model.error = 'Encountered error retrieving weather data. ' + err;
        }
    
        res.render('default', model);
    });
};

