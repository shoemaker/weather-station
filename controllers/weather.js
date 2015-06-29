var MongoClient = require('mongodb').MongoClient;
var moment = require('moment');
var _ = require('lodash');

var c = require('../config').config,  // App configuration
    models = require('../models/models'),
    helper = require('../helper');


/*
 * Retreive weather data for a query. 
 */ 
exports.getWeatherData = function(query, projection, callback) { 
    if (!projection.readings) {
        projection.readings = { $slice : -1 };
    }

    MongoClient.connect(helper.buildMongoURL(c.dbs.common), function(err, db) { 
        if(!err) {  
            var collection = db.collection('weather');       
            collection.findOne(query, projection, function(err, data) { 
                if (err) {
                    db.close(function() {
                        callback(err, null);
                    });
                } else { 
                    // First, calculate the min/max value
                    var minTemp, maxTemp, minHumidity, maxHumidity;
                    _.forEach(data.readings, function(currReading) {
                        if (!maxTemp || currReading.tempC > maxTemp)
                            maxTemp = currReading.tempC;
                        if (!minTemp || currReading.tempC < minTemp)
                            minTemp = currReading.tempC;
                        if (!maxHumidity || currReading.humidity > maxHumidity)
                            maxHumidity = currReading.humidity;
                        if (!minHumidity || currReading.humidity < minHumidity)
                            minHumidity = currReading.humidity;
                    });
                    
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
                    if (data.twitter) { response.twitter = data.twitter; }
                    if (data.location) { response.location = data.location; }
                
                    db.close(function() {
                        callback(null, response);                           
                    });
                }
            });
        } else {
            callback(err, null);
        }
    });
}