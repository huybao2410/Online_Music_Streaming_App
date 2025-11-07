// ArtistModal.jsx - Modal for Add/Edit Artist
import React, { useState, useRef, useEffect } from "react";
import { AiOutlineClose, AiOutlineCamera } from "react-icons/ai";
import { CgProfile } from "react-icons/cg";
import axios from "axios";
import "./ArtistModal.css";

export default function ArtistModal({ isOpen, onClose, artist, onSuccess }) {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const isEditMode = !!artist;

  useEffect(() => {
    if (artist) {
      setName(artist.name || "");
      setBio(artist.bio || "");
      setAvatarPreview(artist.avatar_url || null);
    } else {
      setName("");
      setBio("");
      setAvatarPreview(null);
      setAvatarFile(null);
    }
  }, [artist, isOpen]);

  if (!isOpen) return null;

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert("Vui lòng chọn file ảnh");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      setAvatarFile(file);
      
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
      const formData = new FormData();
      
      formData.append('name', name);
      formData.append('bio', bio);
      
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      let response;
      if (isEditMode) {
        response = await axios.put(
          `http://localhost:5000/api/artists/${artist.id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/artists',
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
      }

      if (response.data.success) {
        alert(isEditMode ? "Cập nhật nghệ sĩ thành công" : "Thêm nghệ sĩ thành công");
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Lỗi khi lưu thông tin nghệ sĩ"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="artist-modal-overlay" onClick={onClose}>
      <div className="artist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditMode ? "Chỉnh sửa nghệ sĩ" : "Thêm nghệ sĩ mới"}</h2>
          <button className="close-btn" onClick={onClose}>
            <AiOutlineClose size={24} />
          </button>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="avatar-section">
            <div 
              className="avatar-preview"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" />
              ) : (
                <div className="avatar-placeholder">
                  <CgProfile size={60} />
                </div>
              )}
              <div className="avatar-overlay">
                <AiOutlineCamera size={30} />
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
            
            <p className="avatar-hint">
              Ảnh đại diện nghệ sĩ<br />
              JPG, PNG, GIF. Tối đa 5MB
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="artist-name">
              Tên nghệ sĩ <span className="required">*</span>
            </label>
            <input
              id="artist-name"
              type="text"
              placeholder="Nhập tên nghệ sĩ"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              maxLength={100}
            />
            <span className="char-count">{name.length}/100</span>
          </div>

          <div className="form-group">
            <label htmlFor="artist-bio">Tiểu sử</label>
            <textarea
              id="artist-bio"
              placeholder="Nhập tiểu sử nghệ sĩ"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="form-textarea"
              rows={5}
              maxLength={1000}
            />
            <span className="char-count">{bio.length}/1000</span>
          </div>

          <div className="modal-actions">
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
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Đang lưu..." : (isEditMode ? "Cập nhật" : "Thêm mới")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
