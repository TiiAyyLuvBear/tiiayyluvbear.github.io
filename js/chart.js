import { getDatabase, ref, query, limitToLast, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { auth } from "./auth.js";

export class ChartDrawer {
  constructor() {
    this.db = getDatabase();
    this.interval = null;
  }

  async drawChart() {
    const logRef = query(ref(this.db, "log"), limitToLast(20));

    try {
      const snapshot = await get(logRef);
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const labels = [], temps = [], light = [], humid = [];

      Object.values(data).forEach(entry => {
        // Nếu bạn lưu time là timestamp thì cần định dạng lại
        // labels.push(new Date(entry.time).toLocaleTimeString());
        labels.push(entry.time); // Nếu đã là chuỗi giờ

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

      // Hủy biểu đồ cũ nếu có
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
              label: "Ánh sáng (lux)",
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
            title: {
              display: true,
              text: "Biểu đồ nhiệt độ, độ ẩm và ánh sáng theo thời gian"
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
        if (this.interval) clearInterval(this.interval); // Ngừng cập nhật biểu đồ
        callbackOnSuccess();
      });
    });
  }

  init(callbackOnSuccess) {
    this.drawChart();
    this.logout(callbackOnSuccess);

    // Cập nhật biểu đồ mỗi 30 giây
    this.interval = setInterval(() => this.drawChart(), 30000);
  }
}
