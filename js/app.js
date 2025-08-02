class App {
  constructor() {
    this.currentTab = 'login';
    this.showTab(this.currentTab);
  }

  showTab(tabId) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');

    if (tabId === 'dashboard') mqttHandler.connect();
    if (tabId === 'chart') chart.drawChart();
  }
}

const app = new App();
