exports.conditions = function() {
	
	var obj = {
		location : {
			latitude: null,
			longitude: null,
			isIndoors: false
		},
		shortCode : '',
		dateCreated : new Date(),
		dateUpdated : new Date(),
		hitCount : 0,
		twitter : null,
		readings : []
	}
	
	return obj;
};

exports.reading = function() {
	var obj = { 
		readDate : null,
		tempC: null,
		humidity: null,
		light: null
	}

	return obj;
};

exports.chartResponse = function() {
	var obj = { 
		title : null, 
		readings : [], 
		readingsPercent : [], 
		lastReading : null,
		minTemp : null,
		maxTemp : null,
		minHumidity : null,
		maxHumidity : null
	};
	
	return obj;
}

exports.wrapper = function() {
	
	var obj = {
		isSuccessful : true,
		message : null,
		data : {}
	}
	
	return obj;
}