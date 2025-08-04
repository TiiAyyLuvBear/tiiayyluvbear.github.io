import { Auth } from './auth.js';
import { MqttHandler } from './dashboard.js';
import { ChartDrawer } from './chart.js';

const auth = new Auth();
const mqttHandler = new MqttHandler();
const chart = new ChartDrawer();

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

    const btnStatistics = document.getElementById('chartBtn');
    if (btnStatistics) {
      btnStatistics.addEventListener('click', () => {
        this.showTab('chart');
        chart.init();  // Vẽ biểu đồ
        // Log navigation event
        mqttHandler.logUserActivity?.("navigation", "Xem trang thống kê");
      });
    }

    const btnDashboard = document.getElementById('dashBoardBtn');
    if (btnDashboard) {
      btnDashboard.addEventListener('click', () => {
        this.showTab('dashboard');
        mqttHandler.logUserActivity?.("navigation", "Quay về trang chính");
      })
    }

    const btnBack = document.getElementById('backBtn');
    if (btnBack) {
      btnBack.addEventListener('click', () => {
        this.showTab('dashboard');
        mqttHandler.logUserActivity?.("navigation", "Quay về dashboard");
      })
    }

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

