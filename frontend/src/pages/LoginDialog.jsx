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

  // ⚙️ Đăng nhập thường
  const handleLogin = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!agreedToTerms) {
      setErr("Vui lòng đồng ý với điều khoản và chính sách");
      return;
    }

    try {
      const res = await axios.post("http://localhost:5000/api/auth/login", {
        identifier,
        password,
      });

      const token = res.data?.token;
      const user = res.data?.user;

      if (!token || !user) {
        setErr(res.data?.message || "Đăng nhập thất bại");
        return;
      }

      // ✅ Lưu thông tin user vào localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("user_id", user.id);
      localStorage.setItem("role", user.role);
      localStorage.setItem("username", user.username || "User");
      localStorage.setItem("isPremium", user.is_premium ? "true" : "false");
      localStorage.setItem("premiumExpire", user.premium_expire || "");

      if (rememberMe) localStorage.setItem("rememberMe", "true");

      window.dispatchEvent(new Event("storage"));
      onSuccess?.();
      onClose?.();

      if (user.role === "admin") window.location.href = "/admin";
    } catch (error) {
      setErr(error.response?.data?.message || "Đăng nhập thất bại");
    }
  };

  // ⚙️ Đăng nhập Google
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      console.log("✅ Google user:", decoded);

      // Gửi dữ liệu tới backend PHP
      const res = await axios.post(
        "http://localhost:8081/music_API/user/google_login.php",
        {
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
        }
      );

      if (res.data.status) {
        const user = res.data.user;

        // ✅ Lưu vào localStorage
        localStorage.setItem("token", credentialResponse.credential);
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("username", user.username || decoded.name);
        localStorage.setItem("email", user.email);
        localStorage.setItem("picture", user.avatar_url || decoded.picture);
        localStorage.setItem("isPremium", user.is_premium == 1 ? "true" : "false");
        localStorage.setItem("premiumExpire", user.premium_expire || "");

        // Gửi sự kiện toàn cục để Header/Sidebar cập nhật
        window.dispatchEvent(new Event("storage"));

        alert("🎉 Đăng nhập Google thành công!");
        onSuccess?.();
        onClose?.();
      } else {
        alert("Đăng nhập thất bại: " + res.data.message);
      }
    } catch (error) {
      console.error("❌ Lỗi đăng nhập Google:", error);
      alert("Không thể kết nối đến máy chủ Google hoặc API PHP.");
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
                Tôi đồng ý với{" "}
                <a href="#" className="terms-link">
                  Chính sách bảo mật
                </a>{" "}
                và{" "}
                <a href="#" className="terms-link">
                  Điều khoản sử dụng
                </a>.
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
          <div
            className="social-btn google-btn"
            style={{ display: "flex", justifyContent: "center" }}
          >
            <GoogleLogin
  onSuccess={async (credentialResponse) => {
    try {
      const data = jwtDecode(credentialResponse.credential);
      console.log("Google user:", data);

      // Gửi dữ liệu lên PHP backend
      const res = await axios.post("http://localhost:8081/music_API/online_music/user/google_login.php", {
        email: data.email,
        name: data.name,
        picture: data.picture,
      });

      if (res.data.status) {
        const user = res.data.user;

        // Lưu thông tin đăng nhập
        localStorage.setItem("token", credentialResponse.credential);
        localStorage.setItem("user_id", user.id);
        localStorage.setItem("username", user.username);
        localStorage.setItem("email", user.email);
        localStorage.setItem("role", user.role);
        localStorage.setItem("is_premium", user.is_premium);

        alert("🎉 " + res.data.message);
        window.dispatchEvent(new Event("storage"));
        onSuccess?.();
        onClose?.();
      } else {
        alert("❌ " + res.data.message);
      }
    } catch (error) {
      console.error("❌ Lỗi đăng nhập Google:", error);
      alert("Không thể kết nối đến máy chủ Google hoặc API PHP.");
    }
  }}
  onError={() => alert("❌ Đăng nhập Google thất bại!")}
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
          <button
            onClick={() => {
              onClose();
              window.dispatchEvent(new CustomEvent("openSignup"));
            }}
          >
            Đăng ký ngay
          </button>
        </div>
      </div>
    </div>
  );
}
