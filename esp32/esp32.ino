#include <WiFi.h>
#include <PubSubClient.h>
#include <LiquidCrystal_I2C.h>

const char *ssid = "Wokwi-GUEST";
const char *password = "";

// MQTT Server
const char *mqttServer = "broker.hivemq.com";
int port = 1883;

// Sensor pins
#define PIR_PIN 2        // PIR sensor pin
#define LIGHT_PIN A0     // Light sensor (LDR) pin
#define LED_PIN 13       // LED indicator pin

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Variables for sensor readings
bool lastMotionState = false;
int lastLightLevel = -1;
unsigned long lastSensorRead = 0;
const unsigned long sensorInterval = 2000; // Read sensors every 2 seconds

void wifiConnect()
{
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" Connected!");
}

void mqttConnect()
{
  while (!mqttClient.connected())
  {
    Serial.println("Attempting MQTT connection...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str()))
    {
      Serial.println("Connected to MQTT");

      // Subscribe
      mqttClient.subscribe("23127263/esp32/humidity");
      mqttClient.subscribe("23127263/esp32/temperature");
    }
    else
    {
      Serial.print("Failed, rc=");
      Serial.print(mqttClient.state());
      Serial.println(". Try again in 5 seconds.");
      delay(5000);
    }
  }
}

void callback(char *topic, byte *message, unsigned int length)
{
  // Serial.print("Message arrived [");
  // Serial.print(topic);
  // Serial.print("]: ");
  String msg;
  for (int i = 0; i < length; i++)
  {
    msg += (char)message[i];
  }
  // Serial.println(msg);
  //  Có thể xử lý thêm ở đây
}

void setup()
{
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  
  Serial.print("Connecting to WiFi");
  wifiConnect();
  mqttClient.setServer(mqttServer, port);
  mqttClient.setCallback(callback);
  mqttClient.setKeepAlive(90);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("ESP32 IoT Ready");
  lcd.setCursor(0, 1);
  lcd.print("Sensors: Online");
  delay(2000);
  lcd.clear();
}

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi disconnected! Reconnecting...");
    wifiConnect();
  }

  if (!mqttClient.connected())
  {
    mqttConnect();
  }

  mqttClient.loop();

  // Read sensors every sensorInterval milliseconds
  if (millis() - lastSensorRead >= sensorInterval) {
    readAndPublishSensors();
    lastSensorRead = millis();
  }

  delay(100); // Small delay to prevent blocking
}

void readAndPublishSensors() {
  char buffer[10];

  // Generate random temperature and humidity (you can replace with real sensors)
  int temperature = random(15, 45); // Temperature range: 15-45°C
  int humidity = random(40, 80);    // Humidity range: 40-80%

  // Read PIR sensor
  bool motionDetected = digitalRead(PIR_PIN);
  
  // Read light sensor (LDR) - convert to percentage
  int lightRaw = analogRead(LIGHT_PIN);
  int lightLevel = map(lightRaw, 0, 4095, 0, 100); // Convert to 0-100%
  
  // Update LCD display
  lcd.setCursor(0, 0);
  lcd.print("T:" + String(temperature) + "C H:" + String(humidity) + "%   ");
  lcd.setCursor(0, 1);
  lcd.print("L:" + String(lightLevel) + "% M:" + (motionDetected ? "YES" : "NO ") + "   ");

  // Publish temperature
  sprintf(buffer, "%d", temperature);
  mqttClient.publish("23127263/esp32/temperature", buffer);

  // Publish humidity
  sprintf(buffer, "%d", humidity);
  mqttClient.publish("23127263/esp32/humidity", buffer);

  // Publish light level
  sprintf(buffer, "%d", lightLevel);
  mqttClient.publish("23127263/esp32/light", buffer);

  // Publish motion detection (only when state changes)
  if (motionDetected != lastMotionState) {
    mqttClient.publish("23127263/esp32/motion", motionDetected ? "1" : "0");
    lastMotionState = motionDetected;
    
    // Control LED based on motion
    digitalWrite(LED_PIN, motionDetected ? HIGH : LOW);
    
    Serial.println("Motion detected: " + String(motionDetected ? "YES" : "NO"));
  }

  // Log sensor readings
  Serial.println("Temperature: " + String(temperature) + "°C, Humidity: " + String(humidity) + "%, Light: " + String(lightLevel) + "%, Motion: " + String(motionDetected ? "YES" : "NO"));
}
