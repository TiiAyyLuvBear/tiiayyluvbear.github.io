import { getDatabase, ref, query, limitToLast, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { auth, logUserAction } from "./auth.js";

export class ChartDrawer {
  constructor() {
    this.db = getDatabase();
    this.interval = null;
    this.startDate = null;
    this.noDataAlerted = false;
  }

  async drawChart(startDate) {
    const database = `sensor/${startDate}`;
    console.log(database);
    const logRef = query(ref(this.db, database), limitToLast(20));

    try {
      const snapshot = await get(logRef);
      if (!snapshot.exists()) {
        console.warn(`Không có dữ liệu cho ngày ${startDate}`);


        if (!this.noDataAlerted) {
          alert(`Không có dữ liệu cho ngày ${startDate}`);
          this.noDataAlerted = true;
        }

        if (this.chartInstance) {
          this.chartInstance.destroy();
        }

        return;
      }


      this.noDataAlerted = false;

      const data = snapshot.val();
      const labels = [], temps = [], light = [], humid = [];

      Object.values(data).forEach(entry => {
        entry.time = new Date(entry.time).toLocaleTimeString();
        labels.push(entry.time);
        light.push(entry.light);
        temps.push(entry.temperature);
        humid.push(entry.humidity);
      });

      const canvas = document.getElementById("tempChart");
      if (!canvas) {
        console.warn("Không tìm thấy phần tử tempChart để vẽ biểu đồ");
        return;
      }

      const ctx = canvas.getContext("2d");


      if (this.chartInstance) {
        this.chartInstance.destroy();
      }

      this.chartInstance = new Chart(ctx, {
        type: "line",
        data: {
          labels: labels,
          datasets: [
            {
              label: "Nhiệt độ (°C)",
              data: temps,
              borderColor: "red",
              backgroundColor: "rgba(255, 0, 0, 0.1)",
              fill: false,
              tension: 0.3
            },
            {
              label: "Độ ẩm (%)",
              data: humid,
              borderColor: "blue",
              backgroundColor: "rgba(0, 0, 255, 0.1)",
              fill: false,
              tension: 0.3
            },
            {
              label: "Ánh sáng (%)",
              data: light,
              borderColor: "orange",
              backgroundColor: "rgba(255, 165, 0, 0.1)",
              fill: false,
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          plugins: {
            tooltip: {
              enabled: true,
            },
            title: {
              display: true,

            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: "Thời gian"
              }
            },
            y: {
              title: {
                display: true,
                text: "Giá trị đo"
              }
            }
          }
        }
      });

    } catch (error) {
      console.error("Lỗi khi đọc dữ liệu từ Firebase:", error);
    }
  }


  logout(callbackOnSuccess) {
    const logoutBtn = document.getElementById("logoutBtn2");
    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();

      signOut(auth).then(() => {
        console.log("Signed out from Firebase");
        if (this.interval) clearInterval(this.interval);
        callbackOnSuccess();
      });
    });
  }

  filter() {

    const filterer = document.getElementById("filterBtn");

    filterer.addEventListener("click", (event) => {
      event.preventDefault()
      const startDate = document.getElementById("startDate").value;


      if (!startDate) {
        alert("Thiếu ngày bắt đầu hoặc ngày kết thúc!!");
        return;
      }

      this.startDate = startDate;
      logUserAction("filter_chart", "Lọc dữ liệu theo ngày: " + startDate);
      this.drawChart(this.startDate);


    })

  }

  onClickPoint() {
    const canvas = document.getElementById("tempChart");

    if (!canvas) {
      console.warn("Không tìm thấy phần tử tempChart để gán sự kiện click");
      return;
    }

    canvas.onclick = (evt) => {
      const points = this.chartInstance.getElementsAtEventForMode(
        evt,
        'nearest',
        { intersect: true },
        true
      );

      if (points.length) {
        const point = points[0];
        const dataset = this.chartInstance.data.datasets[point.datasetIndex];
        const label = this.chartInstance.data.labels[point.index];
        const value = dataset.data[point.index];

      }
    };

  }



  init(callbackOnLogout) {

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    document.getElementById("startDate").value = todayStr;
    this.startDate = todayStr;

    const user = auth.currentUser;
    if (!user || !user.email) {
      console.error("Chưa đăng nhập hoặc không có email");
      return;
    }
    const email = user.email;
    const lastIndex = email.lastIndexOf("@");
    const emailPrefix = lastIndex !== -1 ? email.substring(0, lastIndex) : email;

    document.getElementById("usernameDisplay2").innerHTML = `${emailPrefix}`;

    this.drawChart(this.startDate);
    this.logout(callbackOnLogout);
    this.filter();

    this.onClickPoint();
    this.interval = setInterval(() => this.drawChart(this.startDate), 30000);

  }
}
