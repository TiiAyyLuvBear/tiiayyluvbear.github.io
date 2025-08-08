Server (email report) setup

Environment variables required (create a .env file in this folder):

- FIREBASE_URL=https://<your-db>.asia-southeast1.firebasedatabase.app/sensor.json
- EMAIL_USER=your@gmail.com
- EMAIL_PASS=your_app_password

Run the server:

1. npm install
2. npm start

Frontend will POST to http://localhost:3000/send-report when saving the report email.
