// LoginDialog.jsx
import React, { useState } from "react";
import axios from "axios";
import { AiOutlineClose, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import { FaGoogle } from "react-icons/fa";
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

      // Check premium status after login
      try {
        const premiumRes = await axios.get(`http://localhost:8081/music_API/online_music/check_premium.php?user_id=${user.id || user.user_id || user.email}`);
        const isPremium = premiumRes.data?.is_premium || premiumRes.data?.premium;
        localStorage.setItem("is_premium", isPremium ? "1" : "0");
      } catch (premiumErr) {
        localStorage.setItem("is_premium", "0");
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
              placeholder="Nhập email"
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
                của mình được quy định tại{' '}
                <a href="#" className="terms-link">
                  Chính sách bảo mật
                </a>{' '}
                và{' '}
                <a href="#" className="terms-link">
                  Điều khoản sử dụng
                </a>
                , cũng như các chính sách khác do VIVORA ban hành
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
          <div className="google-btn-wrapper"> {/* Bạn nên bỏ class social-btn đi để tránh bị viền kép */}
            <GoogleLogin
              width="400"  // <--- THÊM DÒNG NÀY (Đơn vị là px, Google không nhận %)
              theme="filled_blue" // Hoặc "outline" tùy bạn chọn cho đẹp
              shape="rectangular"
              onSuccess={async (credentialResponse) => {
                try {
                  setErr(null);
                  const res = await axios.post("http://localhost:5000/api/auth/google", {
                    credential: credentialResponse.credential
                  });
                  const { token, user } = res.data;
                  if (!token || !user) {
                    setErr("Đăng nhập Google thất bại");
                    return;
                  }
                  localStorage.setItem("token", token);
                  localStorage.setItem("role", user.role);
                  localStorage.setItem("username", user.username || user.email);
                  localStorage.setItem("email", user.email);
                  if (user.avatar_url) {
                    localStorage.setItem("avatar", user.avatar_url);
                  }
                  // Check premium status after Google login
                  try {
                    const premiumRes = await axios.post("http://localhost:8081/music_API/online_music/user/check_premium.php", {
                      user_id: user.id || user.user_id || user.email
                    });
                    const isPremium = premiumRes.data?.is_premium || premiumRes.data?.premium;
                    localStorage.setItem("is_premium", isPremium ? "1" : "0");
                  } catch (premiumErr) {
                    localStorage.setItem("is_premium", "0");
                  }
                  window.dispatchEvent(new Event("storage"));
                  onSuccess?.();
                  onClose?.();
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
              render={renderProps => (
                <button
                  type="button"
                  className="social-btn google-btn"
                  style={{ width: '100%' }}
                  onClick={renderProps.onClick}
                  disabled={renderProps.disabled}
                >
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: 24, height: 24, marginRight: 8 }} />
                  Đăng nhập bằng Google
                </button>
              )}
            />
          </div>
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
