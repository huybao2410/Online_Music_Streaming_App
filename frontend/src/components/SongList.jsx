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
        const data = await getSongs();
        setSongs(data);
        setPlaylist(data);
      } catch (err) {
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
    return <div style={{ padding: "20px" }}>Đang tải danh sách bài hát...</div>;
  }

  if (error) {
    return <div style={{ padding: "20px", color: "red" }}>Lỗi: {error}</div>;
  }

  if (songs.length === 0) {
    return <div style={{ padding: "20px" }}>Không có bài hát nào</div>;
  }

  return (
    <div className="song-list-container">
      <h2>Danh sách bài hát</h2>

      <div className="songs-grid">
        {songs.map((song) => (
          <div
            key={song.url}
            className="sl-item"
            onClick={() => setCurrentSong(song)}
          >
            <div className="sl-cover">
              {song.cover ? (
                <img src={song.cover} alt={song.title} />
              ) : (
                <div className="sl-placeholder">♫</div>
              )}
            </div>

            <div className="sl-info">
              <div className="sl-title">{song.title}</div>
              <div className="sl-artist">{song.artist}</div>
            </div>

            <div className="sl-actions">
              <button
                className={`sl-btn sl-fav ${isFavorite(song) ? "active" : ""}`}
                onClick={(e) => toggleFavorite(e, song)}
              >
                {isFavorite(song) ? (
                  <AiFillHeart size={20} />
                ) : (
                  <AiOutlineHeart size={20} />
                )}
              </button>

              <button
                className="sl-btn sl-add"
                onClick={(e) => handleAddToPlaylist(e, song)}
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
