class MqttHandler {
  constructor() {
    this.client = null;
  }

  connect() {
    if (this.client) return;

    this.client = mqtt.connect("wss://broker.hivemq.com:8884/mqtt");

    this.client.on("connect", () => {
      console.log("Connected MQTT");
      this.client.subscribe("23127263/esp32/temperature");
      this.client.subscribe("23127263/esp32/humidity");
    });

    this.client.on("message", (topic, message) => {
      const value = message.toString();
      if (topic.includes("temperature")) {
        document.getElementById("tempBox").innerHTML = `🌡️ Nhiệt độ: ${value} °C`;
      }
      if (topic.includes("humidity")) {
        document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${value} %`;
      }
    });
  }
}

const mqttHandler = new MqttHandler();
