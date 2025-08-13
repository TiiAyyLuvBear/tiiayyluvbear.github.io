import { NotificationConfig } from './notification-config.js';

export class PushsaferNotifier {
  constructor(privateKey = null) {
    this.config = new NotificationConfig();
    this.privateKey = privateKey || this.config.getPushsaferKey();
    this.apiUrl = 'https://www.pushsafer.com/api';

    this.lastNotificationTime = {
      temperature: 0,
      light: 0,
      motion: 0
    };
    this.cooldownTime = 10000;
  }

  async sendNotification(title, message, vibration = 1, icon = 1, sound = '') {
    if (!this.privateKey) {
      this.privateKey = 'AjbLd7QiEQ2qUeBlvt1R';
      console.warn('Pushsafer private key not configured, using default key');
    }

    try {
      const formData = new FormData();
      formData.append('k', this.privateKey);
      formData.append('m', message);
      formData.append('t', title);
      formData.append('v', vibration);
      formData.append('i', icon);
      if (sound) {
        formData.append('s', sound);
      }

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (result.status === 1) {
        console.log('Notification sent successfully:', result);
        return true;
      } else {
        console.error('Failed to send notification:', result);
        return false;
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  checkAndNotifyTemperature(temperature) {
    if (!this.config.isNotificationEnabled('temperature')) return;

    const now = Date.now();
    if (now - this.lastNotificationTime.temperature < this.cooldownTime) {
  return;
    }

    const thresholds = this.config.getThresholds().temperature;
    const sound = this.config.getSound('temperature');

    if (temperature >= thresholds.high) {
      this.sendNotification(
        '🌡️ Cảnh báo nhiệt độ cao!',
        `Nhiệt độ hiện tại: ${temperature}°C - Vượt quá ngưỡng (${thresholds.high}°C)`,
        3,
        2,
        sound
      );
      this.lastNotificationTime.temperature = now;
    } else if (temperature < thresholds.low) {
      this.sendNotification(
        '🧊 Cảnh báo nhiệt độ thấp!',
        `Nhiệt độ hiện tại: ${temperature}°C - Dưới ngưỡng (${thresholds.low}°C)`,
        3,
        2,
        sound
      );
      this.lastNotificationTime.temperature = now;
    }
  }

  checkAndNotifyLight(lightLevel) {
  if (!this.config.isNotificationEnabled('light')) return;

  const now = Date.now();
  if (now - this.lastNotificationTime.light < this.cooldownTime) return;

  const thresholds = this.config.getThresholds().light;
  const sound = this.config.getSound('light');

  if (lightLevel < thresholds.low) {
    this.sendNotification(
      '💡 Cảnh báo ánh sáng yếu!',
      `Độ sáng: ${lightLevel}% - Dưới ngưỡng (${thresholds.low}%)`,
      2,
      12,
      sound
    );
    this.lastNotificationTime.light = now;
  } else if (lightLevel >= thresholds.high) {
    this.sendNotification(
      '🌞 Cảnh báo ánh sáng quá mức!',
      `Độ sáng: ${lightLevel}% - Vượt quá ngưỡng (${thresholds.high}%)`,
      2,
      12,
      sound
    );
    this.lastNotificationTime.light = now;
  }
}

  checkAndNotifyMotion(motionDetected) {
    if (!this.config.isNotificationEnabled('motion')) return;

    const now = Date.now();
    if (now - this.lastNotificationTime.motion < this.cooldownTime) {
      return;
    }

    const sound = this.config.getSound('motion');

    if (motionDetected) {
      this.sendNotification(
        '🚨 Phát hiện chuyển động!',
        'PIR sensor đã phát hiện có người trong khu vực giám sát',
    3,
    18,
    sound
      );
      this.lastNotificationTime.motion = now;
    }
  }

  updateThresholds(newThresholds) {
    this.config.updateThresholds(newThresholds);
  }

  setPushsaferKey(key) {
    this.privateKey = key;
    this.config.setPushsaferKey(key);
  }

  toggleNotification(type, enabled) {
    this.config.toggleNotification(type, enabled);
  }

  async testNotification() {
  return await this.sendNotification('🧪 Test notification', 'Đây là thông báo thử nghiệm');
  }

  getConfig() {
    return this.config;
  }
}
