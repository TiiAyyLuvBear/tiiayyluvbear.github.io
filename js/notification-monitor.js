import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { app } from './auth.js';

const db = getDatabase(app);

const PUSHSAFER_KEY = 'YyS1c3Dl4NN20ckONcl5'; // 🔁 Thay bằng key của bạn

function sendPushNotification(title, message) {
  fetch('https://www.pushsafer.com/api', {
    method: 'POST',
    body: new URLSearchParams({
      k: PUSHSAFER_KEY,
      t: title,
      m: message,
      v: 1, // vibration
      i: 1, // icon
      s: 1, // sound
      d: '', // device (nếu muốn chỉ gửi 1 thiết bị)
    }),
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === 1) {
        console.log('✅ Notification sent:', message);
      } else {
        console.error('❌ PushSafer error:', data);
      }
    });
}

export function startMonitoring() {
  const sensorRef = ref(db, 'sensors'); // 🔁 Đường dẫn tới dữ liệu của bạn

  onValue(sensorRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    const { temperature, light, human } = data;

    // 🔥 Đặt ngưỡng
    const maxTemp = 40;
    const minTemp = 10;
    const minLight = 50;

    if (temperature > maxTemp) {
      sendPushNotification("🌡️ Nhiệt độ cao!", `Nhiệt độ hiện tại là ${temperature}°C`);
    } else if (temperature < minTemp) {
      sendPushNotification("❄️ Nhiệt độ thấp!", `Nhiệt độ hiện tại là ${temperature}°C`);
    }

    if (light < minLight) {
      sendPushNotification("💡 Ánh sáng yếu", `Ánh sáng hiện tại là ${light}`);
    }

    if (human === true) {
      sendPushNotification("🚶 Phát hiện chuyển động", "Có người vừa được phát hiện!");
    }
  });
}
