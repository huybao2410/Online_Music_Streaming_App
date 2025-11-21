// EditProfileModal.jsx
import React, { useState, useRef } from "react";
import { AiOutlineClose, AiOutlineCamera } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import axios from "axios";
import "./EditProfileModal.css";

export default function EditProfileModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [username, setUsername] = useState(currentUser?.username || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [phone, setPhone] = useState(currentUser?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [isGoogleAccount, setIsGoogleAccount] = useState(false);
  const fileInputRef = useRef(null);

  // Check if it's a Google account (users with GOOGLE_OAUTH in their account setup)
  React.useEffect(() => {
    if (currentUser) {
      // Check if avatar_url contains googleusercontent (Google profile picture)
      // OR username but no password was set locally (indicates OAuth account)
      const hasGoogleAvatar = currentUser.avatar_url?.includes('googleusercontent.com');
      const hasGoogleUsername = currentUser.username && currentUser.email?.includes('@gmail.com');
      
      // If both conditions met, likely a Google account
      setIsGoogleAccount(hasGoogleAvatar || (hasGoogleUsername && currentUser.username !== null));
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert("Vui lòng chọn file ảnh");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      let avatarUrl = currentUser?.avatar;

      // Upload avatar if changed
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const avatarResponse = await axios.post(
          'http://localhost:5000/api/users/avatar',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        if (avatarResponse.data.success) {
          avatarUrl = avatarResponse.data.avatar_url;
        }
      }

      // Prepare update data
      const updateData = {};
      if (username !== currentUser?.username) {
        updateData.username = username;
      }
      if (email !== currentUser?.email) {
        updateData.email = email;
      }
      if (phone !== currentUser?.phone) {
        updateData.phone = phone;
      }

      // Update profile info if any field changed
      if (Object.keys(updateData).length > 0) {
        const response = await axios.put(
          'http://localhost:5000/api/users/profile',
          updateData,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          // Update localStorage
          if (updateData.username) {
            localStorage.setItem('username', username);
            window.dispatchEvent(new Event("storage"));
          }
        }
      }

      // Update password if provided
      if (showPasswordSection && newPassword) {
        if (newPassword !== confirmPassword) {
          setError("Mật khẩu xác nhận không khớp");
          setIsLoading(false);
          return;
        }

        if (newPassword.length < 6) {
          setError("Mật khẩu mới phải có ít nhất 6 ký tự");
          setIsLoading(false);
          return;
        }

        await axios.put(
          'http://localhost:5000/api/users/change-password',
          {
            currentPassword,
            newPassword
          },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
      }

      alert("Cập nhật thông tin thành công");
      onSuccess({ username, email, phone, avatar: avatarUrl });
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Lỗi khi cập nhật thông tin"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm("Bạn có chắc muốn xóa ảnh đại diện?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        'http://localhost:5000/api/users/avatar',
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAvatarPreview(null);
        setAvatarFile(null);
        alert("Xóa ảnh đại diện thành công");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa ảnh đại diện");
    }
  };

  return (
    <div className="edit-profile-overlay" onClick={onClose}>
      <div className="edit-profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edit-profile-header">
          <h2>Chỉnh sửa hồ sơ</h2>
          <button className="close-btn" onClick={onClose}>
            <AiOutlineClose size={24} />
          </button>
        </div>

        {error && <div className="edit-error">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-profile-form">
          {/* Avatar Section */}
          <div className="avatar-section">
            <div 
              className="avatar-preview-large"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  <CgProfile size={80} />
                </div>
              )}
              <div className="avatar-overlay">
                <AiOutlineCamera size={40} />
                <span>Chọn ảnh</span>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />

            <div className="avatar-actions">
              <button
                type="button"
                className="btn-change-avatar"
                onClick={() => fileInputRef.current?.click()}
              >
                Thay đổi ảnh
              </button>
              {avatarPreview && (
                <button
                  type="button"
                  className="btn-delete-avatar"
                  onClick={handleDeleteAvatar}
                >
                  Xóa ảnh
                </button>
              )}
            </div>

            <p className="avatar-hint">
              Ảnh JPG, PNG, GIF. Tối đa 5MB.<br />
              Khuyến nghị 300x300px
            </p>
          </div>

          {/* Username Section */}
          <div className="form-group">
            <label htmlFor="username">
              Tên hiển thị <span className="required">*</span>
            </label>
            <input
              id="username"
              type="text"
              placeholder="Nhập tên hiển thị"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-input"
              required
              minLength={3}
              maxLength={50}
            />
            <span className="char-count">{username.length}/50</span>
          </div>

          {/* Email Section */}
          <div className="form-group">
            <label htmlFor="email">
              Email
              {isGoogleAccount && <span style={{fontSize: '12px', color: '#fbbf24', marginLeft: '8px'}}>(Tài khoản Google)</span>}
            </label>
            <input
              id="email"
              type="email"
              placeholder={isGoogleAccount ? "Email không thể thay đổi (Tài khoản Google)" : "Nhập địa chỉ email"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              disabled={isGoogleAccount}
              style={isGoogleAccount ? {cursor: 'not-allowed', opacity: 0.6} : {}}
            />
            {isGoogleAccount && (
              <span className="field-hint" style={{color: '#fbbf24'}}>
                ⚠️ Tài khoản Google không thể thay đổi email
              </span>
            )}
          </div>

          {/* Phone Section */}
          <div className="form-group">
            <label htmlFor="phone">
              Số điện thoại
            </label>
            <input
              id="phone"
              type="tel"
              placeholder="Nhập số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="form-input"
              pattern="[0-9]{10,11}"
            />
            <span className="field-hint">Định dạng: 10-11 chữ số</span>
          </div>

          {/* Password Change Section */}
          {!isGoogleAccount && (
            <div className="password-section">
              <button
                type="button"
                className="btn-toggle-password"
                onClick={() => setShowPasswordSection(!showPasswordSection)}
              >
                {showPasswordSection ? "− Ẩn đổi mật khẩu" : "+ Đổi mật khẩu"}
              </button>

            {showPasswordSection && (
              <div className="password-fields">
                <div className="form-group">
                  <label htmlFor="currentPassword">
                    Mật khẩu hiện tại <span className="required">*</span>
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    placeholder="Nhập mật khẩu hiện tại"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="form-input"
                    required={showPasswordSection}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">
                    Mật khẩu mới <span className="required">*</span>
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="form-input"
                    required={showPasswordSection}
                    minLength={6}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">
                    Xác nhận mật khẩu mới <span className="required">*</span>
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    required={showPasswordSection}
                  />
                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <span className="field-error">Mật khẩu không khớp</span>
                  )}
                </div>
              </div>
            )}
            </div>
          )}

          {isGoogleAccount && (
            <div className="google-account-notice">
              <span style={{color: '#fbbf24', fontSize: '14px'}}>
                ℹ️ Tài khoản Google không thể đổi mật khẩu. Vui lòng quản lý mật khẩu qua Google Account.
              </span>
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={isLoading || !username.trim()}
            >
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
