Private key ltanh23: YyS1c3Dl4NN20ckONcl5
# Hướng dẫn Setup Push Notification với Pushsafer

## 1. Đăng ký tài khoản Pushsafer

1. Truy cập [https://www.pushsafer.com](https://www.pushsafer.com)
2. Đăng ký tài khoản miễn phí
3. Xác nhận email

## 2. Lấy Private Key

1. Đăng nhập vào Pushsafer
2. Vào **Dashboard** → **API**
3. Copy **Private Key** (dạng: k-xxxxx-xxxxxxx)

## 3. Cài đặt ứng dụng Pushsafer trên điện thoại

### Android:
- Tải từ Google Play Store: "Pushsafer"
- Đăng nhập bằng tài khoản đã tạo

### iOS:
- Tải từ App Store: "Pushsafer"
- Đăng nhập bằng tài khoản đã tạo

## 4. Cấu hình trong IoT Dashboard

1. Truy cập trang **Dashboard**
2. Click vào **⚙️ Cài đặt Thông báo**
3. Nhập **Private Key** vào ô "Private Key"
4. Click **💾 Lưu Key**
5. Click **🔔 Test Notification** để kiểm tra

## 5. Cấu hình ngưỡng cảnh báo

### Nhiệt độ:
- **Nhiệt độ cao**: Cảnh báo khi > giá trị này (mặc định: 35°C)
- **Nhiệt độ thấp**: Cảnh báo khi < giá trị này (mặc định: 10°C)

### Ánh sáng:
- **Ánh sáng thấp**: Cảnh báo khi < giá trị này (mặc định: 20%)

### Chuyển động:
- **PIR Sensor**: Cảnh báo ngay khi phát hiện chuyển động

## 6. Cài đặt ESP32

### Kết nối phần cứng:
```
PIR Sensor:
- VCC → 3.3V
- GND → GND  
- OUT → GPIO2

Light Sensor (LDR):
- Một đầu → 3.3V
- Đầu kia → A0 và R 10kΩ → GND

LED chỉ thị:
- Anode → GPIO13
- Cathode → GND (qua điện trở 220Ω)
```

### Upload code:
1. Mở `esp32/esp32.ino` trong Arduino IDE
2. Cài đặt thư viện:
   - WiFi
   - PubSubClient
   - LiquidCrystal_I2C
3. Upload code lên ESP32

## 7. Test hệ thống

1. **Test kết nối**: ESP32 hiển thị "ESP32 IoT Ready" trên LCD
2. **Test MQTT**: Kiểm tra dữ liệu trên Dashboard
3. **Test PIR**: Di chuyển trước cảm biến, kiểm tra LED và notification
4. **Test nhiệt độ**: Thay đổi ngưỡng trong code để test
5. **Test ánh sáng**: Che/bật sáng cảm biến để test

## 8. Các tính năng notification

### Loại thông báo:
- 🌡️ **Nhiệt độ cao**: Khi nhiệt độ vượt ngưỡng
- 🧊 **Nhiệt độ thấp**: Khi nhiệt độ dưới ngưỡng  
- 💡 **Ánh sáng yếu**: Khi độ sáng dưới ngưỡng
- 🚨 **Chuyển động**: Khi PIR phát hiện người

### Cooldown time:
- Mỗi loại notification có cooldown 1 phút để tránh spam

### Customization:
- Âm thanh: Alarm, Alert, Notification, Emergency
- Rung: Weak, Medium, Strong
- Icon: Nhiều loại icon khác nhau

## 9. MQTT Topics

```
Publish topics (ESP32 → HiveMQ):
- 23127263/esp32/temperature
- 23127263/esp32/humidity  
- 23127263/esp32/light
- 23127263/esp32/motion
```

## 10. Troubleshooting

### Không nhận được notification:
1. Kiểm tra Private Key
2. Kiểm tra kết nối internet
3. Kiểm tra app Pushsafer trên điện thoại
4. Kiểm tra cài đặt notification trong app

### ESP32 không kết nối MQTT:
1. Kiểm tra WiFi
2. Kiểm tra broker.hivemq.com
3. Kiểm tra Serial Monitor

### Sensor không hoạt động:
1. Kiểm tra kết nối dây
2. Kiểm tra nguồn 3.3V
3. Kiểm tra pin assignments

## 11. API Pushsafer Reference

### Sounds:
- 1: Default
- 8: Notification  
- 11: Alarm
- 15: Alert
- 22: Emergency

### Icons:
- 1: Default
- 2: Warning
- 12: Lightbulb
- 18: Person

### Vibration:
- 1: Default
- 2: Medium
- 3: Strong

## 12. Backup & Restore

- **Export settings**: Download file cấu hình JSON
- **Import settings**: Upload file cấu hình  
- **Reset**: Khôi phục cài đặt mặc định
