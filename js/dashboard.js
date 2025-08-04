import { auth } from './auth.js';
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { PushsaferNotifier } from './pushsafer.js';

export class MqttHandler {
  constructor() {
    this.client = null;
    // PushsaferNotifier sẽ tự động load private key từ config
    this.pushNotifier = new PushsaferNotifier();
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
        const temp = parseInt(value);
        document.getElementById("tempBox").innerHTML = `🌡️ Nhiệt độ: ${value} °C`;
        // Check and send temperature notification
        this.pushNotifier.checkAndNotifyTemperature(temp);
      }
      if (topic.includes("humidity")) {
        document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${value} %`;
      }
      if (topic.includes("light")) {
        const light = parseInt(value);
        document.getElementById("lightBox").innerHTML = ` Độ sáng: ${value} %`;
        // Check and send light notification
        this.pushNotifier.checkAndNotifyLight(light);
      }
      if (topic.includes("motion")) {
        const motionDetected = value === "1" || value.toLowerCase() === "detected";
        document.getElementById("statusBox").innerHTML = ` Trạng thái: ${motionDetected ? 'Có chuyển động' : 'Không có chuyển động'}`;
        // Check and send motion notification
        if (motionDetected) {
          this.pushNotifier.checkAndNotifyMotion(true);
        }
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

    const overlay = document.getElementById("thresholdOverlay");
    const fanInput = document.getElementById("fanThreshold");
    const fanValue = document.getElementById("fanValue");
    const lightInput = document.getElementById("lightThreshold");
    const lightValue = document.getElementById("lightValue");
    const closePopupBtn = document.getElementById("closePopup");

    const controlBtns = document.querySelectorAll(".control-btn.openThresholdBtn");
    controlBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.classList.add("active");
      });
    });

    closePopupBtn?.addEventListener("click", () => {
      overlay.classList.remove("active");
    });

    fanInput?.addEventListener("input", () => {
      fanValue.textContent = fanInput.value;
      // Update temperature threshold for notifications
      this.pushNotifier.updateThresholds({
        temperature: { high: parseInt(fanInput.value), low: 10 }
      });
    });

    lightInput?.addEventListener("input", () => {
      lightValue.textContent = lightInput.value;
      // Update light threshold for notifications
      this.pushNotifier.updateThresholds({
        light: { low: parseInt(lightInput.value) }
      });
    });

    // Add test notification button and settings link
    this.addTestNotificationButton();
    this.addSettingsLink();
  }

  addTestNotificationButton() {
    // Tạo nút test notification nếu chưa có
    if (!document.getElementById("testNotificationBtn")) {
      const testBtn = document.createElement("button");
      testBtn.id = "testNotificationBtn";
      testBtn.className = "control-btn";
      testBtn.innerHTML = "🔔 Test Notification";
      testBtn.style.marginTop = "10px";
      
      testBtn.addEventListener("click", async () => {
        testBtn.disabled = true;
        testBtn.innerHTML = "⏳ Đang gửi...";
        
        const success = await this.pushNotifier.testNotification();
        
        testBtn.disabled = false;
        testBtn.innerHTML = success ? "✅ Đã gửi!" : "❌ Lỗi";
        
        setTimeout(() => {
          testBtn.innerHTML = "🔔 Test Notification";
        }, 2000);
      });

      // Thêm vào container thích hợp
      const container = document.querySelector(".dashboard-container") || document.body;
      container.appendChild(testBtn);
    }
  }

  addSettingsLink() {
    // Tạo link đến trang settings nếu chưa có
    if (!document.getElementById("notificationSettingsLink")) {
      const settingsLink = document.createElement("a");
      settingsLink.id = "notificationSettingsLink";
      settingsLink.className = "control-btn";
      settingsLink.innerHTML = "⚙️ Cài đặt Thông báo";
      settingsLink.href = "notification-settings.html";
      settingsLink.style.marginTop = "10px";
      settingsLink.style.textDecoration = "none";
      settingsLink.style.display = "inline-block";

      // Thêm vào container thích hợp
      const container = document.querySelector(".dashboard-container") || document.body;
      container.appendChild(settingsLink);
    }
  }
}