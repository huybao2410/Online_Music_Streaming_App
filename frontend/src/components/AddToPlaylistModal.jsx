import React, { useState, useEffect } from "react";
import axios from "axios";
import { AiOutlineClose, AiOutlinePlus } from "react-icons/ai";
import { BiSearch } from "react-icons/bi";
import { RiPlayListLine } from "react-icons/ri";
import "./AddToPlaylistModal.css";

const API_URL = "http://localhost:5000/api";

// FIX URL TỰ ĐỘNG
function fixUrl(url) {
  if (!url) return null;

  let fixed = url.replace("10.0.2.2", "localhost");

  if (!fixed.startsWith("http")) {
    if (fixed.startsWith("/uploads")) {
      fixed = `http://localhost:5000${fixed}`;
    } else {
      fixed = `http://localhost:8081/music_API/online_music/${fixed.replace(/^\//, "")}`;
    }
  }

  return fixed;
}

export default function AddToPlaylistModal({ isOpen, onClose, songId, onCreateNew }) {
  const [playlists, setPlaylists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [addedStatus, setAddedStatus] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
      setAddedStatus({});
    }
  }, [isOpen, songId]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const res = await axios.get(`${API_URL}/playlists/my-playlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const fixed = res.data.playlists.map(pl => ({
          ...pl,
          cover_url: fixUrl(pl.cover_url),
          cover_images: pl.cover_images ? pl.cover_images.map(i => fixUrl(i)) : []
        }));

        setPlaylists(fixed);
      }
    } catch (err) {
      console.error("Lỗi tải playlist:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSong = async (playlistId) => {
    if (!songId) return alert("Không tìm thấy ID bài hát!");




    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/playlists/${playlistId}/songs`,
        { song_id: songId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAddedStatus(prev => ({ ...prev, [playlistId]: true }));
      window.dispatchEvent(new Event("playlistUpdated"));








    } catch (err) {
      console.error("Lỗi thêm bài hát:", err);
      alert(err.response?.data?.message || "Không thể thêm bài hát");



    }
  };

  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="add-playlist-overlay" onClick={onClose}>
      <div className="add-playlist-modal" onClick={(e) => e.stopPropagation()}>

        {/* HEADER */}
        <div className="apm-header">
          <h3>Thêm vào playlist</h3>
          <button className="apm-close-btn" onClick={onClose}>
            <AiOutlineClose size={20} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="apm-search-container">
          <BiSearch className="apm-search-icon" />
          <input
            autoFocus
            placeholder="Nhập tên playlist..."
            value={searchTerm}

            className="apm-search-input"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* CREATE NEW PLAYLIST */}
        <div className="apm-create-btn" onClick={() => { onClose(); onCreateNew(); }}>
          <div className="apm-plus-icon"><AiOutlinePlus size={20} /></div>

          <span>Tạo playlist mới</span>
        </div>

        {/* LIST PLAYLIST */}
        <div className="apm-list-container">
          <div className="apm-list-title">Playlist của bạn</div>

          <div className="apm-scroll-area">

            {loading ? (
              <p className="apm-loading">Đang tải...</p>
            ) : filteredPlaylists.length === 0 ? (
              <p className="apm-empty">Không tìm thấy playlist nào</p>
            ) : (
              filteredPlaylists.map(playlist => {
                let cover = playlist.cover_url
                  || (playlist.cover_images?.length ? playlist.cover_images[0] : null);

                cover = fixUrl(cover);



                return (
                  <div key={playlist.playlist_id} className="apm-item">
                    <div className="apm-item-left">
                      <div className="apm-cover">
                        {cover ? <img src={cover} alt={playlist.name} /> : <RiPlayListLine />}
                      </div>
                      <span className="apm-name">{playlist.name}</span>
                    </div>

                    <button
                      className={`apm-add-btn ${addedStatus[playlist.playlist_id] ? "added" : ""}`}
                      disabled={addedStatus[playlist.playlist_id]}
                      onClick={() => handleAddSong(playlist.playlist_id)}
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