import { NotificationConfig } from './notification-config.js';

export class PushsaferNotifier {
  constructor(privateKey = null) {
    this.config = new NotificationConfig();
    this.privateKey = privateKey || this.config.getPushsaferKey();
    this.apiUrl = 'https://www.pushsafer.com/api';
    
    // Để tránh spam notifications
    this.lastNotificationTime = {
      temperature: 0,
      light: 0,
      motion: 0
    };
    this.cooldownTime = 60000; // 1 phút cooldown
  }

  async sendNotification(title, message, vibration = 1, icon = 1) {
    if (!this.privateKey) {
      this.privateKey = 'EnnqEFVgDomyC8q2QL68'; // Default key
      console.warn('Pushsafer private key not configured, using default key');
    }

    try {
      const formData = new FormData();
      formData.append('k', this.privateKey);
      formData.append('m', message);
      formData.append('t', title);
      formData.append('v', vibration);
      formData.append('i', icon);

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
      return; // Still in cooldown
    }

    const thresholds = this.config.getThresholds().temperature;

    if (temperature > thresholds.high) {
      this.sendNotification(
        '🌡️ Cảnh báo nhiệt độ cao!',
        `Nhiệt độ hiện tại: ${temperature}°C - Vượt quá ngưỡng an toàn (${thresholds.high}°C)`,
        3,     // Vibration: Strong
        2      // Icon: Warning
      );
      this.lastNotificationTime.temperature = now;
    } else if (temperature < thresholds.low) {
      this.sendNotification(
        '🧊 Cảnh báo nhiệt độ thấp!',
        `Nhiệt độ hiện tại: ${temperature}°C - Dưới ngưỡng an toàn (${thresholds.low}°C)`,
        3,     // Vibration: Strong
        2      // Icon: Warning
      );
      this.lastNotificationTime.temperature = now;
    }
  }

  checkAndNotifyLight(lightLevel) {
    if (!this.config.isNotificationEnabled('light')) return;

    const now = Date.now();
    if (now - this.lastNotificationTime.light < this.cooldownTime) {
      return; // Still in cooldown
    }

    const thresholds = this.config.getThresholds().light;

    if (lightLevel < thresholds.low) {
      this.sendNotification(
        '💡 Cảnh báo ánh sáng yếu!',
        `Độ sáng hiện tại: ${lightLevel}% - Dưới ngưỡng khuyến nghị (${thresholds.low}%)`,
        2,     // Vibration: Medium
        12     // Icon: Lightbulb
      );
      this.lastNotificationTime.light = now;
    }
  }

  checkAndNotifyMotion(motionDetected) {
    if (!this.config.isNotificationEnabled('motion')) return;

    const now = Date.now();
    if (now - this.lastNotificationTime.motion < this.cooldownTime) {
      return; // Still in cooldown
    }

    if (motionDetected) {
      this.sendNotification(
        '🚨 Phát hiện chuyển động!',
        'PIR sensor đã phát hiện có người trong khu vực giám sát',
        3,     // Vibration: Strong
        18     // Icon: Person
      );
      this.lastNotificationTime.motion = now;
    }
  }

  // Update thresholds
  updateThresholds(newThresholds) {
    this.config.updateThresholds(newThresholds);
  }

  // Update private key
  setPushsaferKey(key) {
    this.privateKey = key;
    this.config.setPushsaferKey(key);
  }

  // Toggle notifications
  toggleNotification(type, enabled) {
    this.config.toggleNotification(type, enabled);
  }

  // Test notification
  async testNotification() {
    return await this.sendNotification(
      '🧪 Test cái cc',
      1, // Vibration: Default
      0  // Icon: Default
    );
  }

  // Get configuration interface
  getConfig() {
    return this.config;
  }
}
