import React, { useState } from "react";
import "./SignUpPage.css";
import { useNavigate } from "react-router-dom";

function SignUpPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Đăng ký với:", formData);
    // 🚀 TODO: Gửi API đăng ký ở đây
    navigate("/login"); // sau khi đăng ký xong thì quay về login
  };

  return (
    <div className="signup-wrapper">
      {/* Cột trái */}
      <div className="signup-left">
        <div className="signup-box">
          <h2 className="signup-title">Tạo tài khoản mới 🎵</h2>
          <form className="signup-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Tên người dùng"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Địa chỉ email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Mật khẩu"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit">Đăng ký</button>
          </form>
          <p className="signup-footer">
            Đã có tài khoản?{" "}
            <a href="/login">Đăng nhập ngay</a>
          </p>
        </div>
      </div>

      {/* Cột phải */}
      <div className="signup-right">
        Âm nhạc là người bạn đồng hành 🎶
      </div>
    </div>
  );
}

export default SignUpPage;
