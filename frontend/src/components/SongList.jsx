import React, { useState, useEffect, useContext } from "react";
import { getSongs } from "../services/songService";
import { getFavoriteSongIds, toggleSongFavorite } from "../services/favoriteService";
import { PlayerContext } from "../context/PLayerContext";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaPlay, FaPlus } from "react-icons/fa"; 
import AddToPlaylistModal from "./AddToPlaylistModal"; 
import CreatePlaylistModal from "./CreatePlaylistModal";
import "../pages/HomePage.css"; 

export default function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);
  
  // State cho Modal
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
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

      // --- FIX QUAN TRỌNG: Map song_id thành id ---
      const mergedSongs = allSongs.map(song => {
        // API PHP trả về 'song_id', API khác có thể trả 'id'
        // Ta ưu tiên lấy giá trị nào tồn tại
        const validId = song.song_id || song.id;

        return {
          ...song,
          id: validId, // Gán chuẩn vào id để dùng trong JSX
          song_id: validId, // Giữ lại song_id cho chắc
          is_favorite: favSet.has(String(validId))
        };
      });
      // --------------------------------------------

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

    try {
      const newStatus = await toggleSongFavorite(song.id);
      setSongs(prev => prev.map(s => s.id === song.id ? { ...s, is_favorite: newStatus } : s));
    } catch (err) {
      alert("Lỗi khi cập nhật bài hát yêu thích!");
    }
  };

  const handleAddToPlaylist = (e, songId) => {
    e.stopPropagation();
    
    // Debug xem ID có bị undefined không
    console.log("Add Song Clicked. ID:", songId);

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Vui lòng đăng nhập!");
      return;
    }
    
    if (!songId) {
      alert("Lỗi: Không tìm thấy ID bài hát (Dữ liệu lỗi).");
      return;
    }

    setSelectedSongId(songId);
    setShowAddToPlaylistModal(true);
  };

  const handleOpenCreateFromAddModal = () => {
     setShowAddToPlaylistModal(false);
     setShowCreateModal(true);
  };

  const handlePlaylistCreated = () => {
    window.dispatchEvent(new Event("playlistUpdated"));
    if (selectedSongId) {
        setShowAddToPlaylistModal(true);
    }
  };

  if (loading) return <div style={{ padding: "30px", textAlign: "center", color: "#888" }}>Đang tải bài hát...</div>;

  return (
    <section className="songs-section songs-section-left">
      <div className="section-header section-header-left">
        <h2>Danh sách bài hát</h2>
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

      <AddToPlaylistModal
        isOpen={showAddToPlaylistModal}
        onClose={() => setShowAddToPlaylistModal(false)}
        songId={selectedSongId}
        onCreateNew={handleOpenCreateFromAddModal}
      />

      <CreatePlaylistModal 
        isOpen={showCreateModal}
        onClose={() => {
            setShowCreateModal(false);
            if (selectedSongId) setShowAddToPlaylistModal(true);
        }}
        onSuccess={handlePlaylistCreated}
      />

    </section>
  );
}