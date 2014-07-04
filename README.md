# Weather-Station

Website and API for a simple Arduino-powered [weather station](http://shoe.io/weather). 

## Configuration
Install dependencies. 
    
    $ npm install
    $ bower install

Rename 'sample-config.js' to 'config.js' or obtain the decryption key for the Makefile. Twitter authentication is used for tweeting each weather reading. 

Fire up the site

    $ npm start

Navigate to http://localhost:8085/weather

## Save a Reading
When the Arudino weather station submits a new reading, it uses the following: 

* HTTP POST 
* http://localhost:8085/weather/api?shortCode=&lt;shortCode&gt; 
* Payload: `{ "tempC" : 20.6, "humidity" : 27.9, "light" : 175 }` 