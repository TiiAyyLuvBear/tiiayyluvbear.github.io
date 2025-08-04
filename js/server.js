require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// Chạy ngầm script gửi báo cáo
require('./send_report');

// Phục vụ các file trong thư mục gốc (nơi có index.html)
app.use(express.static(path.join(__dirname, '..')));

// Trả về index.html khi truy cập /
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.listen(port, () => {
    console.log(`🌐 Server đang chạy tại http://localhost:${port}`);
});
