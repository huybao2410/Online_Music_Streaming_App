// CreatePlaylistModal.jsx
import React, { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { RiPlayListLine } from "react-icons/ri";
import axios from "axios";
import "./CreatePlaylistModal.css";

export default function CreatePlaylistModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn cần đăng nhập để tạo playlist");
        setIsLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:5000/api/playlists",
        {
          name,
          description,
          is_public: isPublic
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Reset form
        setName("");
        setDescription("");
        setIsPublic(false);
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.playlist);
        }

        // Close modal
        onClose();
      }
    } catch (err) {
      console.error("Error creating playlist:", err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.[0]?.msg ||
        "Lỗi khi tạo playlist"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="create-playlist-overlay" onClick={onClose}>
      <div className="create-playlist-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <AiOutlineClose size={24} />
        </button>

        <div className="modal-header">
          <div className="modal-icon">
            <RiPlayListLine size={40} />
          </div>
          <h2 className="modal-title">Tạo playlist mới</h2>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="playlist-form">
          <div className="form-group">
            <label htmlFor="playlist-name">
              Tên playlist <span className="required">*</span>
            </label>
            <input
              id="playlist-name"
              type="text"
              placeholder="Nhập tên playlist của bạn"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input"
              required
              maxLength={100}
              autoFocus
            />
            <span className="char-count">{name.length}/100</span>
          </div>

          <div className="form-group">
            <label htmlFor="playlist-description">Mô tả (tùy chọn)</label>
            <textarea
              id="playlist-description"
              placeholder="Mô tả về playlist của bạn..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="form-textarea"
              rows={4}
              maxLength={500}
            />
            <span className="char-count">{description.length}/500</span>
          </div>

          <div className="form-group">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
              />
              <span className="checkbox-label">
                Công khai playlist (mọi người có thể xem)
              </span>
            </label>
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
              className="btn-create"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Đang tạo..." : "Tạo playlist"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
