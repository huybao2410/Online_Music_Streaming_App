import React, { useState, useEffect, useContext } from "react";
import { getSongs } from "../services/songService";
import { getFavoriteSongIds, toggleSongFavorite } from "../services/favoriteService";
import { PlayerContext } from "../context/PLayerContext";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaPlay, FaPlus } from "react-icons/fa"; 
import AddSongToPlaylistModal from "./AddSongToPlaylistModal"; // Import Modal
import "../pages/HomePage.css"; 

export default function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);
  
  // State cho Modal thêm playlist
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSongId, setSelectedSongId] = useState(null);

  useEffect(() => {
    fetchSongsAndFavorites();
  }, []);

  const fetchSongsAndFavorites = async () => {
    setLoading(true);
    try {
      const [allSongs, favIds] = await Promise.all([
        getSongs(),
        getFavoriteSongIds()
      ]);
      
      const favSet = new Set(favIds.map(id => String(id)));

      const mergedSongs = allSongs.map(song => ({
        ...song,
        is_favorite: favSet.has(String(song.id))
      }));

      setSongs(mergedSongs || []);
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoading(false);
    }
  };

  const fixUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url.replace("10.0.2.2", "localhost");
    return `http://localhost:8081/music_API/online_music/${url}`;
  };

  const handleToggleFavorite = async (e, song) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập!");
      return;
    }

    // Optimistic Update
    const newStatus = !song.is_favorite;
    setSongs(prev => prev.map(s => s.id === song.id ? { ...s, is_favorite: newStatus } : s));

    try {
      await toggleSongFavorite(song.id);
    } catch (err) {
      // Revert nếu lỗi
      setSongs(prev => prev.map(s => s.id === song.id ? { ...s, is_favorite: !newStatus } : s));
    }
  };

  const handleAddToPlaylist = (e, songId) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    setSelectedSongId(songId);
    setShowAddModal(true);
  };

  if (loading) return <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>Đang tải bài hát...</div>;

  return (
    <section className="songs-section">
      <div className="section-header">
        <h2>🎵 Danh sách bài hát</h2>
      </div>

      <div className="playlist-grid">
        {songs.map((song) => (
          <div
            key={song.id}
            className="playlist-item music-style-card"
            onClick={() => {
              setPlaylist(songs);
              setCurrentSong(song);
            }}
          >
            <div className="card-image-wrapper">
              <img 
                src={fixUrl(song.cover)} 
                alt={song.title}
                onError={(e) => (e.target.src = "https://placehold.co/300x300")}
              />
            </div>
            
            <div className="card-info">
              <h3 className="card-title" title={song.title}>{song.title}</h3>
              <p className="card-artist" title={song.artist}>{song.artist}</p>
            </div>

            {/* 3 NÚT: TIM - PLAY - CỘNG */}
            <div className="card-actions">
              <button 
                className={`action-btn-circle heart ${song.is_favorite ? 'active' : ''}`}
                onClick={(e) => handleToggleFavorite(e, song)}
                title="Yêu thích"
              >
                {song.is_favorite ? <AiFillHeart /> : <AiOutlineHeart />}
              </button>

              <button className="action-btn-circle play" title="Phát nhạc">
                <FaPlay size={12} style={{ marginLeft: "2px" }} />
              </button>

              <button 
                className="action-btn-circle add"
                onClick={(e) => handleAddToPlaylist(e, song.id)}
                title="Thêm vào Playlist"
              >
                <FaPlus size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Thêm vào Playlist (Sử dụng lại component có sẵn) */}
      {showAddModal && (
        <AddSongToPlaylistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          songId={selectedSongId} // Bạn cần sửa AddSongToPlaylistModal để nhận prop songId nếu chưa có
          // Nếu Modal hiện tại chỉ nhận playlistId, bạn cần sửa Modal để hiển thị danh sách playlist cho user chọn
          // (Xem ghi chú bên dưới)
        />
      )}
    </section>
  );
}