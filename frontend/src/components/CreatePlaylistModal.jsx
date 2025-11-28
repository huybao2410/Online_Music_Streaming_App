import React, { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import axios from "axios";
import "./CreatePlaylistModal.css";

export default function CreatePlaylistModal({ isOpen, onClose, onSuccess }) {
  const [name, setName] = useState("");
  // Mặc định là công khai (true) giống trong ảnh
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

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
          name: name.trim(),
          is_public: isPublic // Gửi giá trị public/private lên server
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        window.dispatchEvent(new Event("playlistUpdated"));
        setName("");
        setIsPublic(true); // Reset về mặc định
        
        if (onSuccess) onSuccess(response.data.playlist);
        onClose();
      }
    } catch (err) {
      console.error("Error creating playlist:", err);
      setError(err.response?.data?.message || "Lỗi khi tạo playlist");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="nct-modal-overlay" onClick={onClose}>
      <div className="nct-modal" onClick={(e) => e.stopPropagation()}>
        <button className="nct-close-btn" onClick={onClose}>
          <AiOutlineClose size={20} />
        </button>

        <h3 className="nct-modal-title">Tạo playlist mới</h3>

        {error && <div className="nct-error">{error}</div>}

        <form onSubmit={handleSubmit} className="nct-form">
          <div className="nct-input-wrapper">
            <input
              type="text"
              className="nct-input"
              placeholder="Nhập tên playlist"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              autoFocus
            />
            <span className="nct-char-count">{name.length}/100</span>
          </div>

          <div className="nct-radio-group">
            <label 
              className="nct-radio-label" 
              onClick={() => setIsPublic(true)}
            >
              <div className={`nct-radio-circle ${isPublic ? 'active' : ''}`}></div>
              <span>Công khai</span>
            </label>

            <label 
              className="nct-radio-label" 
              onClick={() => setIsPublic(false)}
            >
              <div className={`nct-radio-circle ${!isPublic ? 'active' : ''}`}></div>
              <span>Riêng tư</span>
            </label>
          </div>

          <div className="nct-modal-footer">
            <button 
              type="button" 
              className="nct-btn nct-btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              className="nct-btn nct-btn-save"
              disabled={!name.trim() || isLoading}
            >
              {isLoading ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}