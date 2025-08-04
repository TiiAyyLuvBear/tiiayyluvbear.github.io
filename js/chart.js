
export class ChartDrawer {
  constructor() {
    // Cấu hình Firebase
    const firebaseConfig = {
      databaseURL: "https://YOUR_PROJECT.firebaseio.com"
    };
    firebase.initializeApp(firebaseConfig);
    this.db = firebase.database();
  }

  drawChart() {
    this.db.ref("sensor").limitToLast(10).once("value", snapshot => {
      const data = snapshot.val();
      const labels = [];
      const temps = [];

      for (let key in data) {
        labels.push(new Date(data[key].timestamp).toLocaleTimeString());
        temps.push(data[key].temperature);
      }

      const ctx = document.getElementById("tempChart").getContext("2d");
      new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [{
            label: "Nhiệt độ (°C)",
            data: temps,
            borderColor: "red",
            fill: false
          }]
        }
      });
    });
  }

  init() {
    this.drawChart();
  }
}

const chart = new ChartDrawer();
