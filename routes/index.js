var fs = require('fs');  
var hogan = require('hogan.js');  // Library for Mustache templates
var moment = require('moment');
var mongo = require('mongodb');  // Init MongoDB library

// Init other dependencies
var c = require('../config').config;  // App configuration
var models = require('../models/models');
var helper = require('../helper');

// Init Mongo
var Db = mongo.Db;
var ObjectID = mongo.ObjectID;

/* 
 * Handler to return the default page
 */
exports.index = function(req, res) {
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
            var endDate = moment();
            var duration = moment.duration(endDate.diff(startDate));
            var durationDisplay = Math.round(duration.asDays()) + ' days, ' + duration.hours() + ' hours, ' + duration.minutes() + ' minutes, ' + duration.seconds() + ' seconds';

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
            retrieveWeatherData(query, projection, function(err, result) {
                if (!err) {
                    result.duration = durationDisplay;
                    result.displayOfflineMsg = c.displayOfflineMsg;
                    var output = template.render(result);  // Transform the template with the weather data. 
                    res.end(output);
                } else {
                    console.log('Encountered error retrieving weather data. ' + err);
                    res.end('Encountered error retrieving weather data. ' + err);
                }
            });
        }
    });
};

/*
 * Retreive weather data for a query. 
 */ 
function retrieveWeatherData(query, projection, callback) {
    Db.connect(helper.buildMongoURL(c.dbs.common), function(err, db) {
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