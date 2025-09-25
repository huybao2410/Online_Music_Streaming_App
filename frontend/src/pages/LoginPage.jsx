import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [err, setErr] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });
      if (res.data?.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        if (res.data.user?.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/home");
        }
      } else {
        setErr("Login failed: invalid response");
      }
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        (error.response?.data?.errors
          ? JSON.stringify(error.response.data.errors)
          : error.message);
      setErr(msg);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="app-logo">Music Streaming App</h1>
        <h2>Nhóm Huy Bảo</h2>
        <h2>Đăng nhập</h2>

        {err && <div className="error-msg">{err}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="password-wrapper">
            <input
              type={showPass ? "text" : "password"}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="show-pass-btn"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? "Ẩn" : "Hiện"}
            </button>
          </div>

          <button type="submit" className="login-btn">
            Đăng nhập
          </button>
        </form>

        <div className="divider"></div>
        <button className="signup-btn" onClick={() => navigate("/signup")}>
          Tạo tài khoản mới
        </button>
      </div>
    </div>
  );
}
