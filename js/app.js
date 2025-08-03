import { Auth } from './auth.js';
import { MqttHandler } from './dashboard.js';

const auth = new Auth();
const mqttHandler = new MqttHandler();

class App {
  constructor() {

    auth.onAuthStateChanged((user) => {
      if (user) {
        this.showTab('dashboard');
        mqttHandler.connect();
        mqttHandler.init(() => this.handleLogout());
      } else {
        this.showTab('login');
      }
    });

    auth.init(() => {
      this.showTab('dashboard');
      mqttHandler.connect();
      mqttHandler.init(() => this.handleLogout());
    });
  }

  showTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    const target = document.getElementById(tabId);
    if (target) target.classList.add('active');
  }

  handleLogout() {
    auth.logout(() => {
      this.showTab('login');
    });
  }
}

const app = new App();
