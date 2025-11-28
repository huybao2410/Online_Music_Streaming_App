import React, { useState } from "react";
import axios from "axios";
import { AiOutlineClose, AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
// Đã xóa import FcGoogle và useGoogleLogin vì không dùng nữa
import "./SignupDialog.css";

export default function SignupDialog({ onClose }) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [err, setErr] = useState(null);

  // Đã xóa hàm signupGoogle

  const handleSignup = async (e) => {
    e.preventDefault();
    setErr(null);

    if (!agreedToTerms) {
      setErr("Vui lòng đồng ý với điều khoản và chính sách");
      return;
    }

    if (password !== confirmPassword) {
      setErr("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setErr("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    try {
      await axios.post("http://localhost:5000/api/auth/register", {
        phone_number: phone, 
        email: email,
        password,
      });

      alert("🎉 Đăng ký thành công! Vui lòng đăng nhập.");
      
      onClose();
      window.dispatchEvent(new CustomEvent('openLogin'));
      
    } catch (error) {
      console.error(error);
      setErr(error.response?.data?.message || "Đăng ký thất bại");
    }
  };

  return (
    <div className="signup-overlay" onClick={onClose}>
      <div className="signup-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="signup-close-btn" onClick={onClose}>
          <AiOutlineClose size={24} />
        </button>

        <h2 className="signup-title">Đăng ký tài khoản</h2>

        {err && <div className="signup-error">{err}</div>}

        <form onSubmit={handleSignup} className="signup-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="signup-input"
              required
            />
          </div>

          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="signup-input"
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

          <div className="input-group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Nhập lại mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="signup-input"
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <AiOutlineEyeInvisible size={20} />
              ) : (
                <AiOutlineEye size={20} />
              )}
            </button>
          </div>

          <div className="terms-checkbox">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
              />
              <span>
                Tôi đã đọc, hiểu rõ, đồng ý hoàn toàn và tự nguyện với các
                điều khoản liên quan đến việc thu thập, xử lý dữ liệu cá
                nhân, quyền và nghĩa vụ của mình được quy định tại{' '}
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

          <button type="submit" className="signup-submit-btn" disabled={!agreedToTerms}>
            Đăng ký
          </button>
        </form>

        {/* Đã xóa phần divider và nút Google ở đây */}

        <div className="login-link">
          <span>Đã có tài khoản? </span>
          <button onClick={() => {
            onClose();
            window.dispatchEvent(new CustomEvent('openLogin'));
          }}>
            Đăng nhập ngay
          </button>
        </div>
      </div>
    </div>
  );
}