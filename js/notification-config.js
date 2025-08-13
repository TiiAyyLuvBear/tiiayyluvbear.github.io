export class NotificationConfig {
  constructor() {
    this.storageKey = 'iot_notification_config';
    this.defaultConfig = {
      pushsaferKey: 'AjbLd7QiEQ2qUeBlvt1R',
      thresholds: {
        temperature: {
          high: 30,
          low: 20
        },
        light: {
          high: 75,
          low: 25
        }
      },
      notifications: {
        temperature: true,
        light: true,
        motion: true
      },
      sounds: {
  temperature: 8,
  light: 8,
  motion: 15
      }
    };
    
    this.loadConfig();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      this.config = saved ? { ...this.defaultConfig, ...JSON.parse(saved) } : { ...this.defaultConfig };
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = { ...this.defaultConfig };
    }
  }

  saveConfig() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
      return true;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  get(key) {
    return this.config[key];
  }

  set(key, value) {
    this.config[key] = value;
    this.saveConfig();
  }

  updateThresholds(newThresholds) {
    this.config.thresholds = { ...this.config.thresholds, ...newThresholds };
    this.saveConfig();
  }

  toggleNotification(type, enabled) {
    this.config.notifications[type] = enabled;
    this.saveConfig();
  }

  setPushsaferKey(key) {
    this.config.pushsaferKey = key;
    this.saveConfig();
  }

  getPushsaferKey() {
    return this.config.pushsaferKey;
  }

  getThresholds() {
    return this.config.thresholds;
  }

  isNotificationEnabled(type) {
    return this.config.notifications[type];
  }

  getSound(type) {
    return this.config.sounds[type];
  }

  exportConfig() {
    return JSON.stringify(this.config, null, 2);
  }

  importConfig(configJson) {
    try {
      const imported = JSON.parse(configJson);
      this.config = { ...this.defaultConfig, ...imported };
      this.saveConfig();
      return true;
    } catch (error) {
      console.error('Error importing config:', error);
      return false;
    }
  }

  resetToDefaults() {
    this.config = { ...this.defaultConfig };
    this.saveConfig();
  }
}
