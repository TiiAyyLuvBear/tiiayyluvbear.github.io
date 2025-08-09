import { Auth } from './auth.js';
import { Dashboard } from './dashboard.js';
import { ChartDrawer } from './chart.js';
import { NotificationConfig } from './notification-config.js';
import { PushsaferNotifier } from './pushsafer.js';
import { startMonitoring } from './notification-monitor.js';


const auth = new Auth();
const dashboard = new Dashboard();
const chart = new ChartDrawer();
const notificationConfig = new NotificationConfig(); // Assuming this is defined in your project
const pushsaferNotifier = new PushsaferNotifier();

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

    // Delegate clicks so elements can be added later (tabs are loaded asynchronously)
    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;

      // Go to Chart tab
      if (target.id === 'chartBtn') {
        this.showTab('chart');
        chart.init(() => this.handleLogout());
        if (dashboard.logUserActivity) dashboard.logUserActivity('navigation', 'Xem trang thống kê');
        return;
      }

      // Go to Notification Settings tab
      if (target.id === 'notificationBtn') {
        this.showTab('notification');
        if (dashboard.logUserActivity) dashboard.logUserActivity('navigation', 'Xem cài đặt thông báo');
        return;
      }

      // Test Push notification
      if (target.id === 'testNotificationBtn') {
        pushsaferNotifier.testNotification();
        if (dashboard.logUserActivity) dashboard.logUserActivity('notification', 'Gửi thông báo thử nghiệm');
        return;
      }
    });

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
        if (dashboard.logUserActivity) dashboard.logUserActivity('navigation', 'Quay về trang chính');
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
startMonitoring();
const app = new App();