import { PushsaferNotifier } from './pushsafer.js';

const notifier = new PushsaferNotifier();
notifier.setPushsaferKey('EYyS1c3Dl4NN20ckONcl5');

document.getElementById("testNotificationBtn")?.addEventListener("click", () => {
  notifier.testNotification();
});

import { auth } from "./auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

onAuthStateChanged(auth, (user) => {
  if (user?.email) {
    const emailPrefix = user.email.split("@")[0];
    const usernameDisplay = document.getElementById("usernameDisplay3");
    if (usernameDisplay) {
      usernameDisplay.textContent = emailPrefix;
    }
  }
});