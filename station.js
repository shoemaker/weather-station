var fs = require('fs');  
var path = require('path');
var express = require('express');  // Express framework
var bodyParser = require('body-parser');
var compress = require('compression');

// App configuration
if (!fs.existsSync('config.js')) {
    console.error('Config file [config.js] missing!');
    console.error('Either rename sample-config.js and populate with your settings, or run "make decrypt_conf".');
    process.exit(1);
}

var c = require('./config').config;  // App configuration
var twitter = require('./controllers/twitter');
var routes = require('./routes');
var api = require('./routes/api');

// Init Express
var app = express();
app.set('port', c.portNum || 3000);
app.use(compress());
app.use(bodyParser.json());

// Define routes. 
app.use('/weather/', express.static(path.join(__dirname, 'public')));  // Define path(s) for serving up static content. 
app.get('/weather', routes.index);
app.post('/weather/api', api.saveReading);  
app.get(/weather\/api\/([0-9a-zA-Z]{6})/, api.getByShortCode);

// Fire up the server. 
app.listen(c.portNum);
console.log('Server started on port', c.portNum + '.\nTry this: http://localhost:' + c.portNum + '/weather');
