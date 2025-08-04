import { getDatabase, ref, query, limitToLast, get } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { auth } from "./auth.js";

export class ChartDrawer {
  constructor() {
    this.db = getDatabase();
    this.interval = null;
    this.startDate = new Date().toLocaleDateString();
    this.endDate = this.startDate;
  }

  async drawChart(startDate, endDate) {
    console.log(startDate);
    console.log(endDate);
    const logRef = query(ref(this.db, "log"), limitToLast(20));

    try {
      const snapshot = await get(logRef);
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      const labels = [], temps = [], light = [], humid = [];

      Object.values(data).forEach(entry => {
        // Nếu bạn lưu time là timestamp thì cần định dạng lại
        // labels.push(new Date(entry.time).toLocaleTimeString());
        const entryDate = new Date(entry.time); // Nếu đã là chuỗi giờ

        const start = new Date(startDate);
        const end = new Date(endDate);
        //alert(entryDate, start, end);
        end.setDate(end.getDate() + 1);

        if (entryDate >= start && entryDate < end) {
          entry.time = new Date(entry.time).toLocaleTimeString();
          labels.push(entry.time);
          light.push(entry.light);
          temps.push(entry.temperature);
          humid.push(entry.humidity);
        }
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
            tooltip:{
              enabled: true,
            },
            title: {
              display: true,
              //text: "Biểu đồ nhiệt độ, độ ẩm và ánh sáng theo thời gian"
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

  filter(){

    const filterer = document.getElementById("filterBtn");

    filterer.addEventListener("click", (event) =>{
      event.preventDefault()
      const startDate = document.getElementById("startDate").value;
      const endDate = document.getElementById("endDate").value;

      if(!startDate || !endDate){
        alert("Thiếu ngày bắt đầu hoặc ngày kết thúc!!");
        return;
      }
      
      this.startDate = startDate;
      this.endDate = endDate;

      this.drawChart(this.startDate, this.endDate);
      
    })

  }

  onClickPoint(){
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

  init(callbackOnSuccess) {

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`; // đúng định dạng yyyy-mm-dd

    document.getElementById("startDate").value = todayStr;
    document.getElementById("endDate").value = todayStr;

    this.drawChart(this.startDate, this.endDate); 
    this.logout(callbackOnSuccess);

    this.filter();
    this.onClickPoint();
    this.interval = setInterval(() => this.drawChart(this.startDate, this.endDate), 30000);
  }
}
