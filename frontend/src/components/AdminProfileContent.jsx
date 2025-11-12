import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaCamera, FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaSave, FaTimes } from "react-icons/fa";
import "./AdminProfileContent.css";

export default function AdminProfileContent() {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // User data
  const [profile, setProfile] = useState({
    id: null,
    username: "",
    email: "",
    phone_number: "",
    date_of_birth: "",
    avatar_url: "",
    role: "",
    status: ""
  });

  // Edit form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone_number: "",
    date_of_birth: ""
  });

  // Avatar upload
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [avatarFileName, setAvatarFileName] = useState("");

  // Fetch profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      if (!token) {
        setError("Vui lòng đăng nhập lại");
        return;
      }

      const response = await axios.get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.user) {
        const userData = response.data.user;
        setProfile(userData);
        setFormData({
          username: userData.username || "",
          email: userData.email || "",
          phone_number: userData.phone_number || "",
          date_of_birth: userData.date_of_birth ? userData.date_of_birth.split("T")[0] : ""
        });
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err.response?.data?.message || "Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      setSelectedAvatar(file);
      setAvatarFileName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setAvatarFileName("");
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem("token");
      const formDataToSend = new FormData();

      // Add text fields
      formDataToSend.append("username", formData.username);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone_number", formData.phone_number);
      formDataToSend.append("date_of_birth", formData.date_of_birth);

      // Add avatar if selected
      if (selectedAvatar) {
        formDataToSend.append("avatar", selectedAvatar);
      }

      const response = await axios.put(
        "http://localhost:5000/api/users/profile",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      if (response.data.success) {
        setSuccess("Cập nhật hồ sơ thành công!");
        setProfile(response.data.user);
        setIsEditing(false);
        setSelectedAvatar(null);
        setAvatarPreview(null);

        // Update localStorage
        localStorage.setItem("username", response.data.user.username);
        window.dispatchEvent(new Event("storage"));

        // Auto hide success after 3s
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      username: profile.username || "",
      email: profile.email || "",
      phone_number: profile.phone_number || "",
      date_of_birth: profile.date_of_birth ? profile.date_of_birth.split("T")[0] : ""
    });
    setSelectedAvatar(null);
    setAvatarPreview(null);
    setAvatarFileName("");
    setError(null);
  };

  if (loading) {
    return (
      <div className="admin-profile-content">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-content">
      <div className="profile-content-header">
        <h2>Hồ Sơ Quản Trị Viên</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-card">
        {/* Avatar Section */}
        <div className="profile-avatar-section">
          <div className="avatar-wrapper-profile">
            <img
              src={avatarPreview || profile.avatar_url || "https://via.placeholder.com/150"}
              alt="Avatar"
              className="profile-avatar-img"
            />
            {isEditing && (
              <label className="avatar-upload-label" title="Đổi ảnh đại diện">
                <FaCamera size={18} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
            )}
            {isEditing && selectedAvatar && (
              <div className="avatar-selected">
                <span className="file-name">{avatarFileName}</span>
                <button 
                  type="button"
                  className="remove-avatar-btn" 
                  onClick={handleRemoveAvatar}
                  title="Xóa ảnh đã chọn"
                >
                  <FaTimes size={12} />
                </button>
              </div>
            )}
          </div>
          <div className="avatar-info-profile">
            <h3>{profile.username || "Chưa có tên"}</h3>
            <div className="badges-group">
              <span className="role-badge-profile admin">
                {profile.role === "admin" ? "Quản trị viên" : "Người dùng"}
              </span>
              <span className={`status-badge-profile ${profile.status}`}>
                {profile.status === "active" ? "Hoạt động" : profile.status}
              </span>
            </div>
            {isEditing && (
              <p className="edit-hint">Chỉnh sửa thông tin và nhấn Lưu</p>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="profile-info-section">
          <div className="section-header-profile">
            <h3>Thông tin cá nhân</h3>
            {!isEditing ? (
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </button>
            ) : (
              <div className="action-buttons-profile">
                <button
                  className="save-profile-btn"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  <FaSave /> {saving ? "Đang lưu..." : "Lưu"}
                </button>
                <button className="cancel-profile-btn" onClick={handleCancel}>
                  <FaTimes /> Hủy
                </button>
              </div>
            )}
          </div>

          <div className="info-grid-profile">
            {/* Username */}
            <div className="info-item-profile">
              <label>
                <FaUser /> Tên người dùng
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Nhập tên người dùng"
                />
              ) : (
                <p>{profile.username || "Chưa cập nhật"}</p>
              )}
            </div>

            {/* Email */}
            <div className="info-item-profile">
              <label>
                <FaEnvelope /> Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Nhập email"
                />
              ) : (
                <p>{profile.email || "Chưa cập nhật"}</p>
              )}
            </div>

            {/* Phone */}
            <div className="info-item-profile">
              <label>
                <FaPhone /> Số điện thoại
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleInputChange}
                  placeholder="Nhập số điện thoại"
                />
              ) : (
                <p>{profile.phone_number || "Chưa cập nhật"}</p>
              )}
            </div>

            {/* Birthday */}
            <div className="info-item-profile">
              <label>
                <FaBirthdayCake /> Ngày sinh
              </label>
              {isEditing ? (
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                />
              ) : (
                <p>
                  {profile.date_of_birth
                    ? new Date(profile.date_of_birth).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
