import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDc4KzHBVgX4l9VNfFB-oXHALg25qZwW8I",
  authDomain: "login-5637d.firebaseapp.com",
  projectId: "login-5637d",
  storageBucket: "login-5637d.firebasestorage.app",
  messagingSenderId: "640016475258",
  appId: "1:640016475258:web:d6ad2609d1aa128e4d87c3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export class Auth {
  constructor() {
    this.auth = auth;
  }

  setupLogin(callbackOnSuccess) {
    const loginBtn = document.getElementById("loginBtn");
    loginBtn.addEventListener("click", (event) => {
      event.preventDefault();
      const email = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      signInWithEmailAndPassword(this.auth, email, password)
        .then((userCredential) => {
          // alert("Đăng nhập thành công!");
          callbackOnSuccess(); // Gọi callback để chuyển tab
        })
        .catch((error) => {
          alert("Lỗi: " + error.message);
        });
    });
  }

 setupSignup() {
    const showSignupBtn = document.getElementById("signupBtn");
    const submitSignupBtn = document.getElementById("submitSignupBtn");
    const backBtn = document.getElementById("backToLoginBtn");

    // Hiện form đăng ký
    showSignupBtn.addEventListener("click", () => {
      document.getElementById("login").classList.remove("active");
      document.getElementById("signup").classList.add("active");
    });

    // Quay lại đăng nhập
    backBtn.addEventListener("click", () => {
      document.getElementById("signup").classList.remove("active");
      document.getElementById("login").classList.add("active");
    }); 

    // Gửi đăng ký
    submitSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const email = document.getElementById("signupEmail").value;
      const pass = document.getElementById("signupPassword").value;
      const confirm = document.getElementById("signupConfirm").value;

      if (pass !== confirm) return alert("Mật khẩu không khớp");

      createUserWithEmailAndPassword(this.auth, email, pass)
        .then(() => {
          alert("Đăng ký thành công! Mời đăng nhập.");
          document.getElementById("signup").classList.remove("active");
          document.getElementById("login").classList.add("active");
        })
        .catch((error) => alert("Lỗi: " + error.message));
    });
  }
}
