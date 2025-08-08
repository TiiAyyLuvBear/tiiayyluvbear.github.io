import { auth, app } from './auth.js';
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { PushsaferNotifier } from './pushsafer.js';
import { getDatabase, ref, push, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
const db = getDatabase(app);


function logUserAction(action, details = {}) {
  const user = auth.currentUser;
  if (!user || !user.email) {
    console.error("Chưa đăng nhập hoặc không có email");
    return;
  }

  // Lấy phần trước dấu chấm cuối cùng (bỏ .com, .vn, ...)
  const email = user.email;
  const lastDotIndex = email.lastIndexOf(".");
  const emailPrefix = lastDotIndex !== -1 ? email.substring(0, lastDotIndex) : email;

  // Ngày và giờ
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0]; // yyyy-mm-dd
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const timeStr = `${hh}:${mm}:${ss}`;

  const logRef = ref(db, `history/${emailPrefix}/${dateStr}`);
  const logEntry = {
    action,
    details,
    timestamp: `${dateStr} ${timeStr}`
  };

  push(logRef, logEntry)
    .then(() => console.log("✅ Lưu lịch sử thành công:", action))
    .catch((err) => console.error("❌ Lỗi lưu lịch sử:", err));
}

export class Dashboard {
  constructor() {
    this.client = null;
    this.pushNotifier = new PushsaferNotifier();
    this.temperature = 0;
    this.humidity = 0;
    this.light = 0;
    this.motion = null;
    this.cache = {};
    this.autoMode = false;
    this.fanOn = 0;
    this.fanOff = 0;
    this.lightOn = 0;
    this.lightOff = 0;
    this.currentFanState = null;
    this.currentLampState = null;
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
      this.client.subscribe("23127263/esp32/control/fan");
      this.client.subscribe("23127263/esp32/control/lamp");
    });

    this.client.on("message", (topic, message) => {
      const value = message.toString();
      const key = topic.split("/").pop();  // "temperature", "humidity", ...
      if (key === "temperature") {
        const temp = parseInt(value);
        this.temperature = temp;
        document.getElementById("tempBox").innerHTML = `🌡️ Nhiệt độ: ${value} °C`;
        // this.pushNotifier.checkAndNotifyTemperature(temp);
        this.cache.temperature = temp;
      }

      if (key === "humidity") {
        this.humidity = parseInt(value);
        document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${value} %`;
        this.cache.humidity = parseInt(value);
      }

      if (key === "light") {
        const light = parseInt(value);
        this.light = light;
        document.getElementById("lightBox").innerHTML = `💡 Độ sáng: ${value} %`;
        //this.pushNotifier.checkAndNotifyLight(light);
        this.cache.light = light;
      }

      if (key === "motion") {
        const motionValue = parseInt(value);  // sẽ luôn là 1 hoặc 0 nếu ESP32 gửi đúng

        this.motion = motionValue;  // dùng cho autoControl

        // Hiển thị ra giao diện
        const motionBox = document.getElementById("motionBox");
        if (motionBox) {
          motionBox.innerHTML = `👤 Trạng thái: ${motionValue === 1 ? 'Có người' : 'Không có người'}`;
        }

        // Gửi thông báo nếu có chuyển động
        // if (motionValue === 1) {
        //   this.pushNotifier.checkAndNotifyMotion(true);
        // }

        // Lưu vào cache để đẩy Firebase
        this.cache.motion = motionValue;

      }


      //Gửi Firebase nếu đủ dữ liệu
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

        // Ghi duy nhất vào nhánh /sensor/yyyy-mm-dd/
        const logRef = ref(getDatabase(), `/sensor/${dateStr}/`);
        push(logRef, payload)
          .then(() => {
            console.log("✅ Dữ liệu đã được lưu vào Firebase:", payload);
          })
          .catch((error) => {
            console.error("❌ Lỗi khi lưu dữ liệu vào Firebase:", error);
          });

        // Reset lại cache
        this.cache = {};
      }
    });


    setInterval(() => {
      if (!this.autoMode) return;
      // ======= NO MOTION: TURN OFF EVERYTHING =======
      if (this.motion === 0 || this.motion === null) {
        if (this.currentFanState !== "off") {
          this.client?.publish("23127263/esp32/control/fan", "off");
          document.getElementById("fanSwitch").checked = false;
          this.currentFanState = "off";
          logUserAction("fan_control", "auto_control: off");
          console.log("Fan Off (No Motion)");
        }

        if (this.currentLampState !== "off") {
          this.client?.publish("23127263/esp32/control/lamp", "off");
          document.getElementById("lightSwitch").checked = false;
          this.currentLampState = "off";
          logUserAction("lamp_control", "auto_control: off");
          console.log("Light Off (No Motion)");
        }

        return; // không tiếp tục kiểm tra nhiệt độ/ánh sáng nếu không có người
      }
      // ======= FAN CONTROL =======
      if (this.temperature >= this.fanOn && this.currentFanState !== "on") {
        this.client?.publish("23127263/esp32/control/fan", "on");
        document.getElementById("fanSwitch").checked = true;
        this.currentFanState = "on";
        logUserAction("fan_control", "auto_control: on");
        console.log("Fan On");
      } else if (this.temperature <= this.fanOff && this.currentFanState !== "off") {
        this.client?.publish("23127263/esp32/control/fan", "off");
        document.getElementById("fanSwitch").checked = false;
        this.currentFanState = "off";
        logUserAction("fan_control", "auto_control: off");
        console.log("Fan Off");
      }

      // ======= LAMP CONTROL =======
      if (this.light <= this.lightOn && this.currentLampState !== "on") {
        this.client?.publish("23127263/esp32/control/lamp", "on");
        document.getElementById("lightSwitch").checked = true;
        this.currentLampState = "on";
        logUserAction("lamp_control", "auto_control: on");
        console.log("Light On");
      } else if (this.light >= this.lightOff && this.currentLampState !== "off") {
        this.client?.publish("23127263/esp32/control/lamp", "off");
        document.getElementById("lightSwitch").checked = false;
        this.currentLampState = "off";
        logUserAction("lamp_control", "auto_control: off");
        console.log("Light Off");
      }

    }, 5000);

    this.autoControl();

  }

  autoControl() {
    const autoSwitch = document.getElementById("autoBtn");

    autoSwitch?.addEventListener("change", () => {
      this.autoMode = autoSwitch.checked;
      logUserAction("auto_control", this.autoMode ? "on" : "off");
      console.log("Tự động:", this.autoMode);
    });
  }
  fanControlSetting() {

    const overlay = document.getElementById("fanThresholdOverlay");
    const dashboard = document.getElementById("dashboard");
    const fanOn = document.getElementById("fanOn");
    const fanOnValue = document.getElementById("fanOnValue");
    const fanOff = document.getElementById("fanOff");
    const fanOffValue = document.getElementById("fanOffValue");
    const closePopupBtn = document.getElementById("closePopup");

    const controlBtns = document.querySelectorAll(".control-btn.fanOpenThresholdBtn");
    controlBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.classList.add("active");
        dashboard?.classList.add("blurred");

        // Lưu lịch sử mở popup cài đặt ngưỡng quạt
        logUserAction("fan_threshold_popup", "opened");
      });
    });

    closePopupBtn?.addEventListener("click", () => {
      overlay.classList.remove("active");
      dashboard?.classList.remove("blurred");

      // Lưu lịch sử đóng popup cài đặt ngưỡng quạt
      logUserAction("fan_threshold_popup", "closed");
      logUserAction("fan_threshold_popup", `fanOn:` + this.fanOn + `°C, fanOff: ` + this.fanOff + `°C`);
    });

    fanOn?.addEventListener("input", () => {
      fanOnValue.textContent = fanOn.value;
      this.fanOn = parseFloat(fanOn.value);

      // Lưu lịch sử thay đổi ngưỡng quạt bật
      // logUserAction("fan_threshold_change", `fanOn: ${this.fanOn}°C `);

      // Update temperature threshold for notifications
      this.pushNotifier.updateThresholds({
        temperature: { high: parseInt(fanOn.value), low: 10 }
      });
    });

    fanOff?.addEventListener("input", () => {
      fanOffValue.textContent = fanOff.value;
      this.fanOff = parseFloat(fanOff.value);

      // Lưu lịch sử thay đổi ngưỡng quạt tắt
      // logUserAction("fan_threshold_change", `fanOff: ${this.fanOff}°C `);

      // Update light threshold for notifications
      this.pushNotifier.updateThresholds({
        light: { low: parseInt(fanOff.value) }
      });
    });
  }

  lightControlSetting() {

    const overlay = document.getElementById("lightThresholdOverlay");
    const dashboard = document.getElementById("dashboard");
    const lightOn = document.getElementById("lightOn");
    const lightOnValue = document.getElementById("lightOnValue");
    const lightOff = document.getElementById("lightOff");
    const lightOffValue = document.getElementById("lightOffValue");
    const closePopupBtn = document.getElementById("closePopup2");

    const controlBtns = document.querySelectorAll(".control-btn.lightOpenThresholdBtn");
    controlBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        overlay.classList.add("active");
        dashboard?.classList.add("blurred");

        // Lưu lịch sử mở popup cài đặt ngưỡng đèn
        logUserAction("light_threshold_popup", "opened");
      });
    });

    closePopupBtn?.addEventListener("click", () => {
      overlay.classList.remove("active");
      dashboard?.classList.remove("blurred");

      // Lưu lịch sử đóng popup cài đặt ngưỡng đèn
      logUserAction("light_threshold_popup", 'lighOn: ' + this.lightOn + ', lightOff: ' + this.lightOff);
      logUserAction("light_threshold_popup", "closed");
    });

    lightOn?.addEventListener("input", () => {
      lightOnValue.textContent = lightOn.value;
      this.lightOn = parseFloat(lightOn.value);

      // Lưu lịch sử thay đổi ngưỡng đèn bật
      // logUserAction("light_threshold_change", `lightOn: ${this.lightOn}% `);

      // Update temperature threshold for notifications
      this.pushNotifier.updateThresholds({
        temperature: { high: parseInt(fanOn.value), low: 10 }
      });
    });

    lightOff?.addEventListener("input", () => {
      lightOffValue.textContent = lightOff.value;
      this.lightOff = parseFloat(lightOff.value);

      // Lưu lịch sử thay đổi ngưỡng đèn tắt
      // logUserAction("light_threshold_change", `lightOff: ${this.lightOff}%`);

      // Update light threshold for notifications
      this.pushNotifier.updateThresholds({
        light: { low: parseInt(fanOff.value) }
      });
    });
  }

  // Thêm chức năng điều khiển thủ công đèn/quạt
  manualControl() {
    const fanToggle = document.getElementById("fanSwitch");
    if (fanToggle) {
      fanToggle.addEventListener("click", () => {
        // Lấy trạng thái hiện tại của nút
        const isOn = fanToggle.classList.contains("on");
        const newState = isOn ? "off" : "on";

        // Gửi tín hiệu điều khiển lên ESP32 qua MQTT
        this.client?.publish("23127263/esp32/control/fan", newState);
        logUserAction("fan_control", "manual_control: " + newState);

        // Cập nhật lại giao diện
        fanToggle.checked = (newState === "on");
        fanToggle.classList.toggle("on", newState === "on");
        this.currentFanState = newState; // Lưu trạng thái
        console.log(`Fan ${newState === "on" ? "On" : "Off"} (Manual Control)`);
      });
    }

    const lightToggle = document.getElementById("lightSwitch");
    if (lightToggle) {
      lightToggle.addEventListener("click", () => {
        const isOn = lightToggle.classList.contains("on");
        const newState = isOn ? "off" : "on";

        this.client?.publish("23127263/esp32/control/lamp", newState);
        logUserAction("lamp_control", "manual_control: " + newState);


        lightToggle.checked = (newState === "on");
        lightToggle.classList.toggle("on", newState === "on");
        this.currentLampState = newState;
        console.log(`Light ${newState === "on" ? "On" : "Off"} (Manual Control)`);
      });
    }
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
        // Lưu lịch sử logout
        logUserAction("user_logout", "dashboard_session_ended");

        console.log("Signed out from Firebase");
        callbackOnSuccess();
      });
    });
  }

  // controlSetting() {

  //   const overlay = document.getElementById("thresholdOverlay");
  //   const dashboard = document.getElementById("dashboard");
  //   const fanInput = document.getElementById("fanThreshold");
  //   const fanValue = document.getElementById("fanValue");
  //   const lightInput = document.getElementById("lightThreshold");
  //   const lightValue = document.getElementById("lightValue");
  //   const closePopupBtn = document.getElementById("closePopup");

  //   const controlBtns = document.querySelectorAll(".control-btn.openThresholdBtn");
  //   controlBtns.forEach(btn => {
  //     btn.addEventListener("click", () => {
  //       overlay.classList.add("active");
  //       dashboard?.classList.add("blurred");
  //     });
  //   });

  //   closePopupBtn?.addEventListener("click", () => {
  //     overlay.classList.remove("active");
  //     dashboard?.classList.remove("blurred");
  //   });

  //   lightOn?.addEventListener("input", () => {
  //     lightOnValue.textContent = lightOn.value;
  //     this.lightOn = parseFloat(lightOn.value);
  //     // Update temperature threshold for notifications
  //     this.pushNotifier.updateThresholds({
  //       temperature: { high: parseInt(fanOn.value), low: 10 }
  //     });
  //   });

  //   lightOff?.addEventListener("input", () => {
  //     lightOffValue.textContent = lightOff.value;
  //     this.lightOff = parseFloat(lightOff.value);
  //     // Update light threshold for notifications
  //     this.pushNotifier.updateThresholds({
  //       light: { low: parseInt(fanOff.value) }
  //     });
  //   });
  // }

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
    // Lưu lịch sử đăng nhập và khởi tạo dashboard

    document.getElementById("tempBox").innerHTML = ` 🌡️ Nhiệt độ: ${this.temperature} °C`;
    document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${this.humidity} °%`;
    document.getElementById("lightBox").innerHTML = `💡 Độ sáng: ${this.light} °%`;
    document.getElementById("motionBox").innerHTML = `👤 Trạng thái: ${this.motion}`;
    this.connect();
    this.logout(callbackOnLogout);
    this.fanControlSetting();
    this.lightControlSetting();
    this.manualControl(); // Thêm điều khiển thủ công
    //this.addTestNotificationButton();
  }

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
}