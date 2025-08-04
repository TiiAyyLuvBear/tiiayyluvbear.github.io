require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

const firebaseURL = process.env.FIREBASE_URL;
const EMAIL_TO = process.env.EMAIL_TO;

async function run() {
    try {
        const res = await axios.get(firebaseURL);
        const data = res.data;

        if (!data) {
            console.warn("Không có dữ liệu từ Firebase.");
            return;
        }

        // Gom nhóm dữ liệu theo ngày
        const groups = {};

        Object.values(data).forEach(item => {
            const timestamp = item.time;
            if (!timestamp || !timestamp.includes(" ")) return;

            const [date] = timestamp.split(" ");
            if (!groups[date]) {
                groups[date] = {
                    tempSum: 0, tempCount: 0,
                    humSum: 0, humCount: 0
                };
            }

            const temp = parseFloat(item.temperature);
            const hum = parseFloat(item.humidity);

            if (!isNaN(temp)) {
                groups[date].tempSum += temp;
                groups[date].tempCount++;
            }

            if (!isNaN(hum)) {
                groups[date].humSum += hum;
                groups[date].humCount++;
            }
        });

        // Tạo HTML báo cáo
        let html = `
            <h2>Báo cáo trung bình nhiệt độ và độ ẩm theo ngày</h2>
            <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th>Ngày</th>
                        <th>Nhiệt độ TB (°C)</th>
                        <th>Độ ẩm TB (%)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        const dates = Object.keys(groups).sort();
        for (let date of dates) {
            const group = groups[date];
            const tempAvg = (group.tempCount > 0) ? (group.tempSum / group.tempCount).toFixed(2) : "N/A";
            const humAvg = (group.humCount > 0) ? (group.humSum / group.humCount).toFixed(2) : "N/A";

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${tempAvg}</td>
                    <td>${humAvg}</td>
                </tr>
            `;
        }

        html += `</tbody></table>`;

        // Gửi email
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const info = await transporter.sendMail({
            from: `"Hệ thống giám sát" <${process.env.EMAIL_USER}>`,
            to: EMAIL_TO,
            subject: `Báo cáo cảm biến ngày ${new Date().toLocaleDateString('vi-VN')}`,
            html: html
        });

        console.log("📧 Gửi thành công:", EMAIL_TO);

    } catch (err) {
        console.error("❌ Lỗi:", err.message || err);
    }
}

// Gọi lần đầu ngay khi chạy
run();

// Lặp lại mỗi giờ
setInterval(run, 60 * 60 * 1000);  // 1 giờ
