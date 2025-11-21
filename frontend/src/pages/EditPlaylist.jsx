// EditPlaylist.jsx
import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AiOutlineClose, AiOutlineCamera } from "react-icons/ai";
import { RiPlayListLine } from "react-icons/ri";
import axios from "axios";
import "./EditPlaylist.css";

export default function EditPlaylist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [name, setName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlaylist();
  }, [id]);

  const fetchPlaylist = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/playlists/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const playlist = response.data.playlist;
        setName(playlist.name);
        setIsPublic(playlist.is_public === 1);
        
        // Set cover image URL (handle both full URLs and relative paths)
        if (playlist.cover_url) {
          const coverUrl = playlist.cover_url.startsWith('http') 
            ? playlist.cover_url 
            : `http://localhost:5000${playlist.cover_url}`;
          setCoverPreview(coverUrl);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (e) => {
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

      setCoverImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      
      formData.append('name', name);
      formData.append('is_public', isPublic ? '1' : '0');
      
      if (coverImage) {
        formData.append('cover_image', coverImage);
      }

      const response = await axios.put(
        `http://localhost:5000/api/playlists/${id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert("Cập nhật playlist thành công");
        navigate(`/playlist/${id}`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Lỗi khi cập nhật playlist"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="edit-playlist-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="edit-playlist-page">
      <div className="edit-playlist-container">
        <div className="edit-header">
          <button 
            className="back-btn"
            onClick={() => navigate(`/playlist/${id}`)}
          >
            <AiOutlineClose size={24} />
          </button>
          <h2>Chỉnh sửa chi tiết</h2>
        </div>

        {error && <div className="edit-error">{error}</div>}

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="cover-upload-section">
            <div 
              className="cover-preview"
              onClick={() => fileInputRef.current?.click()}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="Cover preview" />
              ) : (
                <div className="cover-placeholder">
                  <RiPlayListLine size={80} />
                </div>
              )}
              <div className="cover-overlay">
                <AiOutlineCamera size={40} />
                <span>Chọn ảnh</span>
              </div>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            
            <p className="cover-hint">
              Ảnh JPG, PNG. Tối đa 5MB.<br />
              Khuyến nghị 1000x1000px
            </p>
          </div>

          <div className="form-fields">
            <div className="form-group">
              <label htmlFor="playlist-name">
                Tên <span className="required">*</span>
              </label>
              <input
                id="playlist-name"
                type="text"
                placeholder="Tên playlist"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
                maxLength={100}
              />
              <span className="char-count">{name.length}/100</span>
            </div>

            <div className="form-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <span className="checkbox-label">
                  Công khai (mọi người có thể xem)
                </span>
              </label>
            </div>
          </div>

          <div className="edit-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate(`/playlist/${id}`)}
              disabled={isSaving}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-save"
              disabled={isSaving || !name.trim()}
            >
              {isSaving ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
