#include <WiFi.h>
#include <PubSubClient.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

#define DHTPIN 4
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

#define LDR_PIN 34
#define PIR_PIN 5
#define BUZZER_PIN 14
#define LED_PIR 16
#define RELAY_FAN 18
#define RELAY_LIGHT 19

const char *ssid = "Wokwi-GUEST";
const char *password = "";
const char *mqttServer = "broker.hivemq.com";
int mqttPort = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

int thresholdTempMax, thresholdTempMin, thresholdLightMax, thresholdLightMin;

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
      mqttClient.subscribe("23127263/esp32/temperature");
      mqttClient.subscribe("23127263/esp32/humidity");
      mqttClient.subscribe("23127263/esp32/light");
      mqttClient.subscribe("23127263/esp32/motion");
      mqttClient.subscribe("23127263/esp32/control/fan");
      mqttClient.subscribe("23127263/esp32/control/lamp");
      mqttClient.subscribe("23127263/esp32/control/buzzer");
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

  String msg;
  for (int i = 0; i < length; i++)
  {
    msg += (char)message[i];
  }

  if (String(topic) == "23127263/esp32/control/fan")
  {
    if (msg == "on")
    {
      digitalWrite(RELAY_FAN, HIGH);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Fan on");

    }
    else
    {
      digitalWrite(RELAY_FAN, LOW);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Fan off");
    }
  }

  if (String(topic) == "23127263/esp32/control/lamp")
  {
    if (msg == "on")
    {
      digitalWrite(RELAY_LIGHT, HIGH);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Light on");
    }
    else
    {
      digitalWrite(RELAY_LIGHT, LOW);
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Light off");
    }
  }

  if (String(topic) == "23127263/esp32/threshold/fanOn")
  {
    thresholdTempMax = msg.toInt();
  }

  if (String(topic) == "23127263/esp32/threshold/fanOff")
  {
    thresholdTempMin = msg.toInt();
  }

  if (String(topic) == "23127263/esp32/threshold/lightOn")
  {
    thresholdLightMin = msg.toInt();
  }

  if (String(topic) == "23127263/esp32/threshold/lightOff")
  {
    thresholdLightMax = msg.toInt();
  }
}

// Hàm này để tránh kêu nhiều quá phiền
// bool buzzerOn = false;

// void checkBuzzer(int temp, int light) {
//   bool overTemp = (thresholdTempMax > 0 && temp >= thresholdTempMax) ||
//                   (thresholdTempMin > 0 && temp < thresholdTempMin);

//   bool overLight = (thresholdLightMax > 0 && light >= thresholdLightMax) ||
//                    (thresholdLightMin > 0 && light < thresholdLightMin);

//   if ((overTemp || overLight) && !buzzerOn) {
//     tone(BUZZER_PIN, 1000, 500);
//     buzzerOn = true;
//   }
//   else if (!overTemp && !overLight) {
//     noTone(BUZZER_PIN);
//     buzzerOn = false;
//   }
// }

void setup()
{
  Serial.begin(115200);
  Wire.begin(32, 33);
  dht.begin();

  lcd.begin(16, 2);
  lcd.backlight();

  pinMode(PIR_PIN, INPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIR, OUTPUT);
  pinMode(RELAY_FAN, OUTPUT);
  pinMode(RELAY_LIGHT, OUTPUT);

  wifiConnect();
  mqttClient.setServer(mqttServer, mqttPort);
  mqttClient.setCallback(callback);
}
unsigned long lastSend = 0;
const long interval = 10000;

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

  int temp = random(200, 350) / 10;
  int hum = random(300, 900) / 10;
  int ldrValue = random(0, 4096);
  int lightPercent = map(ldrValue, 0, 4095, 0, 100);
  bool hasMotion = random(0, 2);

    if (hasMotion)
      digitalWrite(LED_PIR, HIGH);
    else
      digitalWrite(LED_PIR, LOW);
    char buffer[10];
    sprintf(buffer, "%d", temp);
    mqttClient.publish("23127263/esp32/temperature", buffer);

    sprintf(buffer, "%d", hum);
    mqttClient.publish("23127263/esp32/humidity", buffer);

    sprintf(buffer, "%d", lightPercent);
    mqttClient.publish("23127263/esp32/light", buffer);

    sprintf(buffer, "%d", hasMotion);
    mqttClient.publish("23127263/esp32/motion", buffer);
    Serial.print("Nhiet do: ");
    Serial.print(temp);
    Serial.print(" | Do am: ");
    Serial.print(hum);
    Serial.print(" | Anh sang: ");
    Serial.print(lightPercent);
    Serial.print(" | PIR: ");
    Serial.println(hasMotion ? "Co nguoi" : "Khong co nguoi");

    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Temperature:");
    lcd.print(temp);
    lcd.setCursor(0, 1);
    lcd.print("Humidity:");
    lcd.print(hum);

    delay(2000);

    if (temp >= thresholdTempMax) {
      tone(BUZZER_PIN, 1000, 500);
    }
    if (temp < thresholdTempMin) {
      tone(BUZZER_PIN, 1000, 500);
    }

    if (lightPercent >= thresholdLightMax){
      tone(BUZZER_PIN, 1000, 500);

    }
    if (lightPercent < thresholdLightMin) {
      tone(BUZZER_PIN, 1000, 500);
    }

  }
}