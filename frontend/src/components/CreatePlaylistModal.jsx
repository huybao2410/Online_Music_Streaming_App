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
          <div className="modal-drag-indicator"></div>
          <div className="modal-icon">
            🎧
          </div>
          <h2 className="modal-title">Đặt tên cho danh sách phát của bạn</h2>
        </div>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="playlist-form">
          <div className="form-group">
            <input
              id="playlist-name"
              type="text"
              placeholder="......."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="form-input-large"
              required
              maxLength={100}
              autoFocus
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel-new"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-create-new"
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Đang tạo..." : "Tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}