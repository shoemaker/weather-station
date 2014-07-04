/* 
To wire up the DHT sensor:
Connect pin 1 (on the left) of the sensor to +5V
Connect pin 2 of the sensor to whatever your DHTPIN is
Connect pin 4 (on the right) of the sensor to GROUND
Connect a 10K resistor from pin 2 (data) to pin 1 (power) of the sensor

Tutorial for making repeated requests via the Ethernet shield: http://arduino.cc/en/Tutorial/WebClientRepeating
*/

// INCLUDE LIBRARIES
#include "DHT.h"  // DHT Library from AdaFruit: https://github.com/adafruit/DHT-sensor-library
#include <Wire.h>
#include <LCD.h>
#include <LiquidCrystal_I2C.h>  // LCD library from https://bitbucket.org/fmalpartida/new-liquidcrystal/wiki/Home
#include <SPI.h>
#include <Ethernet.h>
#include <EthernetUdp.h>  // http://arduino.cc/en/Tutorial/UdpNtpClient

// DEFINE LCD ATTRIBUTES
//#define I2C_ADDR    0x27  // Define I2C Address where the PCF8574A is. This was the erroneous default address.
#define I2C_ADDR    0x3F  // Define I2C Address where the PCF8574A is. This is the correct address.
#define BACKLIGHT_PIN     3
#define En_pin  2
#define Rw_pin  1
#define Rs_pin  0
#define D4_pin  4
#define D5_pin  5
#define D6_pin  6
#define D7_pin  7
LiquidCrystal_I2C       lcd(I2C_ADDR,En_pin,Rw_pin,Rs_pin,D4_pin,D5_pin,D6_pin,D7_pin);

// DEFINE DHT ATTRIBUTES
#define DHTPIN 2  // Arduino Pin for DHT
#define DHTTYPE DHT22   // DHT 22  (AM2302)
DHT dht(DHTPIN, DHTTYPE);

// DEFINE LED ATTRIBUTES
int red = 5;  // The red led pin.
int green = 6;  // The green led pin.
int blue = 7;  // The blue led pin.
int lightPin = 1;  // The photoresistor pin
float prevTemp = 0;  // Save the previous temperature for comparison. 

// DEFINE ETHERNET ATTRIBUTES
// Enter a MAC address for the Ethernet shield controller.
byte mac[] = {  0x90, 0xA2, 0xDA, 0x0D, 0x97, 0xA8 };
unsigned int localPort = 8888;  // local port to listen for UDP packets
IPAddress ip(192,168,2,114);
IPAddress myDns(8,8,8,8);  // IP address of DNS server (Google)
char server[] = "foo.com";  // Host for RESTful API to save readings.
IPAddress timeServer(132, 163, 4, 101); // time-a.timefreq.bldrdoc.gov NTP server
// IPAddress timeServer(132, 163, 4, 102); // time-b.timefreq.bldrdoc.gov NTP server
// IPAddress timeServer(132, 163, 4, 103); // time-c.timefreq.bldrdoc.gov NTP server
EthernetClient client;
EthernetUDP Udp;  // A UDP instance to let us send and receive packets over UDP

unsigned long lastConnectionTime = 0;  // last time we connected to the server, in milliseconds
unsigned long lastReadTime = 0;
boolean lastConnected = false;  // state of the connection last time through the main loop
unsigned long postingInterval = 3600000;  // delay until next time to post update.
const unsigned int READ_INTERVAL = 5000;     // This sets how long between readings (5 seconds)
const int NTP_PACKET_SIZE= 48;  // NTP time stamp is in the first 48 bytes of the message
byte packetBuffer[ NTP_PACKET_SIZE];  //buffer to hold incoming and outgoing packets 
String displayLocation = "Rosemount, MN";

void setup() {
    Serial.begin(9600); 
    Serial.println("Initializing 'Current Conditions' project."); 

    // Set the output pins for the RGB LED
    pinMode(red, OUTPUT);
    pinMode(green, OUTPUT);
    pinMode(blue, OUTPUT);
    
    dht.begin();  // Fire up the DHT (temp/humidity sensor).
    lcd.begin(20,4);  // Fire up the LCD.
  
    // Switch on the LCD backlight
    lcd.setBacklightPin(BACKLIGHT_PIN,POSITIVE);
    lcd.setBacklight(HIGH);
    lcd.home();  // Go home
    
    // Start the Ethernet connection:
    Ethernet.begin(mac, ip, myDns);
    Udp.begin(localPort);
    // print the Ethernet board/shield's IP address:
    Serial.print("My IP address: ");
    Serial.println(Ethernet.localIP());

    lcd.clear(); // clear display, set cursor position to zero
    lcd.print("Current Conditions");  
    lcd.setCursor(0, 1);        // go to the 2nd line
    lcd.print("Brian Shoemaker");
    lcd.setCursor(0, 2);        // go to the third line
    lcd.print("Warming up...");
    
    // Display a countdown.
    for (int ii=5; ii>0; ii--) {
        lcd.setCursor(14, 2);
        lcd.print(ii);
        delay(1000);  
    }
    
    lcd.clear(); // clear display, set cursor position to zero
    lcd.print("Current Conditions");  
    lcd.setCursor(0, 1); // go to the 2nd line
    lcd.print(displayLocation);
    
    // Sync up the clock
    syncClock();
}

