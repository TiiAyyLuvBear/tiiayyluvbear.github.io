import { auth } from './auth.js';
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { PushsaferNotifier } from './pushsafer.js'; 
import { app } from './auth.js'; // hoặc từ firebase-config.js nếu bạn tách file

const db = getDatabase(app);



export class MqttHandler {
  constructor() {
    this.client = null;
    this.pushNotifier = new PushsaferNotifier();
    this.temperature = 0;
    this.humidity = 0;
    this.light = 0;
    this.motion = null;

    this.autoMode = false;
    this.fanOn = 0;
    this.fanOff = 0;
    this.lightOn = 0;
    this.lightOff = 0;
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
      this.client.subscribe("23127263/esp32/fan");
      this.client.subscribe("23127263/esp32/lamp");
    });

    this.client.on("message", (topic, message) => {
      const value = message.toString();
      const key = topic.split("/").pop();  // "temperature", "humidity", ...

      // Hiển thị và xử lý như trước
      if (key === "temperature") {
        const temp = parseFloat(value);
        this.temperature = temp;
        document.getElementById("tempBox").innerHTML = `🌡️ Nhiệt độ: ${value} °C`;
        this.pushNotifier.checkAndNotifyTemperature(temp);
        this.cache.temperature = temp;
      }

      if (key === "humidity") {
        this.humidity = parseFloat(value);
        document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${value} %`;
        this.cache.humidity = parseInt(value);
      }

      if (key === "light") {
        const light = parseInt(value);
        this.light = light;
        document.getElementById("lightBox").innerHTML = `Độ sáng: ${value} %`;
        this.pushNotifier.checkAndNotifyLight(light);
        this.cache.light = light;
      }

      if (key === "motion") {
        const motionDetected = value === "1" || value.toLowerCase() === "detected";
        this.motion = value ? `Co nguoi`:  `Khong co nguoi`;
        document.getElementById("statusBox").innerHTML = ` Trạng thái: ${motionDetected ? 'Có chuyển động' : 'Không có chuyển động'}`;
        if (motionDetected) {
          this.pushNotifier.checkAndNotifyMotion(true);
        }
        this.cache.motion = motionDetected ? 1 : 0;
      }

      // Gửi Firebase nếu đủ dữ liệu
      if (this.cache.temperature !== undefined &&
        this.cache.humidity !== undefined &&
        this.cache.light !== undefined &&
        this.cache.motion !== undefined) {

        const now = new Date();
        const pad = (n) => n.toString().padStart(2, '0');
        const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
        const timeStr = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const fullTime = `${dateStr} ${timeStr}`;

        const payload = {
          name: "phonghoc",
          temperature: this.cache.temperature,
          humidity: this.cache.humidity,
          light: this.cache.light,
          motion: this.cache.motion,
          time: fullTime
        };

        // Ghi duy nhất vào nhánh /log/yyyy-mm-dd/
        const logRef = ref(db, `log/${dateStr}`);
        push(logRef, payload);

        // Reset lại cache
        this.cache = {};
      }
    });


    this.autoControl();
    if(this.autoMode){
      if (this.temperature >= this.fanOn) {
        this.client.publish("23127263/esp32/fan", "on");
      } else if (this.temperature <= this.fanOff) {
        this.client.publish("23127263/esp32/fan", "off");
      }

      // Kiểm tra ánh sáng để điều khiển đèn
      if (this.light <= this.lightOn) {
        this.client.publish("23127263/esp32/lamp", "on");
      } else if (this.light >= this.lightOff) {
        this.client.publish("23127263/esp32/lamp", "off");
      }
    }

  }

  autoControl() {
    const autoController = document.getElementById("autoControlBtn");

    autoController.addEventListener("click", (event) => {
      event.preventDefault();
      this.autoMode = !this.autoMode;
      autoController.classList.toggle("active");
      autoController.innerText = this.autoMode ? `Bat` : `Tat`;
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

  autoControl() {

    const upperLight = 500;
    const lowerLight = 200;

    const upperTemperature = 35;
    const lowerTemperature = 20;

    const autoControl = document.getElementById("autoControlBtn");

    autoControl.addEventListener("click", (event) => {
      event.preventDefault()


    })
  }

  fanControlSetting(){

    const overlay = document.getElementById("fanThresholdOverlay");
    const dashboard = document.getElementById("dashboard");
    const fanOn    = document.getElementById("fanOn");
    const fanOnValue = document.getElementById("fanOnValue");
    const fanOff = document.getElementById("fanOff");
    const fanOffValue = document.getElementById("fanOffValue");
    const closePopupBtn = document.getElementById("closePopup");

    const controlBtns = document.querySelectorAll(".control-btn.fanOpenThresholdBtn");
    controlBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.classList.add("active");
        dashboard?.classList.add("blurred"); 
      });
    });

    closePopupBtn?.addEventListener("click", () => {
      overlay.classList.remove("active");
      dashboard?.classList.remove("blurred"); 
    });

    fanOn?.addEventListener("input", () => {
      fanOnValue.textContent = fanOn.value;
      this.fanOn = parseFloat(fanOn.value);
      // Update temperature threshold for notifications
      this.pushNotifier.updateThresholds({
        temperature: { high: parseInt(fanOn.value), low: 10 }
      });
    });

    fanOff?.addEventListener("input", () => {
      fanOffValue.textContent = fanOff.value;
      this.fanOff = parseFloat(fanOff.value);
      // Update light threshold for notifications
      this.pushNotifier.updateThresholds({
        light: { low: parseInt(fanOff.value) }
      });
    });
  }

    lightControlSetting(){

    const overlay = document.getElementById("lightThresholdOverlay");
    const dashboard = document.getElementById("dashboard");
    const lightOn    = document.getElementById("lightOn");
    const lightOnValue = document.getElementById("lightOnValue");
    const lightOff = document.getElementById("lightOff");
    const lightOffValue = document.getElementById("lightOffValue");
    const closePopupBtn = document.getElementById("closePopup2");

    const controlBtns = document.querySelectorAll(".control-btn.lightOpenThresholdBtn");
    controlBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.classList.add("active");
        dashboard?.classList.add("blurred"); 
      });
    });

    closePopupBtn?.addEventListener("click", () => {
      overlay.classList.remove("active");
      dashboard?.classList.remove("blurred"); 
    });

    lightOn?.addEventListener("input", () => {
      lightOnValue.textContent = lightOn.value;
      this.lightOn = parseFloat(lightOn.value);
      // Update temperature threshold for notifications
      this.pushNotifier.updateThresholds({
        temperature: { high: parseInt(fanOn.value), low: 10 }
      });
    });

    lightOff?.addEventListener("input", () => {
      lightOffValue.textContent = lightOff.value;
      this.lightOff = parseFloat(lightOff.value);
      // Update light threshold for notifications
      this.pushNotifier.updateThresholds({
        light: { low: parseInt(fanOff.value) }
      });
    });
  }

  saveThresholdsToFirebase() {
    const db = getDatabase();
    const user = auth.currentUser;

    if (!user) return;

    const thresholdsRef = ref(db, `users/${user.uid}/thresholds`);
    set(thresholdsRef, {
      fanOn: this.fanOn,
      fanOff: this.fanOff,
      lightOn: this.lightOn,
      lightOff: this.lightOff
    }).then(() => {
      console.log("Thresholds saved.");
    }).catch((error) => {
      console.error("Failed to save thresholds:", error);
    });
  }

  loadThresholdsFromFirebase() {
    const db = getDatabase();
    const user = auth.currentUser;

    if (!user) return;

    const thresholdsRef = ref(db, `users/${user.uid}/thresholds`);
    get(thresholdsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        this.fanOn = data.fanOn ?? this.fanOn;
        this.fanOff = data.fanOff ?? this.fanOff;
        this.lightOn = data.lightOn ?? this.lightOn;
        this.lightOff = data.lightOff ?? this.lightOff;

        // Update giao diện nếu cần
        // document.getElementById("fanOn")?.value = this.fanOn;
        // document.getElementById("fanOff")?.value = this.fanOff;
        // document.getElementById("lightOn")?.value = this.lightOn;
        // document.getElementById("lightOff")?.value = this.lightOff;

        // document.getElementById("fanOnValue").textContent = this.fanOn;
        // document.getElementById("fanOffValue").textContent = this.fanOff;
        // document.getElementById("lightOnValue").textContent = this.lightOn;
        // document.getElementById("lightOffValue").textContent = this.lightOff;

        console.log("Thresholds loaded.");
      } else {
        console.log("No thresholds set.");
      }
    }).catch((error) => {
      console.error("Failed to load thresholds:", error);
    });
  }



  init(callbackOnLogout) {
    this.logout(callbackOnLogout);
    this.fanControlSetting();
    this.lightControlSetting();
    this.saveThresholdsToFirebase();
    this.loadThresholdsFromFirebase();



    //   // Add test notification button and settings link
    //   this.addTestNotificationButton();
    //   this.addSettingsLink();
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
      // addTestNotificationButton() {
      //   // Tạo nút test notification nếu chưa có
      //   if (!document.getElementById("testNotificationBtn")) {
      //     const testBtn = document.createElement("button");
      //     testBtn.id = "testNotificationBtn";
      //     testBtn.className = "control-btn";
      //     testBtn.innerHTML = "🔔 Test Notification";
      //     testBtn.style.marginTop = "10px";

      //     testBtn.addEventListener("click", async () => {
      //       testBtn.disabled = true;
      //       testBtn.innerHTML = "⏳ Đang gửi...";

      //       const success = await this.pushNotifier.testNotification();

      //       testBtn.disabled = false;
      //       testBtn.innerHTML = success ? "✅ Đã gửi!" : "❌ Lỗi";

      //       setTimeout(() => {
      //         testBtn.innerHTML = "🔔 Test Notification";
      //       }, 2000);
      //     });

      //     // Thêm vào container thích hợp
      //     const container = document.querySelector(".dashboard-container") || document.body;
      //     container.appendChild(testBtn);
      //   }
      // }

      // addSettingsLink() {
      //   // Tạo link đến trang settings nếu chưa có
      //   if (!document.getElementById("notificationSettingsLink")) {
      //     const settingsLink = document.createElement("a");
      //     settingsLink.id = "notificationSettingsLink";
      //     settingsLink.className = "control-btn";
      //     settingsLink.innerHTML = "⚙️ Cài đặt Thông báo";
      //     settingsLink.href = "notification-settings.html";
      //     settingsLink.style.marginTop = "10px";
      //     settingsLink.style.textDecoration = "none";
      //     settingsLink.style.display = "inline-block";

      //     // Thêm vào container thích hợp
      //     const container = document.querySelector(".dashboard-container") || document.body;
      //     container.appendChild(settingsLink);
      //   }
      // }

    }
  }
}