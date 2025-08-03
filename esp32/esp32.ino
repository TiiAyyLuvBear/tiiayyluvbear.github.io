#include <WiFi.h>
#include <PubSubClient.h>
#include <LiquidCrystal_I2C.h>

const char *ssid = "Wokwi-GUEST";
const char *password = "";

// MQTT Server
const char *mqttServer = "broker.hivemq.com";
int port = 1883;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
LiquidCrystal_I2C lcd(0x27, 16, 2); // <- Sửa tên đúng

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
  Serial.print("Connecting to WiFi");
  wifiConnect();
  mqttClient.setServer(mqttServer, port);
  mqttClient.setCallback(callback);
  mqttClient.setKeepAlive(90);

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("ESP32 + LCD Ready");
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

  // Sinh ngẫu nhiên dữ liệu
  int temperature = random(20, 40);
  int humidity = random(40, 70);

  char buffer[10];

  // Hiển thị lên LCD
  lcd.setCursor(0, 0);
  lcd.print("Temp: " + String(temperature) + "C   ");
  lcd.setCursor(0, 1);
  lcd.print("Humi: " + String(humidity) + "%   ");

  // Gửi lên MQTT
  sprintf(buffer, "%d", temperature);
  mqttClient.publish("23127263/esp32/temperature", buffer);

  sprintf(buffer, "%d", humidity);
  mqttClient.publish("23127263/esp32/humidity", buffer);

  delay(3000); // Chờ 5 giây
}