void loop() {
    
    // if there's incoming data from the net connection, send it out the serial port.  This is for debugging purposes only.
    if (client.available()) { 
        char c = client.read();
        Serial.print(c);
    }
    
    // If there's no net connection, but there was one last time through the loop, then stop the client.
    if (!client.connected() && lastConnected) { 
        //Serial.println();
        //Serial.println("disconnecting.");
        client.stop();
    }
  
    if ((millis() - lastReadTime > READ_INTERVAL)) {        
        // Reading temperature or humidity takes about 250 milliseconds!
        // Sensor readings may also be up to 2 seconds 'old' (its a very slow sensor)
        float humidity = dht.readHumidity();
        float tempC = dht.readTemperature();
        float tempF = (tempC * 1.8) + 32;
        int lightReading = analogRead(lightPin);
    
        // Check if temperature/humidity readings are valid. 
        //If they are NaN (not a number) then something went wrong!
        if (isnan(tempC) || isnan(humidity)) {
            Serial.println("Failed to read from DHT");
        } else { // Success!
            
            // SAVE DATA
            // if we're not connected, and N seconds (postingInterval) have passed since the last connection, 
            // then connect again and send data.
            if(!client.connected() && (millis() - lastConnectionTime > postingInterval)) {
                postReading(tempC, humidity, lightReading);
                
                // Sync up the clock, resetting the postingInterval.
                syncClock();
            }
            // store the state of the connection for next time through the loop:
            lastConnected = client.connected();
           
            // Display temperature reading.
            lcd.setCursor(0, 1);  // go to the second line
            lcd.print("Temp:               " );
            lcd.setCursor(6, 1);
            lcd.print(tempF);
            lcd.setCursor(11, 1);
            lcd.print("*F");
            lcd.setCursor(14, 1);
            lcd.print(tempC);
            lcd.setCursor(18, 1);
            lcd.print("*C");
            
            // Display humidity reading
            lcd.setCursor (0, 2);  // go to the third line
            lcd.print("Humidity:           ");
            lcd.setCursor(10,2);
            lcd.print(humidity);
            lcd.setCursor(14,2);
            lcd.print("%");
            
            // Display the light reading
            lcd.setCursor(0, 3);  // go to the fourth line
            lcd.print("Light:              ");  
            lcd.setCursor(7, 3);
            lcd.print(lightReading);
            
            // Reset the RGB LED
            digitalWrite(green, HIGH); 
            analogWrite(red, 255);
            digitalWrite(blue, HIGH);
    
            // Figure out what color to display. 
            float tempDiff = tempC - prevTemp;
            if (tempDiff == 0) {  // Temperature is the same
                digitalWrite(green, LOW);
            } else if (tempDiff > 0) {   // Temperature went up
                analogWrite(red, 51);
            } else {  // Temperature went down
                digitalWrite(blue, LOW);
            }
        
            // Save off the previous temperature
            prevTemp = tempC;
            
            // For troubleshooting, writing to serial. 
            Serial.print("Humidity: "); 
            Serial.print(humidity);
            Serial.print("%\t"); 
            Serial.print("Temperature: "); 
            Serial.print(tempC);
            Serial.print(" *C  ");
            Serial.print(tempF);
            Serial.print(" *F\t");   
            Serial.print("Light: ");
            Serial.println(lightReading); 
            
            // Reset timer for last time a temperature reading was taken.
            lastReadTime = millis();
        }
    }
}

