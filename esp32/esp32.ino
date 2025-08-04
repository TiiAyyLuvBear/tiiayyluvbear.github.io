#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

// Pin setup
#define LDR_PIN 34 // Analog input
#define PIR_PIN 5  // Digital input
#define BUZZER_PIN 14
#define LED_FAN 16
#define LED_LIGHT 17
#define RELAY_FAN 18
#define RELAY_LIGHT 19

// WiFi + MQTT config
const char *ssid = "Wokwi-GUEST";
const char *password = "";
const char *mqttServer = "broker.hivemq.com";
int mqttPort = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

void wifiConnect()
{
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
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
      // Bạn có thể thêm các subscribe nếu cần
      mqttClient.subscribe("23127263/esp32/temperature");
      mqttClient.subscribe("23127263/esp32/humidity");
      mqttClient.subscribe("23127263/esp32/light");
      mqttClient.subscribe("23127263/esp32/motion");
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
  Serial.println(msg);
  //  Có thể xử lý thêm ở đây
}

void setup()
{
  Serial.begin(115200);
  Wire.begin(32, 33); // SDA, SCL
  dht.begin();

  lcd.begin(16, 2);
  lcd.backlight();

  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_FAN, OUTPUT);
  pinMode(LED_LIGHT, OUTPUT);
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(RELAY_LIGHT, OUTPUT);

  // WiFi & MQTT
  wifiConnect();
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(callback);

  randomSeed(micros());
}
unsigned long lastSend = 0;
const long interval = 10000; // 60 giây

void loop()
{
  if (WiFi.status() != WL_CONNECTED)
  {
    Serial.println("WiFi disconnected. Reconnecting...");
    wifiConnect();
  }

  if (!mqttClient.connected())
  {
    mqttConnect();
  }

  mqttClient.loop();
  if (millis() - lastSend >= interval)
  {
    lastSend = millis();

    // float temp = dht.readTemperature();
    // float hum = dht.readHumidity();
    // int ldrValue = analogRead(LDR_PIN);
    // int lightPercent = map(ldrValue, 0, 4095, 0, 100);
    // bool hasMotion = digitalRead(PIR_PIN);

    float temp = random(20, 50);
    float hum = random(50, 90);
    int ldrValue = random(0, 4095);
    int lightPercent = map(ldrValue, 0, 4095, 0, 100);
    bool hasMotion = random(0, 1);

    // Gửi dữ liệu lên MQTT
    char buffer[10];
    sprintf(buffer, "%.2f", temp);
    mqttClient.publish("23127263/esp32/temperature", buffer);

    sprintf(buffer, "%.2f", hum);
    mqttClient.publish("23127263/esp32/humidity", buffer);

    sprintf(buffer, "%d", lightPercent);
    mqttClient.publish("23127263/esp32/light", buffer);

    sprintf(buffer, "%d", hasMotion);
    mqttClient.publish("23127263/esp32/motion", buffer);
    // Serial log
    // Serial.print("Nhiet do: ");
    // Serial.print(temp);
    // Serial.print(" | Do am: ");
    // Serial.print(hum);
    // Serial.print(" | Anh sang: ");
    // Serial.print(ldrValue);
    // Serial.print(" | PIR: ");
    // Serial.println(hasMotion ? "Co nguoi" : "Khong co nguoi");

    // Hiển thị lên LCD
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print(temp);
    lcd.print(" H:");
    lcd.print(hum);

    lcd.setCursor(0, 1);
    lcd.print("L:");
    lcd.print(ldrValue);
    lcd.print(hasMotion ? " Motion" : " NoMove");

    // delay(1000);
  }
}