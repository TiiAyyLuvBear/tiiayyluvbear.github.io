import { PushsaferNotifier } from './pushsafer.js';
import { auth } from './auth.js'
const notifier = new PushsaferNotifier();

// Nếu chưa có key thì set trước
notifier.setPushsaferKey('EnnqEFVgDomyC8q2QL68');

document.getElementById("testNotificationBtn").addEventListener("click", () => {
  notifier.testNotification();
});

