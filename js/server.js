require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { sendReport } = require('./send_report');

const app = express();
app.use(cors());
app.use(bodyParser.json());

let currentEmail = null;
let reportInterval = null;

// API nhận email từ dashboard
app.post('/send-report', (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: "Email không hợp lệ" });
    }

    currentEmail = email;

    // Clear interval cũ
    if (reportInterval) {
        clearInterval(reportInterval);
    }

    // Gửi ngay 1 lần
    sendReport(currentEmail);

    // Gửi định kỳ mỗi 1 phút
    reportInterval = setInterval(() => {
        sendReport(currentEmail);
    }, 60 * 1000);

    console.log(`📌 Đã đặt lịch gửi báo cáo định kỳ tới ${currentEmail}`);
    res.json({ success: true, message: `Đã đặt lịch gửi báo cáo định kỳ tới ${currentEmail}` });
});

app.listen(3000, () => {
    console.log('🚀 Server chạy tại http://localhost:3000');
});
