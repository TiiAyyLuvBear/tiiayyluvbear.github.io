import { auth, app, logUserAction } from './auth.js';
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { PushsaferNotifier } from './pushsafer.js';
import { getDatabase, ref, push, set, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

export class Dashboard {
  constructor() {
    this.client = null;
    this.pushNotifier = new PushsaferNotifier();
    this.temperature = 0;
    this.humidity = 0;
    this.light = 0;
    this.motion = 0;
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
      this.client.subscribe("23127263/esp32/control/buzzer");
    });



    this.client.on("message", (topic, message) => {
      const value = message.toString();
      const key = topic.split("/").pop();

      if (key === "temperature") {
        const temp = parseInt(value);
        this.temperature = temp;
        document.getElementById("tempBox").innerHTML = `🌡️ Nhiệt độ: ${value} °C`;
        this.pushNotifier.checkAndNotifyTemperature(temp);
        this.cache.temperature = temp;
        if (this.fanOn && temp >= this.fanOn) {
          this.client?.publish("23127263/esp32/control/buzzer", "on");
          console.log("🔔 Buzzer ON (nhiệt độ cao)");
        } else if (this.fanOff && temp < this.fanOff) {
          this.client?.publish("23127263/esp32/control/buzzer", "on");
          console.log("🔔 Buzzer ON (nhiệt độ thấp)");
        }
      }

      if (key === "humidity") {
        const hum = parseInt(value);
        this.humidity = hum;
        document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${value} %`;
        this.cache.humidity = hum;
      }

      if (key === "light") {
        const light = parseInt(value);
        this.light = light;
        document.getElementById("lightBox").innerHTML = `💡 Độ sáng: ${value} %`;
        this.pushNotifier.checkAndNotifyLight(light);
        this.cache.light = light;
        if (this.lightOn && light < this.lightOn) {
          this.client?.publish("23127263/esp32/control/buzzer", "on");
          console.log("🔔 Buzzer ON (ánh sáng thấp)");
        }
        if (this.lightOff && light >= this.lightOff) {
          this.client?.publish("23127263/esp32/control/buzzer", "on");
          console.log("🔔 Buzzer ON (ánh sáng cao)");
        }
      }

      if (key === "motion") {
        const motionValue = parseInt(value);
        this.motion = motionValue;
        const motionBox = document.getElementById("motionBox");
        if (motionBox) motionBox.innerHTML = `👤 Trạng thái: ${motionValue === 1 ? 'Có người' : 'Không có người'}`;
        this.cache.motion = motionValue;
      }

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

        const logRef = ref(getDatabase(), `/sensor/${dateStr}/`);
        push(logRef, payload)
          .then(() => console.log("✅ Dữ liệu đã được lưu vào Firebase:", payload))
          .catch((error) => console.error("❌ Lỗi khi lưu dữ liệu vào Firebase:", error));

        this.cache = {};
      }
    });

    setInterval(() => {
      if (!this.autoMode) return;

      if (this.motion === 0 || this.motion === null) {
        if (this.currentFanState !== "off") {
          this.client?.publish("23127263/esp32/control/fan", "off");
          const fanEl = document.getElementById("fanSwitch");
          if (fanEl) fanEl.checked = false;
          this.currentFanState = "off";
          logUserAction("fan_control", "auto_control: off");
        }
        if (this.currentLampState !== "off") {
          this.client?.publish("23127263/esp32/control/lamp", "off");
          const lightEl = document.getElementById("lightSwitch");
          if (lightEl) lightEl.checked = false;
          this.currentLampState = "off";
          logUserAction("lamp_control", "auto_control: off");
        }
        return;
      }

      if (this.temperature >= this.fanOn && this.currentFanState !== "on") {
        this.client?.publish("23127263/esp32/control/fan", "on");
        const fanEl2 = document.getElementById("fanSwitch");
        if (fanEl2) fanEl2.checked = true;
        this.currentFanState = "on";
        logUserAction("fan_control", "auto_control: on");
      } else if (this.temperature <= this.fanOff && this.currentFanState !== "off") {
        this.client?.publish("23127263/esp32/control/fan", "off");
        const fanEl3 = document.getElementById("fanSwitch");
        if (fanEl3) fanEl3.checked = false;
        this.currentFanState = "off";
        logUserAction("fan_control", "auto_control: off");
      }

      if (this.light <= this.lightOn && this.currentLampState !== "on") {
        this.client?.publish("23127263/esp32/control/lamp", "on");
        const lightEl2 = document.getElementById("lightSwitch");
        if (lightEl2) lightEl2.checked = true;
        this.currentLampState = "on";
        logUserAction("lamp_control", "auto_control: on");
      } else if (this.light >= this.lightOff && this.currentLampState !== "off") {
        this.client?.publish("23127263/esp32/control/lamp", "off");
        const lightEl3 = document.getElementById("lightSwitch");
        if (lightEl3) lightEl3.checked = false;
        this.currentLampState = "off";
        logUserAction("lamp_control", "auto_control: off");
      }
    }, 100);

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
        logUserAction("fan_threshold_popup", "opened");
      });
    });

    closePopupBtn?.addEventListener("click", () => {
      overlay.classList.remove("active");
      dashboard?.classList.remove("blurred");
      logUserAction("fan_threshold_popup", "closed");
      logUserAction("fan_threshold_popup", `fanOn: ${this.fanOn}°C, fanOff: ${this.fanOff}°C`);
      this.saveThresholdsToFirebase();
      this.client?.publish("23127263/esp32/threshold/fanOn", String(this.fanOn));
      this.client?.publish("23127263/esp32/threshold/fanOff", String(this.fanOff));
    });

    fanOn?.addEventListener("input", () => {
      fanOnValue.textContent = fanOn.value;
      this.fanOn = parseFloat(fanOn.value);
      this.pushNotifier.updateThresholds({
        temperature: { ...this.pushNotifier.getConfig().getThresholds().temperature, high: parseInt(fanOn.value) }
      });
    });

    fanOff?.addEventListener("input", () => {
      fanOffValue.textContent = fanOff.value;
      this.fanOff = parseFloat(fanOff.value);
    });

    this.syncThresholdUI();
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
        logUserAction("light_threshold_popup", "opened");
      });
    });

    closePopupBtn?.addEventListener("click", () => {
      overlay.classList.remove("active");
      dashboard?.classList.remove("blurred");
      logUserAction("light_threshold_popup", `lightOn: ${this.lightOn}, lightOff: ${this.lightOff}`);
      logUserAction("light_threshold_popup", "closed");
      this.saveThresholdsToFirebase();
      this.client?.publish("23127263/esp32/threshold/lightOn", String(this.lightnOn));
      this.client?.publish("23127263/esp32/threshold/lightOff", String(this.lightOff));
    });

    lightOn?.addEventListener("input", () => {
      lightOnValue.textContent = lightOn.value;
      this.lightOn = parseFloat(lightOn.value);
      this.pushNotifier.updateThresholds({
        light: { ...this.pushNotifier.getConfig().getThresholds().light, low: parseInt(lightOn.value) }
      });
    });

    lightOff?.addEventListener("input", () => {
      lightOffValue.textContent = lightOff.value;
      this.lightOff = parseFloat(lightOff.value);
    });

    this.syncThresholdUI();
  }

  manualControl() {
    const fanToggle = document.getElementById("fanSwitch");
    if (fanToggle) {
      fanToggle.addEventListener("click", () => {
        const newState = fanToggle.checked ? "on" : "off";
        this.client?.publish("23127263/esp32/control/fan", newState);
        logUserAction("fan_control", "manual_control: " + newState);
        fanToggle.checked = (newState === "on");
        this.currentFanState = newState;
      });
    }

    const lightToggle = document.getElementById("lightSwitch");
    if (lightToggle) {
      lightToggle.addEventListener("click", () => {
        const newState = lightToggle.checked ? "on" : "off";
        this.client?.publish("23127263/esp32/control/lamp", newState);
        logUserAction("lamp_control", "manual_control: " + newState);
        lightToggle.checked = (newState === "on");
        this.currentLampState = newState;
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
      logUserAction("logout", "Đăng xuất thành công");
      signOut(auth).then(() => {
        callbackOnSuccess();
      });
    });
  }

  setupEmailReportPopup() {
    const notificationIcon = document.getElementById('notificationIcon');
    const emailPopup = document.getElementById('emailPopup');
    const saveEmailBtn = document.getElementById('saveEmailBtn');
    const cancelEmailBtn = document.getElementById('cancelEmailBtn');
    const emailInput = document.getElementById('emailInput');

    if (!notificationIcon || !emailPopup) return;

    notificationIcon.addEventListener('click', () => {
      emailPopup.style.display = 'block';
      const savedEmail = localStorage.getItem('notifyEmail');
      if (savedEmail) emailInput.value = savedEmail;
    });

    if (!cancelEmailBtn.dataset.listenerAdded) {
      cancelEmailBtn.addEventListener('click', () => {
        emailPopup.style.display = 'none';
      });
      cancelEmailBtn.dataset.listenerAdded = 'true';
    }

    if (!saveEmailBtn.dataset.listenerAdded) {
      saveEmailBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        if (email === '' || !email.includes('@')) {
          alert('Vui lòng nhập email hợp lệ');
          return;
        }

        localStorage.setItem('notifyEmail', email);

        try {
          const serverUrl = "http://localhost:5000";
          const res = await fetch(`${serverUrl}/send-report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });

          const data = await res.json();
          if (data.success) {
            alert('✅ ' + data.message);
          } else {
            alert('❌ ' + (data.error || 'Lỗi không xác định'));
          }
        } catch (err) {
          alert('❌ Lỗi khi gửi yêu cầu');
          console.error(err);
        }

        emailPopup.style.display = 'none';
      });
      saveEmailBtn.dataset.listenerAdded = 'true';
    }
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

        this.pushNotifier.updateThresholds({
          temperature: { 
            high: this.fanOn,
            low: this.fanOff 
          },
          light: {
            low: this.lightOn,
            high: this.lightOff
          }
        });

        this.client?.publish("23127263/esp32/threshold/fanOn", String(this.fanOn));
        this.client?.publish("23127263/esp32/threshold/fanOff", String(this.fanOff));
        this.client?.publish("23127263/esp32/threshold/lightOn", String(this.lightOn));
        this.client?.publish("23127263/esp32/threshold/lightOff", String(this.lightOff));
        console.log("sended");


        this.syncThresholdUI();
      } else {

        const defaults = {
          fanOn: 30,
          fanOff: 20,
          lightOn: 25,
          lightOff: 75
        };
        this.fanOn = defaults.fanOn;
        this.fanOff = defaults.fanOff;
        this.lightOn = defaults.lightOn;
        this.lightOff = defaults.lightOff;
        this.saveThresholdsToFirebase();
        this.syncThresholdUI();
        console.log("Applied default thresholds for new user.");
      }
    }).catch((error) => {
      console.error("Failed to load thresholds:", error);
    });
  }

  init(callbackOnLogout) {
    document.getElementById("tempBox").innerHTML = ` 🌡️ Nhiệt độ: ${this.temperature} °C`;
    document.getElementById("humiBox").innerHTML = `💧 Độ ẩm: ${this.humidity} %`;
    document.getElementById("lightBox").innerHTML = `💡 Độ sáng: ${this.light} %`;
    document.getElementById("motionBox").innerHTML = `👤 Trạng thái: ${this.motion}`;

    const user = auth.currentUser;
    if (!user || !user.email) {
      console.error("Chưa đăng nhập hoặc không có email");
      return;
    }

    const email = user.email;
    const lastIndex = email.lastIndexOf("@");
    const emailPrefix = lastIndex !== -1 ? email.substring(0, lastIndex) : email;

    document.getElementById("usernameDisplay").innerHTML = `${emailPrefix}`;

    this.connect();
    this.logout(callbackOnLogout);
    this.loadThresholdsFromFirebase();
    this.fanControlSetting();
    this.lightControlSetting();
    this.manualControl();
    this.setupEmailReportPopup();
    this.syncThresholdUI();
  }
}

