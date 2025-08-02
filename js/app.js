import { Auth } from './auth.js';
// import { ChartDrawer } from './chart.js';
import { MqttHandler } from './mqttHandler.js';

const mqttHandler = new MqttHandler();
const auth = new Auth();

class App {
  constructor() {
    this.currentTab = 'login';
    this.showTab(this.currentTab);

    auth.setupLogin(() => {
      this.showTab('dashboard');
    });

   
    auth.setupSignup();
  }

  showTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'dashboard') mqttHandler.connect?.(); // Nếu có hàm connect
    if (tabId === 'chart') chart?.drawChart?.();        // Nếu dùng biểu đồ
  }
}

const app = new App();
