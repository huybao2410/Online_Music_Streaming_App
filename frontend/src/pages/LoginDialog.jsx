// LoginDialog.jsx
import React, { useState } from "react";
import axios from "axios";

export default function LoginDialog({ onClose, onSuccess }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        phone_number: phone,
        password,
      });

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        setErr(res.data?.message || "Đăng nhập thất bại");
        return;
      }

      // ✅ Lưu thông tin
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("username", user.username || "User");

      alert("🎉 Đăng nhập thành công!");

      // ✅ Phát sự kiện để Header & Sidebar biết
      window.dispatchEvent(new Event("storage"));

      // Gọi callback (nếu có)
      onSuccess?.();
      onClose?.();
    } catch (error) {
      setErr(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <button className="dialog-close" onClick={onClose}>×</button>
        <h2>Đăng nhập</h2>
        {err && <div className="error-msg">{err}</div>}
        <form onSubmit={handleLogin}>
          <input
            type="tel"
            placeholder="Số điện thoại"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Đăng nhập</button>
        </form>
      </div>
    </div>
  );
}
