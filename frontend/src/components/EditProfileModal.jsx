// EditProfileModal.jsx
import React, { useState, useRef } from "react";
import { AiOutlineClose, AiOutlineCamera } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import axios from "axios";
import "./EditProfileModal.css";

export default function EditProfileModal({ isOpen, onClose, currentUser, onSuccess }) {
  const [username, setUsername] = useState(currentUser?.username || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatar || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

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

      // Update username if changed
      if (username !== currentUser?.username) {
        const response = await axios.put(
          'http://localhost:5000/api/users/profile',
          { username },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (response.data.success) {
          // Update localStorage
          localStorage.setItem('username', username);
          window.dispatchEvent(new Event("storage"));
        }
      }

      alert("Cập nhật thông tin thành công");
      onSuccess({ username, avatar: avatarUrl });
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
