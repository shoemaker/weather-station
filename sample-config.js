exports.config = {
	portNum : 8085,
	displayOfflineMsg : false,  // Set to true when we're this project is taken offline. 
	dbs : {
		common : {
			dbHost: '',
			dbPort: 00000,
			dbName: '',
			dbUsername: '',
			dbPassword: ''			
		}
	},
	twitter : {
		consumerKey : '',
		consumerSecret : '',
		rootUrl : 'api.twitter.com',
		requestPath : '/oauth/request_token',
		authorizePath : '/oauth/authenticate?oauth_token={0}',
		tokenPath : '/oauth/access_token',
		callbackUrl : ''
	},
	shortCode : ''
};