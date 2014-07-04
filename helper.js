/*
 * Build the connection string to the MongoDB instance for this application.
 */
exports.buildMongoURL = function(dbConfig) { 
	if(dbConfig.dbUsername && dbConfig.dbPassword) {
		return 'mongodb://' + dbConfig.dbUsername + ':' + dbConfig.dbPassword + '@' + dbConfig.dbHost + ':' + dbConfig.dbPort + '/' + dbConfig.dbName + '?auto_reconnect=true&safe=true';
	} else { 
		return 'mongodb://' + dbConfig.dbHost + ':' + dbConfig.dbPort + '/' + dbConfig.dbName + '?auto_reconnect=true&safe=true'; 
	}
};