import React, { useState, useEffect, useContext } from "react";
import { PlayerContext } from "../context/PLayerContext";
import { AiFillHeart, AiOutlineDelete } from "react-icons/ai";
import "./UserProfile.css"; // Reuse styles

const FavoriteSongs = () => {
  const [favorites, setFavorites] = useState([]);
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('token');
      if (!token) return setFavorites([]);
      try {
        const res = await fetch('http://localhost:5000/api/favorite-songs', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          // Map lại để trường url lấy từ audio, cover lấy từ cover nếu có
          const mapped = data.favorites.map(song => ({
            ...song,
            url: song.audio || song.url,
            cover: song.cover || song.cover_url
          }));
          setFavorites(mapped);
        } else {
          setFavorites([]);
        }
      } catch (error) {
        setFavorites([]);
      }
    };
    fetchFavorites();
  }, []);

  const handlePlay = (song) => {
    // Chuẩn hóa object: luôn có trường url lấy từ audio
    const mappedFavorites = favorites.map(s => ({ ...s, url: s.audio }));
    setPlaylist(mappedFavorites);
    setCurrentSong({ ...song, url: song.audio });
  };

  const handleRemove = (songUrl) => {
    // Gọi API Node.js để xóa bài hát yêu thích
    const token = localStorage.getItem('token');
    if (!token) return;
    const song = favorites.find(s => s.url === songUrl);
    if (!song) return;
    fetch(`http://localhost:5000/api/favorite-songs/remove/${song.song_id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    }).then(() => {
      setFavorites(prev => prev.filter(s => s.song_id !== song.song_id));
    });
  };

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      const mappedFavorites = favorites.map(s => ({ ...s, url: s.audio }));
      setPlaylist(mappedFavorites);
      setCurrentSong(mappedFavorites[0]);
    }
  };

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AiFillHeart size={32} style={{ color: '#ff6b6b' }} />
            Bài Hát Yêu Thích
          </h1>
          <p style={{ color: '#8a8f98', marginTop: '8px' }}>
            {favorites.length} bài hát đã lưu
          </p>
        </div>
        <button 
          className="play-all-btn"
          onClick={handlePlayAll}
          disabled={favorites.length === 0}
          style={{
            padding: '12px 30px',
            background: favorites.length === 0 ? '#666' : 'linear-gradient(135deg, #4a9b9b, #3a8b8b)',
            color: '#fff',
            border: 'none',
            borderRadius: '24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: favorites.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          ▶ Phát tất cả
        </button>
      </div>

      {favorites.length === 0 ? (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#8a8f98'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>♪</div>
          <p>Chưa có bài hát yêu thích nào</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Hãy thêm bài hát bạn yêu thích bằng cách ấn icon trái tim
          </p>
        </div>
      ) : (
        <div className="favorites-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '20px',
          marginTop: '30px'
        }}>
          {favorites.map((song) => (
            <div
              key={song.url}
              style={{
                background: '#1a1e24',
                borderRadius: '8px',
                overflow: 'hidden',
                transition: 'all 0.3s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#252b33';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#1a1e24';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Cover Image */}
              <div
                style={{
                  width: '100%',
                  height: '200px',
                  background: song.cover
                    ? `url('${song.cover}') center/cover`
                    : 'linear-gradient(135deg, #4a9b9b, #2a6b6b)',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
                onClick={() => handlePlay(song)}
              >
                <button
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    background: 'rgba(74, 155, 155, 0.9)',
                    border: 'none',
                    color: '#fff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 155, 155, 1)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(74, 155, 155, 0.9)';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onClick={() => handlePlay(song)}
                >
                  ▶
                </button>
              </div>

              {/* Song Info */}
              <div style={{ padding: '15px' }}>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#fff',
                  margin: '0 0 5px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {song.title}
                </h3>
                <p style={{
                  fontSize: '12px',
                  color: '#8a8f98',
                  margin: '0 0 10px 0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {song.artist}
                </p>

                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(song.url)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#ff6b6b',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#ff5252';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#ff6b6b';
                  }}
                >
                  <AiOutlineDelete size={16} /> Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


export default FavoriteSongs;
