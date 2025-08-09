import { Auth } from './auth.js';
import { Dashboard } from './dashboard.js';
import { ChartDrawer } from './chart.js';
import { NotificationConfig } from './notification-config.js';
import { PushsaferNotifier } from './pushsafer.js';
import { startMonitoring } from './notification-monitor.js';
import { logUserAction } from './auth.js';

const auth = new Auth();
const dashboard = new Dashboard();
const chart = new ChartDrawer();
const notificationConfig = new NotificationConfig();
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

    document.addEventListener('click', (e) => {
      const target = e.target;
      if (!(target instanceof HTMLElement)) return;


      if (target.id === 'chartBtn') {
        this.showTab('chart');
        chart.init(() => this.handleLogout());
        logUserAction('navigation', 'Xem trang thống kê');
        return;
      }

      if (target.id === 'notificationBtn') {
        this.showTab('notification');
        logUserAction('navigation', 'Xem cài đặt thông báo');
        return;
      }

      if (target.id === 'testNotificationBtn') {
        pushsaferNotifier.testNotification();
        logUserAction('notification', 'Gửi thông báo thử nghiệm');
        return;
      }
    });

    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'dashBoardBtn') {
        this.showTab('dashboard');
        logUserAction('navigation', 'Quay về trang chính');
      }

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