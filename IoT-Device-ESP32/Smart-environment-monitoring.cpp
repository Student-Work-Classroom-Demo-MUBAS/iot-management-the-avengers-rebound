#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ESP32-C3 Sensor Pins
const int PHOTO_RESISTOR_PIN = 0;   // GPIO0 - Analog capable
const int DHT_PIN = 1;              // GPIO1 - Digital pin
const int CURRENT_SENSOR_PIN = 2;   // GPIO2 - Analog capable

// DHT Sensor Type
#define DHT_TYPE DHT11

// WiFi Credentials - UPDATE THESE
const char* SSID = "Wongani's S21 Ultra";
const char* PASSWORD = "password";

// Server Configuration - Using your computer's IP from ipconfig
const char* SERVER_URL = "http://10.192.212.49:3000/api/sensordata";

// Sensor calibration values
const float CURRENT_SENSOR_SENSITIVITY = 0.066; // 66mV/A for ACS712-20A
const float ADC_REFERENCE_VOLTAGE = 3.3;
const int ADC_RESOLUTION = 4095;

#include <DHT.h>
DHT dht(DHT_PIN, DHT_TYPE);

// Sensor data structure
struct SensorData {
  float lightIntensity;
  float temperature;
  float humidity;
  float current;
  float power;
  unsigned long timestamp;
};

class SmartHomeSensors {
private:
  float zeroCurrentVoltage;

public:
  SmartHomeSensors() : zeroCurrentVoltage(0) {}

  void begin() {
    pinMode(DHT_PIN, INPUT);
    dht.begin();
    calibrateCurrentSensor();
    
    Serial.begin(115200);
    delay(1000);
    
    Serial.println("Smart Home Sensors Initialized - ESP32-C3");
    Serial.printf("Photoresistor: GPIO%d\n", PHOTO_RESISTOR_PIN);
    Serial.printf("DHT Sensor: GPIO%d\n", DHT_PIN);
    Serial.printf("Current Sensor: GPIO%d\n", CURRENT_SENSOR_PIN);
    Serial.printf("Server URL: %s\n", SERVER_URL);
  }

  void calibrateCurrentSensor() {
    Serial.println("Calibrating current sensor...");
    float sum = 0;
    for(int i = 0; i < 100; i++) {
      sum += analogRead(CURRENT_SENSOR_PIN);
      delay(10);
    }
    zeroCurrentVoltage = (sum / 100) * (ADC_REFERENCE_VOLTAGE / ADC_RESOLUTION);
    Serial.printf("Zero point: %.3fV\n", zeroCurrentVoltage);
  }

  float readLightIntensity() {
    int sensorValue = analogRead(PHOTO_RESISTOR_PIN);
    float voltage = sensorValue * (ADC_REFERENCE_VOLTAGE / ADC_RESOLUTION);
    float resistance = (10000 * voltage) / (ADC_REFERENCE_VOLTAGE - voltage);
    float lux = 500 / (resistance / 1000);
    return lux;
  }

  float readCurrent() {
    int sensorValue = analogRead(CURRENT_SENSOR_PIN);
    float voltage = sensorValue * (ADC_REFERENCE_VOLTAGE / ADC_RESOLUTION);
    float current = (voltage - zeroCurrentVoltage) / CURRENT_SENSOR_SENSITIVITY;
    if(current < 0.02) current = 0;
    return current;
  }

  bool readDHTData(float &temperature, float &humidity) {
    temperature = dht.readTemperature();
    humidity = dht.readHumidity();
    if (isnan(temperature) || isnan(humidity)) {
      Serial.println("Failed to read from DHT sensor!");
      return false;
    }
    return true;
  }

  SensorData readAllSensors() {
    SensorData data;
    data.lightIntensity = readLightIntensity();
    data.current = readCurrent();
    data.power = data.current * 220.0;
    
    if(!readDHTData(data.temperature, data.humidity)) {
      data.temperature = -1;
      data.humidity = -1;
    }
    
    data.timestamp = millis();
    return data;
  }

  void printSensorData(const SensorData &data) {
    Serial.println("=== Sensor Readings ===");
    Serial.printf("Light: %.2f lux\n", data.lightIntensity);
    Serial.printf("Temp: %.2f °C\n", data.temperature);
    Serial.printf("Humidity: %.2f %%\n", data.humidity);
    Serial.printf("Current: %.3f A\n", data.current);
    Serial.printf("Power: %.2f W\n", data.power);
    Serial.println("=======================");
  }

  // Simple JSON creation without ArduinoJson library
  String toJSON(const SensorData &data) {
    String json = "{";
    json += "\"light_intensity\":" + String(data.lightIntensity, 2) + ",";
    json += "\"temperature\":" + String(data.temperature, 2) + ",";
    json += "\"humidity\":" + String(data.humidity, 2) + ",";
    json += "\"current\":" + String(data.current, 3) + ",";
    json += "\"power\":" + String(data.power, 2) + ",";
    json += "\"timestamp\":" + String(data.timestamp);
    json += "}";
    return json;
  }

  bool sendToServer(const SensorData &data) {
    if(WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi not connected!");
      return false;
    }
    
    HTTPClient http;
    
    Serial.printf("Sending data to: %s\n", SERVER_URL);
    http.begin(SERVER_URL);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-SmartHome-Sensor");
    
    String jsonData = toJSON(data);
    Serial.printf("JSON Data: %s\n", jsonData.c_str());
    
    int httpResponseCode = http.POST(jsonData);
    
    if(httpResponseCode > 0) {
      String response = http.getString();
      Serial.printf("Data sent successfully! Response: %d\n", httpResponseCode);
      Serial.printf("Server Response: %s\n", response.c_str());
      http.end();
      return true;
    } else {
      Serial.printf("Error sending data: %d\n", httpResponseCode);
      Serial.printf("Error description: %s\n", http.errorToString(httpResponseCode).c_str());
      http.end();
      return false;
    }
  }
};

class WiFiManager {
public:
  void connect() {
    Serial.printf("Connecting to %s", SSID);
    WiFi.begin(SSID, PASSWORD);
    
    int attempts = 0;
    while(WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(1000);
      Serial.print(".");
      attempts++;
    }
    
    if(WiFi.status() == WL_CONNECTED) {
      Serial.println("\nWiFi connected!");
      Serial.printf("IP: %s\n", WiFi.localIP().toString().c_str());
    } else {
      Serial.println("\nWiFi failed!");
    }
  }
};

SmartHomeSensors sensors;
WiFiManager wifiManager;
unsigned long lastReadTime = 0;
const unsigned long READ_INTERVAL = 5000;

void setup() {
  sensors.begin();
  wifiManager.connect();
  Serial.println("Smart Home System Started");
}

void loop() {
  unsigned long currentTime = millis();
  
  if(currentTime - lastReadTime >= READ_INTERVAL) {
    SensorData data = sensors.readAllSensors();
    sensors.printSensorData(data);
    
    if(WiFi.status() == WL_CONNECTED) {
      bool success = sensors.sendToServer(data);
      if (!success) {
        Serial.println("Failed to send data to server. Will retry next cycle.");
      }
    } else {
      Serial.println("WiFi disconnected. Attempting to reconnect...");
      wifiManager.connect();
    }
    
    lastReadTime = currentTime;
  }
  
  delay(100);
}