class Auth {
  login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user === "admin" && pass === "1234") {
      alert("Đăng nhập thành công!");
      app.showTab('dashboard');
    } else {
      alert("Sai tài khoản hoặc mật khẩu.");
    }
  }
}

const auth = new Auth();
