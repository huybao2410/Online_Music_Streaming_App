import { useContext, useEffect, useState } from "react";
import { getSongs } from "../services/songService";
import { PlayerContext } from "../context/PLayerContext";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsPlusCircle } from "react-icons/bs";
import AddToPlaylistModal from "./AddToPlaylistModal";
import "./SongList.css";

function SongList() {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem("favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [selectedSong, setSelectedSong] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        console.log('Fetching songs...');
        const data = await getSongs();
        console.log('Songs received:', data);
        setSongs(data);
        setPlaylist(data);
      } catch (err) {
        console.error('Error fetching songs:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();
  }, [setPlaylist]);

  useEffect(() => {
    try {
      localStorage.setItem("favorites", JSON.stringify(favorites));
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  }, [favorites]);

  const toggleFavorite = (e, song) => {
    e.stopPropagation();
    const isFavorited = favorites.some((fav) => fav.url === song.url);
    
    if (isFavorited) {
      setFavorites(favorites.filter((fav) => fav.url !== song.url));
    } else {
      setFavorites([
        ...favorites,
        {
          ...song,
          addedAt: new Date().toISOString(),
        },
      ]);
    }
  };

  const handleAddToPlaylist = (e, song) => {
    e.stopPropagation();
    setSelectedSong(song);
    setShowPlaylistModal(true);
  };

  const isFavorite = (song) => {
    return favorites.some((fav) => fav.url === song.url);
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Đang tải danh sách bài hát...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', color: 'red' }}>Lỗi: {error}</div>;
  }

  if (songs.length === 0) {
    return <div style={{ padding: '20px' }}>Không có bài hát nào</div>;
  }

  return (
    <div className="song-list-container">
      <h2>Danh sách bài hát ({songs.length})</h2>
      <div className="songs-grid">
        {songs.map((song) => (
          <div
            key={song.url}
            className="song-item"
            onClick={() => setCurrentSong(song)}
          >
            <div className="song-cover">
              {song.cover ? (
                <img src={song.cover} alt={song.title} />
              ) : (
                <div className="cover-placeholder">♫</div>
              )}
            </div>
            <div className="song-info">
              <div className="song-title">{song.title}</div>
              <div className="song-artist">{song.artist}</div>
            </div>
            <div className="song-actions">
              <button
                className={`action-btn favorite-btn ${isFavorite(song) ? "active" : ""}`}
                onClick={(e) => toggleFavorite(e, song)}
                title={isFavorite(song) ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
              >
                {isFavorite(song) ? (
                  <AiFillHeart size={20} />
                ) : (
                  <AiOutlineHeart size={20} />
                )}
              </button>
              <button
                className="action-btn add-btn"
                onClick={(e) => handleAddToPlaylist(e, song)}
                title="Thêm vào playlist"
              >
                <BsPlusCircle size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <AddToPlaylistModal
        isOpen={showPlaylistModal}
        onClose={() => {
          setShowPlaylistModal(false);
          setSelectedSong(null);
        }}
        song={selectedSong}
      />
    </div>
  );
}

export default SongList;