import React, { useState, useEffect } from "react";
import axios from "axios";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import { RiPlayListLine } from "react-icons/ri";
import "./AddToPlaylistModal.css";

const API_URL = "http://localhost:5000/api";

export default function AddToPlaylistModal({ isOpen, onClose, songId, onCreateNew }) {
  const [playlists, setPlaylists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedStatus, setAddedStatus] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/playlists/my-playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setPlaylists(res.data.playlists);
      }
    } catch (error) {
      console.error("Lỗi tải playlist:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async (playlistId) => {
    if (!songId) {
      alert("Lỗi: Không tìm thấy ID bài hát!");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/playlists/${playlistId}/songs`,
        { song_id: songId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAddedStatus((prev) => ({ ...prev, [playlistId]: true }));
    } catch (error) {
      console.error("Lỗi thêm bài hát:", error);
      // Hiển thị lỗi chi tiết nếu có
      const msg = error.response?.data?.message || 
                  (error.response?.data?.errors ? error.response.data.errors[0].msg : "Không thể thêm bài hát");
      alert(msg);
    }
  };

  const handleCreateNew = () => {
    onClose();
    if (onCreateNew && typeof onCreateNew === 'function') {
      onCreateNew();
    } else {
      console.error("Chưa truyền hàm onCreateNew cho Modal");
    }
  };

  const filteredPlaylists = playlists.filter((pl) =>
    pl.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="add-playlist-overlay" onClick={onClose}>
      <div className="add-playlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="apm-header">
          <h3>Thêm vào playlist</h3>
          <button className="apm-close-btn" onClick={onClose}>
            <AiOutlineClose size={20} />
          </button>
        </div>

        <div className="apm-search-container">
          <BiSearch className="apm-search-icon" />
          <input
            type="text"
            placeholder="Nhập tên playlist"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="apm-search-input"
            autoFocus
          />
        </div>

        <div className="apm-create-btn" onClick={handleCreateNew}>
          <div className="apm-plus-icon">
            <AiOutlinePlus size={20} />
          </div>
          <span>Tạo playlist mới</span>
        </div>

        <div className="apm-list-container">
          <div className="apm-list-title">Playlist của bạn</div>
          <div className="apm-scroll-area">
            {loading ? (
              <p className="apm-loading">Đang tải...</p>
            ) : filteredPlaylists.length === 0 ? (
              <p className="apm-empty">Không tìm thấy playlist nào</p>
            ) : (
              filteredPlaylists.map((playlist) => {
                 let coverUrl = null;
                 if (playlist.cover_url) {
                    coverUrl = playlist.cover_url.startsWith("http") ? playlist.cover_url : `http://localhost:5000${playlist.cover_url}`;
                 } else if (playlist.cover_images && playlist.cover_images[0]) {
                    coverUrl = playlist.cover_images[0].startsWith("http") ? playlist.cover_images[0] : `http://localhost:8081/music_API/online_music/${playlist.cover_images[0]}`;
                 }

                return (
                  <div key={playlist.playlist_id} className="apm-item">
                    <div className="apm-item-left">
                      <div className="apm-cover">
                        {coverUrl ? <img src={coverUrl} alt={playlist.name} /> : <div className="apm-cover-placeholder"><RiPlayListLine /></div>}
                      </div>
                      <span className="apm-name">{playlist.name}</span>
                    </div>
                    <button 
                      className={`apm-add-btn ${addedStatus[playlist.playlist_id] ? 'added' : ''}`}
                      onClick={() => handleAddSong(playlist.playlist_id)}
                      disabled={addedStatus[playlist.playlist_id]}
                    >
                      {addedStatus[playlist.playlist_id] ? "Đã thêm" : "Thêm vào"}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}