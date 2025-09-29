// ESP32 Code (Arduino IDE)
#include <WiFi.h>
#include <HTTPClient.h>
#include <DHT.h>
#include <BH1750.h>
#include <Wire.h>

#define DHTPIN 4
#define DHTTYPE DHT22
#define MQPIN 34
#define PIRPIN 5

DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;

const char* ssid = "WIFI_SSID";
const char* password = "WIFI_PASSWORD";
const char* serverURL = "http://your-server.com/api/data";

void setup() {
  Serial.begin(115200);
  dht.begin();
  Wire.begin();
  lightMeter.begin();
  pinMode(PIRPIN, INPUT);
  
  connectToWiFi();
}


void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    float temperature = dht.readTemperature();
    float humidity = dht.readHumidity();
    int airQuality = analogRead(MQPIN);
    float lightLevel = lightMeter.readLightLevel();
    bool motionDetected = digitalRead(PIRPIN);
    
    String jsonPayload = "{\"temperature\":" + String(temperature) + 
                         ",\"humidity\":" + String(humidity) +
                         ",\"air_quality\":" + String(airQuality) +
                         ",\"light_level\":" + String(lightLevel) +
                         ",\"motion\":" + String(motionDetected) + "}";
    
    sendDataToServer(jsonPayload);
  }
  delay(30000); // Send data every 30 seconds
}

void connectToWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");
}

void sendDataToServer(String payload) {
  HTTPClient http;
  http.begin(serverURL);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Device-ID", "ESP32_001"); // Unique device identifier
  
  int httpResponseCode = http.POST(payload);
  if (httpResponseCode > 0) {
    Serial.println("Data sent successfully");
  } else {
    Serial.println("Error sending data");
  }
  http.end();
}