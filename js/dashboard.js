import { auth } from './auth.js';
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

export class MqttHandler {
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
      this.client.subscribe("23127263/esp32/light");
      this.client.subscribe("23127263/esp32/motion");
    });

    this.client.on("message", (topic, message) => {
      const value = message.toString();
      if (topic.includes("temperature")) {
        document.getElementById("tempBox").innerHTML = `🌡️ Nhiệt độ: ${value} °C`;
      }
      if (topic.includes("humidity")) {
        document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${value} %`;
      }
      if (topic.includes("light")) {
        document.getElementById("lightBox").innerHTML = ` Độ sáng: ${value} %`;
      }
      if (topic.includes("motion")) {
        document.getElementById("statusBox").innerHTML = ` Trạng thái: ${value}`;
      }
    });
  }

  logout(callbackOnSuccess) {
    const logoutBtn = document.getElementById("logoutBtn");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();

      if (this.client && this.client.connected) {
        this.client.end();
        this.client = null;
      }

      signOut(auth).then(() => {
        console.log("Signed out from Firebase");
        callbackOnSuccess();
      });
    });
  }

  init(callbackOnLogout) {
    this.logout(callbackOnLogout);
  }
}