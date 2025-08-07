import { Auth } from './auth.js';
import { Dashboard } from './dashboard.js';
import { ChartDrawer } from './chart.js';
import { NotificationConfig } from './notification-config.js';

const auth = new Auth();
const dashboard = new Dashboard();
const chart = new ChartDrawer();
const notificationConfig = new NotificationConfig(); // Assuming this is defined in your project

class App {
  constructor() {
    auth.onAuthStateChanged((user) => {
      if (user) {
        this.showTab('dashboard');
        dashboard.init(() => this.handleLogout());
      } else {
        this.showTab('login');
      }
    });

    auth.init(() => {
      this.showTab('dashboard');
      dashboard.init(() => this.handleLogout());
    });

    const btnStatistics = document.getElementById('chartBtn');
    if (btnStatistics) {
      btnStatistics.addEventListener('click', () => {
        this.showTab('chart');
        chart.init(() => this.handleLogout());  // Vẽ biểu đồ
        // Log navigation event
        dashboard.logUserActivity?.("navigation", "Xem trang thống kê");
      });
    }
    const btnNotificationSettings = document.getElementById('notificationBtn');
    if (btnNotificationSettings) {
      btnNotificationSettings.addEventListener('click', () => {
        this.showTab('notification');
        dashboard.logUserActivity?.("navigation", "Xem cài đặt thông báo");
      });
    }

    // const btnDashboard = document.getElementById('dashBoardBtn');
    // if (btnDashboard) {
    //   btnDashboard.addEventListener('click', () => {
    //     this.showTab('dashboard');
    //     mqttHandler.logUserActivity?.("navigation", "Quay về trang chính");
    //   })
    // }
    
    //Cái này t sửa để dùng chung nút quay về dashboard
    document.addEventListener('click', (e) => {
      // Nút quay về Dashboard
      if (e.target && e.target.id === 'dashBoardBtn') {
        this.showTab('dashboard');
        dashboard.logUserActivity?.("navigation", "Quay về trang chính");
      }

      // Nút đăng xuất (dùng chung cho mọi tab)
      if (e.target && e.target.id === 'logoutBtn') {
        auth.logout(() => {
          this.showTab('login');
        });
      }
      
      if (e.target && e.target.id === 'logoutBtn2') {
        auth.logout(() => {
          this.showTab('login');
        });
      }
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


