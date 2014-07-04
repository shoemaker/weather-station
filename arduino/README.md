# Arduino Weather Station

An Arduino sketch for an in-home weather station that [charts](http://shoe.io/weather) and [tweets](http://www.twitter.com/shoe_sandbox) the current conditions. 
This is my first project using Arduino.
You can see this project in action at [http://shoe.io/weather](http://shoe.io/weather).

## About
The Arduino checks the temperature and humidity (and light level via a photoresistor) every five seconds. 
If the temperature has gone up since the last reading, the RBG LED turns red. If the temperature goes down, the LED turns blue. 
If no change occurred, the LED is green. Current conditions are displayed on the LCD display. Every hour the Arduino connects to an API (Node.js) and saves the reading to a database (MongoDB). 
It also [tweets](http://www.twitter.com/shoe_sandbox) the current conditions. 

The timing on the Arduino seems to &quot;drift&quot;. I programmed the Arduino to save a reading every hour, using the number 
of milliseconds the program has been running as a counter. Over the first week of this project the 
counter was off by about 31 minutes. I corrected this problem by querying the current time from a 
[NIST Internet Time Service](http://tf.nist.gov/tf-cgi/servers.cgi), resetting the interval each hour.

## Components Used in This Project
* [Arduino Uno R3](https://www.adafruit.com/products/50)
* [DHT temperature-humidity sensor](https://www.adafruit.com/products/385)
* [20x4 LCD display](http://amzn.com/B003B22UR0)
* [Ethernet shield](https://www.adafruit.com/products/201)
* [RGB LED](https://www.adafruit.com/products/159)
* [Phtoresistor](https://www.adafruit.com/products/161)

## Dependencies
* [DHT Library from AdaFruit](https://github.com/adafruit/DHT-sensor-library)
* [LCD library from electroFUN](https://bitbucket.org/fmalpartida/new-liquidcrystal/downloads)

## Useful Tutorials
* [Repeating Web Client](http://arduino.cc/en/Tutorial/WebClientRepeating)
* [Network Time Protocol Client](http://arduino.cc/en/Tutorial/UdpNtpClient)

## Future Enhancements
I hope to add a [Fritzing](http://fritzing.org/) diagram detailing how the project was put together soon.

