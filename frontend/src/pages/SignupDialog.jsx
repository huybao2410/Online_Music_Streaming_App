// SignupDialog.jsx
import React, { useState } from "react";
import axios from "axios";
import "./SignupDialog.css"; // style riêng cho dialog

export default function SignupDialog({ onClose }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr(null);

    try {
      const res = await axios.post("http://localhost:5000/api/auth/register", {
        phone_number: phone,
        password,
      });

      alert("Đăng ký thành công!");
      onClose?.();
      setPhone("");
      setPassword("");
    } catch (error) {
      console.error(error);
      setErr(error.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog-box">
        <button className="dialog-close" onClick={onClose}>×</button>
        <h2>Tạo tài khoản mới 🎵</h2>
        {err && <div className="error-msg">{err}</div>}
        <form onSubmit={handleSignup}>
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
          <button type="submit">Đăng ký</button>
        </form>
        <p className="signup-footer">
          Đã có tài khoản? <span onClick={onClose} style={{color:'blue', cursor:'pointer'}}>Đăng nhập ngay</span>
        </p>
      </div>
    </div>
  );
}