// Send a conditions reading to the web service
void postReading(float tempC, float humidity, int light) {
    char buffer[25];
  
    // Build up the JSON to POST
    String data = "{\"tempC\" : ";
    dtostrf(tempC, 1, 1, buffer);
    data += String(buffer);
    data += ", \"humidity\" :  ";
    dtostrf(humidity, 1, 1, buffer);
    data += String(buffer);
    data += ", \"light\" : " + String(light);
    data += "}";

    // if there's a successful connection:
    if (client.connect(server, 80)) {
        Serial.println("connecting...");
        // send the HTTP POST request:
        client.println("POST /path/to/api?shortCode=foo HTTP/1.1");
        client.println("Host: foo.com");
        client.println("User-Agent: arduino-ethernet");
        client.println("Content-Type: application/json; charset=UTF-8");
        client.print("Content-Length: ");
        client.println(data.length());
        client.println("Cache-Control: max-age=0");
        client.println("Accept-Language: en-US,en;q=0.8");
        client.println();
        client.println(data); 
        client.println();
    
        // note the time that the connection was made:
        lastConnectionTime = millis();
    } else {
        // if you couldn't make a connection:
        Serial.println("connection failed");
        Serial.println("disconnecting.");
        client.stop();
    }  
}

// The Arduino's internal timing is terrible. Sync up with an external service.
void syncClock() {
    sendNTPpacket(timeServer); // send an NTP packet to a time server

    // wait to see if a reply is available
    delay(1000);  

    if (Udp.parsePacket() ) {  
        // We've received a packet, read the data from it
        Udp.read(packetBuffer,NTP_PACKET_SIZE);  // read the packet into the buffer

        // The timestamp starts at byte 40 of the received packet and is four bytes,
        // or two words, long. First, esxtract the two words:
    
        unsigned long highWord = word(packetBuffer[40], packetBuffer[41]);
        unsigned long lowWord = word(packetBuffer[42], packetBuffer[43]);  
        // combine the four bytes (two words) into a long integer
        // this is NTP time (seconds since Jan 1 1900):
        unsigned long secsSince1900 = highWord << 16 | lowWord;  
        Serial.print("Seconds since Jan 1 1900 = " );
        Serial.println(secsSince1900);               
        
        // now convert NTP time into everyday time:
        // Unix time starts on Jan 1 1970. In seconds, that's 2208988800:
        const unsigned long seventyYears = 2208988800UL;     
        // subtract seventy years:
        unsigned long epoch = secsSince1900 - seventyYears;  
        // print Unix time:
        Serial.print("Unix time = ");
        Serial.println(epoch);        
        
        // print the hour, minute and second:
        Serial.print("The UTC time is ");       // UTC is the time at Greenwich Meridian (GMT)
        Serial.print((epoch  % 86400L) / 3600); // print the hour (86400 equals secs per day)
        Serial.print(':');  
        if ( ((epoch % 3600) / 60) < 10 ) {
            // In the first 10 minutes of each hour, we'll want a leading '0'
            Serial.print('0');
        }
        Serial.print((epoch  % 3600) / 60); // print the minute (3600 equals secs per minute)
        Serial.print(':'); 
        if ( (epoch % 60) < 10 ) {
            // In the first 10 seconds of each minute, we'll want a leading '0'
            Serial.print('0');
        }
        Serial.println(epoch % 60); // print the second
        
        // Figure out how many seconds until the top of the hour
        long remainingMinutes = 59 - ((epoch  % 3600) / 60);
        long remainingSeconds = 60 - (epoch % 60);
        remainingSeconds += (remainingMinutes * 60);
        
        // Reset the interval (in milliseconds) until the next post
        postingInterval = (remainingSeconds * 1000);
        Serial.print("Remaining Milliseconds: ");
        Serial.println(postingInterval);
    }
}
    
    
// send an NTP request to the time server at the given address 
unsigned long sendNTPpacket(IPAddress& address) {
    // set all bytes in the buffer to 0
    memset(packetBuffer, 0, NTP_PACKET_SIZE); 
    // Initialize values needed to form NTP request
    // (see URL above for details on the packets)
    packetBuffer[0] = 0b11100011;   // LI, Version, Mode
    packetBuffer[1] = 0;     // Stratum, or type of clock
    packetBuffer[2] = 6;     // Polling Interval
    packetBuffer[3] = 0xEC;  // Peer Clock Precision
    // 8 bytes of zero for Root Delay & Root Dispersion
    packetBuffer[12]  = 49; 
    packetBuffer[13]  = 0x4E;
    packetBuffer[14]  = 49;
    packetBuffer[15]  = 52;
    
    // all NTP fields have been given values, now
    // you can send a packet requesting a timestamp:         
    Udp.beginPacket(address, 123); //NTP requests are to port 123
    Udp.write(packetBuffer,NTP_PACKET_SIZE);
    Udp.endPacket(); 
}

