require('dotenv').config();
const axios = require('axios');
const nodemailer = require('nodemailer');

const firebaseURL = process.env.FIREBASE_URL;

async function sendReport(toEmail) {
    if (!toEmail) {
    console.warn("⚠ Không có email để gửi báo cáo");
        return;
    }

    try {
        const res = await axios.get(firebaseURL);
        const data = res.data;

        if (!data) {
            console.warn("⚠ Không có dữ liệu từ Firebase.");
            return;
        }

        let reportData = [];

        for (let date in data) {
            let records = Object.values(data[date]);
            let tempSum = 0, tempCount = 0;
            let humSum = 0, humCount = 0;
            let lightSum = 0, lightCount = 0;
            let motionTrue = 0, motionFalse = 0;

            records.forEach(item => {
                let temp = parseInt(item.temperature);
                let hum = parseInt(item.humidity);
                let light = parseInt(item.light);
                let motion = item.motion;

                if (!isNaN(temp)) { tempSum += temp; tempCount++; }
                if (!isNaN(hum)) { humSum += hum; humCount++; }
                if (!isNaN(light)) { lightSum += light; lightCount++; }
                if (motion) motionTrue++;
                else motionFalse++;
            });

            reportData.push({
                date,
                tempAvg: tempCount ? Math.floor(tempSum / tempCount) : "N/A",
                humAvg: humCount ? Math.floor(humSum / humCount) : "N/A",
                lightAvg: lightCount ? Math.floor(lightSum / lightCount) : "N/A",
                motionTrue,
                motionFalse
            });
        }

        let html = `
        <h2>Báo cáo trung bình cảm biến theo ngày</h2>
        <table border="1" cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
            <thead>
                <tr style="background-color: #f2f2f2;">
                    <th>Ngày</th>
                    <th>Nhiệt độ TB (°C)</th>
                    <th>Độ ẩm TB (%)</th>
                    <th>Ánh sáng TB</th>
                    <th>Số lần có người</th>
                    <th>Số lần không có người</th>
                </tr>
            </thead>
            <tbody>
        `;

        reportData.sort((a, b) => a.date.localeCompare(b.date)).forEach(row => {
            html += `
            <tr>
                <td>${row.date}</td>
                <td>${row.tempAvg}</td>
                <td>${row.humAvg}</td>
                <td>${row.lightAvg}</td>
                <td>${row.motionTrue}</td>
                <td>${row.motionFalse}</td>
            </tr>
            `;
        });

        html += `</tbody></table>`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: `"Hệ thống giám sát" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: `Báo cáo cảm biến ngày ${new Date().toLocaleDateString('vi-VN')}`,
            html
        });

        console.log(`📧 Gửi báo cáo thành công tới ${toEmail}`);

    } catch (error) {
        console.error("❌ Lỗi gửi báo cáo:", error.message || error);
    }
}

module.exports = { sendReport };
