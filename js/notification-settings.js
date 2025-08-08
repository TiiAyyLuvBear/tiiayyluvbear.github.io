import { PushsaferNotifier } from './pushsafer.js';
import { auth } from './auth.js'
const notifier = new PushsaferNotifier();

// Nếu chưa có key thì set trước
notifier.setPushsaferKey('EYyS1c3Dl4NN20ckONcl5');

document.getElementById("testNotificationBtn").addEventListener("click", () => {
  notifier.testNotification();
});

