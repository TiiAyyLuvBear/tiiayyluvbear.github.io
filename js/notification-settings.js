import { PushsaferNotifier } from './pushsafer.js';

const notifier = new PushsaferNotifier();
notifier.setPushsaferKey('EYyS1c3Dl4NN20ckONcl5');

document.getElementById("testNotificationBtn").addEventListener("click", () => {
  notifier.testNotification();
});

