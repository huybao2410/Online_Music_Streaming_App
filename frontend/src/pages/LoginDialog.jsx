// LoginDialog.jsx
import React, { useState } from "react";
import axios from "axios";
import { AiOutlineClose, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaFacebookF, FaGoogle, FaPhone, FaQrcode } from "react-icons/fa";
import "./LoginDialog.css";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function LoginDialog({ onClose, onSuccess }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [err, setErr] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!agreedToTerms) {
      setErr("Vui lòng đồng ý với điều khoản và chính sách");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        identifier: identifier,
        password,
      });

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        setErr(res.data?.message || "Đăng nhập thất bại");
        return;
      }

      // Lưu thông tin
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);
      localStorage.setItem("username", user.username || "User");

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
      }

      // Phát sự kiện để Header & Sidebar biết
      window.dispatchEvent(new Event("storage"));

      // Gọi callback (nếu có)
      onSuccess?.();
      onClose?.();

      // Redirect dựa trên role
      if (user.role === 'admin') {
        window.location.href = '/admin';
      } else {
        window.location.href = '/home';
      }
    } catch (error) {
      setErr(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  return (
    <div className="login-overlay" onClick={onClose}>
      <div className="login-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="login-close-btn" onClick={onClose}>
          <AiOutlineClose size={24} />
        </button>

        <h2 className="login-title">Đăng nhập</h2>

        {err && <div className="login-error">{err}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Nhập email hoặc số điện thoại"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="login-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </button>
          </div>

          <div className="login-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Ghi nhớ đăng nhập</span>
            </label>
            <a href="#" className="forgot-password">
              Quên mật khẩu?
            </a>
          </div>

          <div className="terms-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span>
                Tôi đã đọc, hiểu rõ, đồng ý hoàn toàn và tự nguyện với các điều khoản
                liên quan đến việc thu thập, xử lý dữ liệu cá nhân, quyền và nghĩa vụ
                của mình được quy định tại{" "}
                <a href="#" className="terms-link">
                  Chính sách bảo mật
                </a>{" "}
                và{" "}
                <a href="#" className="terms-link">
                  Điều khoản sử dụng
                </a>
                , cũng như các chính sách khác do NCT ban hành
              </span>
            </label>
          </div>

          <button type="submit" className="login-submit-btn" disabled={!agreedToTerms}>
            Đăng nhập
          </button>
        </form>

        <div className="login-divider">
          <span>Hoặc đăng nhập bằng</span>
        </div>

        <div className="social-login-buttons">
          <button className="social-btn facebook-btn">
            <FaFacebookF size={18} />
            <span>Facebook</span>
          </button>
          <div className="social-btn google-btn" style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  setErr(null);
                  
                  // Gửi credential đến backend để verify và lưu user
                  const res = await axios.post("http://localhost:5000/api/auth/google", {
                    credential: credentialResponse.credential
                  });

                  const { token, user } = res.data;

                  if (!token || !user) {
                    setErr("Đăng nhập Google thất bại");
                    return;
                  }

                  // Lưu thông tin
                  localStorage.setItem("token", token);
                  localStorage.setItem("role", user.role);
                  localStorage.setItem("username", user.username || user.email);
                  localStorage.setItem("email", user.email);
                  if (user.avatar_url) {
                    localStorage.setItem("avatar", user.avatar_url);
                  }

                  // Phát sự kiện
                  window.dispatchEvent(new Event("storage"));

                  // Đóng dialog
                  onSuccess?.();
                  onClose?.();

                  // Redirect dựa trên role
                  if (user.role === 'admin') {
                    window.location.href = '/admin';
                  } else {
                    window.location.href = '/home';
                  }

                  console.log("✅ Đăng nhập Google thành công:", user);
                } catch (error) {
                  console.error("❌ Google login error:", error);
                  setErr(error.response?.data?.message || "Đăng nhập Google thất bại");
                }
              }}
              onError={() => {
                console.log("Đăng nhập Google thất bại");
                setErr("Đăng nhập Google thất bại");
              }}
              useOneTap
            />
          </div>
        </div>

        <div className="social-login-buttons">
          <button className="social-btn phone-btn">
            <FaPhone size={16} />
            <span>Số điện thoại</span>
          </button>
          <button className="social-btn qr-btn">
            <FaQrcode size={18} />
            <span>Mã QR</span>
          </button>
        </div>

        <div className="signup-link">
          <span>Bạn chưa có tài khoản? </span>
          <button onClick={() => {
            onClose();
            // Trigger signup dialog - will be handled by parent
            window.dispatchEvent(new CustomEvent('openSignup'));
          }}>
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
}
