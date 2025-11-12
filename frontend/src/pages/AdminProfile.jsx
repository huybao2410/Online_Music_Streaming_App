import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaCamera, FaUser, FaEnvelope, FaPhone, FaBirthdayCake, FaSave, FaTimes } from "react-icons/fa";
import "./AdminProfile.css";

export default function AdminProfile() {
  const navigate = useNavigate();
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
        navigate("/login");
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
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

        // Reload after 1.5s
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
    setError(null);
  };

  if (loading) {
    return (
      <div className="admin-profile-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-profile-container">
      <div className="profile-header">
        <h1>Hồ Sơ Admin</h1>
        <button className="back-btn" onClick={() => navigate("/admin")}>
          ← Quay lại Dashboard
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="profile-content">
        {/* Avatar Section */}
        <div className="avatar-section">
          <div className="avatar-wrapper">
            <img
              src={avatarPreview || profile.avatar_url || "https://via.placeholder.com/150"}
              alt="Avatar"
              className="profile-avatar"
            />
            {isEditing && (
              <label className="avatar-upload-btn">
                <FaCamera size={20} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </label>
            )}
          </div>
          <div className="avatar-info">
            <h2>{profile.username || "Chưa có tên"}</h2>
            <span className="role-badge admin-badge">
              {profile.role === "admin" ? "Quản trị viên" : "Người dùng"}
            </span>
            <span className={`status-badge ${profile.status}`}>
              {profile.status === "active" ? "Hoạt động" : profile.status}
            </span>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <div className="section-header">
            <h3>Thông tin cá nhân</h3>
            {!isEditing ? (
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </button>
            ) : (
              <div className="action-buttons">
                <button
                  className="save-btn"
                  onClick={handleSaveProfile}
                  disabled={saving}
                >
                  <FaSave /> {saving ? "Đang lưu..." : "Lưu"}
                </button>
                <button className="cancel-btn" onClick={handleCancel}>
                  <FaTimes /> Hủy
                </button>
              </div>
            )}
          </div>

          <div className="info-grid">
            {/* Username */}
            <div className="info-item">
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
            <div className="info-item">
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
            <div className="info-item">
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
            <div className="info-item">
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