Dashboard.prototype.syncThresholdUI = function () {
  const fanOnInput = document.getElementById("fanOn");
  const fanOffInput = document.getElementById("fanOff");
  const lightOnInput = document.getElementById("lightOn");
  const lightOffInput = document.getElementById("lightOff");
  if (fanOnInput && this.fanOn !== undefined) fanOnInput.value = this.fanOn;
  if (fanOffInput && this.fanOff !== undefined) fanOffInput.value = this.fanOff;
  if (lightOnInput && this.lightOn !== undefined) lightOnInput.value = this.lightOn;
  if (lightOffInput && this.lightOff !== undefined) lightOffInput.value = this.lightOff;

  const fanOnValue = document.getElementById("fanOnValue");
  const fanOffValue = document.getElementById("fanOffValue");
  const lightOnValue = document.getElementById("lightOnValue");
  const lightOffValue = document.getElementById("lightOffValue");
  if (fanOnValue && this.fanOn !== undefined) fanOnValue.textContent = this.fanOn;
  if (fanOffValue && this.fanOff !== undefined) fanOffValue.textContent = this.fanOff;
  if (lightOnValue && this.lightOn !== undefined) lightOnValue.textContent = this.lightOn;
  if (lightOffValue && this.lightOff !== undefined) lightOffValue.textContent = this.lightOff;
};
