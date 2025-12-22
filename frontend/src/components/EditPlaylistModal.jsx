import React, { useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import "./EditPlaylistModal.css";

export default function EditPlaylistModal({ isOpen, onClose, playlist, onSave }) {
  const [name, setName] = useState(playlist?.name || "");
  const [isPublic, setIsPublic] = useState(playlist?.is_public ?? true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setIsLoading(true);
    try {
      // Gọi API cập nhật playlist ở đây
      await onSave({ name: name.trim(), is_public: isPublic });
      window.dispatchEvent(new Event("playlistUpdated"));
      onClose();
    } catch (err) {
      setError(err.message || "Lỗi khi cập nhật playlist");
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    setName(playlist?.name || "");
    setIsPublic(playlist?.is_public ?? true);
  }, [playlist]);

  if (!isOpen) return null;

  return (
    <div className="nct-modal-overlay" onClick={onClose}>
      <div className="nct-modal" onClick={(e) => e.stopPropagation()}>
        <button className="nct-close-btn" onClick={onClose}>
          <AiOutlineClose size={20} />
        </button>
        <h3 className="edit-modal-title">Chỉnh sửa playlist</h3>
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
            <label className="nct-radio-label" onClick={() => setIsPublic(true)}>
              <div className={`nct-radio-circle ${isPublic ? "active" : ""}`}></div>
              <span>Công khai</span>
            </label>
            <label className="nct-radio-label" onClick={() => setIsPublic(false)}>
              <div className={`nct-radio-circle ${!isPublic ? "active" : ""}`}></div>
              <span>Riêng tư</span>
            </label>
          </div>
          <div className="edit-modal-footer">
            <button
              type="button"
              className="edit-btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="edit-btn-save"
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
