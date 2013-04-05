<!DOCTYPE html>
<html>
	<head>
	    <meta charset="utf-8">
	    <title>Home Weather Station</title>
	    <meta name="viewport" content="width=device-width, initial-scale=1.0">
	    <meta name="description" content="Home weather station powered by Arduino.">
	    <meta name="author" content="Brian Shoemaker">
		<link href="/weather/css/bootstrap.min.css" rel="stylesheet">
		<style type="text/css">
			.hero-unit {
				margin-top: 20px;
				padding: 20px;
			}
		</style>
		<link rel="stylesheet" href="/weather/css/bootstrap-responsive.css">
		<link href="/weather/css/style.css" rel="stylesheet">
	    <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
	    <!--[if lt IE 9]>
	      <script src="http://html5shim.googlecode.com/svn/trunk/html5.js"></script>
	    <![endif]-->
		<script type="text/javascript">
		
		  var _gaq = _gaq || [];
		  _gaq.push(['_setAccount', 'UA-2808579-5']);
		  _gaq.push(['_setDomainName', 'shoe.io']);
		  _gaq.push(['_trackPageview']);
		
		  (function() {
		    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
		    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
		    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
		  })();
		
		</script>
	</head>
	<body>
	
		<div id="wrap">

			<div id="projectMessage" class="alert alert-block">
				<h4>This project is no longer being updated.</h4>
				<p>
					As of XXXX the home weather station project has been taken offline.
				</p>
			</div>

			<div class="jumbotron masthead">
				<div class="container">
					<div class="row">
						<div class="span5 offset1">
							<h3>Temperature</h3>
							<h1>{{lastReading.tempF}} F</h1>
						</div>
						<div class="span5">
							<h3>Humidity</h3>
							<h1>{{lastReading.humidity}}%</h1>
						</div>
						<div class="span1"></div>
					</div>
					<small>
						Home weather station powered by Arduino. <br />
						Total uptime: {{duration}}.
					</small>
				</div>
			</div>

			<div class="container">
				<div class="row">
					<div class="span12">
						<h3>Temperature</h3>
						<p>
							Hourly temperature readings over the past seven days.
						</p>
						<div id="chart1"><i class="icon-fire"></i> Loading...</div>
					</div>
				</div>
				<div class="row">
					<div class="span12">
						<h3>Temperature vs. Humidity</h3>
						<p>
							Comparing temperature and humidity change over the past seven days.
						</p>
						<div id="chart2"><i class="icon-fire"></i> Loading...</div>
					</div>
				</div>
			</div>
			<div class="container" style="margin-top:20px;">
				<div class="row">
					<div class="span12">
						<h3>Project Details</h3>
					</div>
				</div>
				<div class="row">
					<div class="span6">
						<p>
							Arduino sketch available on <a href="https://github.com/shoemaker/arduino-weather-station" target="_blank">GitHub</a>.
						</p>
						<p>
							This project combines an 
							<a href="https://www.adafruit.com/products/50" target="_blank">Arduino Uno R3</a>, 
							<a href="https://www.adafruit.com/products/385" target="_blank">DHT temperature-humidity sensor</a>,
							<a href="http://amzn.com/B003B22UR0" target="_blank">20x4 LCD display</a> and an
							<a href="https://www.adafruit.com/products/201" target="_blank">Ethernet shield</a> to create a basic in-home weather station.
						</p>
						<p>
							The Arduino checks the temperature and humidity (and light level via a photoresistor) every five seconds. 
							If the temperature has gone up since the last reading, the RBG LED turns red. If the temperature goes down, the LED turns blue. 
							If no change occurred, the LED is green. Current conditions are displayed on the LCD display. Every hour the Arduino connects to an API (Node.js) and saves the reading to a database (MongoDB). 
							It also <a href="http://www.twitter.com/shoe_sandbox" target="_blank">tweets</a> the current conditions. 
							The charts on this site compile the readings from the previous seven days. 
						</p>
						<p>
							There is an inverse relationship between temperature  
							and humidity in my home. I suspect this is evidence of the dehumidifier that runs when the central air system is running. 
							Also, the timing on the Arduino seems to &quot;drift&quot;. I programmed the Arduino to save a reading every hour, using the number 
							of milliseconds the program has been running as a counter. Over the first week of this project the 
							counter was off by about 31 minutes. I corrected this problem by querying the current time from a 
							<a href="http://tf.nist.gov/tf-cgi/servers.cgi" target="_blank">NIST Internet Time Service</a>, resetting the interval each hour.
						</p>
						<p>
							Follow hourly updates at <a href="http://twitter.com/shoe_sandbox" target="_blank">@shoe_sandbox</a>. 
						</p>
					</div>
					<div class="span6">
						<a href="./weather/img/weatherStation.jpg" target="_blank">
							<img src="./weather/img/weatherStation_small.jpg" class="img-polaroid" />
						</a>
					</div>
				</div>
			</div>
			<div id="push"></div>
		</div>

		<footer>
			<h4>
				Made by <a href="http://twitter.com/shoemaker" target="_blank">@shoemaker</a>
			</h4>
			<p>
				Built with <a href="http://www.arduino.cc" target="_blank">Arduino</a>, <a href="http://nodejs.org/" target="_blank">Node.js</a>, <a href="http://www.mongodb.org/" target="_blank">MongoDB</a>, <a href="http://mustache.github.com/" target="_blank">Mustache</a>, <a href="https://developers.google.com/chart/" target="_blank">Google Charts</a> and <a href="http://twitter.github.com/bootstrap/" target="_blank">Bootstrap</a>.
			</p>
		</footer>	
		
		<script src="http://code.jquery.com/jquery-latest.min.js"></script>
		<script src="/weather/js/bootstrap.min.js"></script>
		<script type="text/javascript" src="https://www.google.com/jsapi"></script>
		<script type="text/javascript" src="/weather/js/script.js"></script>
		<script type="text/javascript">
			var readings = {{{readings}}};
			var readingsPercent = {{{readingsPercent}}};
			var extremes = { minTemp : {{minTemp}}, maxTemp : {{maxTemp}}, minHumidity : {{minHumidity}}, maxHumidity : {{maxHumidity}} };
		</script>		
	</body>
</html>

