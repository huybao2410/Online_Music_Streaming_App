
import React, { useState, useEffect, useContext } from "react";
import { PlayerContext } from "../context/PLayerContext";
import { AiFillHeart, AiOutlineDelete } from "react-icons/ai";
import "./UserProfile.css";

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
    const mappedFavorites = favorites.map(s => ({ ...s, url: s.audio }));
    setPlaylist(mappedFavorites);
    setCurrentSong({ ...song, url: song.audio });
  };

  const handleRemove = (songUrl) => {
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

  // Lấy bài hát đầu tiên làm cover và info
  const mainSong = favorites[0];

  return (
    <div className="favorites-container">
      {/* Phần trên: Cover lớn, info, nút, icon */}
      {mainSong && (
        <div className="favorite-song-banner" style={{ display: 'flex', gap: 40, alignItems: 'center', marginBottom: 40 }}>
          {/* Cover lớn */}
          <div style={{ minWidth: 220, width: 220, height: 220, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <img src={mainSong.cover} alt={mainSong.title} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24 }} />
          </div>
          {/* Info bên phải */}
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10, fontSize: 16, color: '#b3b3b3', fontWeight: 500 }}>
              Playlist &nbsp;·&nbsp; {favorites.length} Bài hát
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, color: '#fff', lineHeight: 1.1 }}>Bài hát yêu thích</h1>
            {/* Không hiển thị tên nghệ sĩ dưới tiêu đề */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }}>
              <AiFillHeart size={28} style={{ color: '#ff6b6b' }} />
              <button
                style={{
                  padding: '12px 38px',
                  background: 'linear-gradient(135deg, #1ed6d6, #4a9b9b)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '24px',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 2px 12px rgba(30,214,214,0.12)'
                }}
                onClick={handlePlayAll}
                disabled={favorites.length === 0}
              >
                ▶ Phát tất cả
              </button>
            </div>
          </div>
        </div>
      )}

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
        <div className="favorite-songs-table-wrapper">
          <div className="favorite-songs-table">
            <div className="table-header">
              <div className="col-number">#</div>
              <div className="col-title">Tiêu Đề</div>
              <div className="col-artist">Nghệ Sĩ</div>
              <div className="col-album">Album</div>
              <div className="col-remove"></div>
            </div>
            {favorites.map((song, index) => (
              <div 
                key={song.song_id || song.id || song.url} 
                className="track-row"
                onClick={() => handlePlay(song)}
                style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#18191c';
                  const btn = e.currentTarget.querySelector('.action-icon');
                  if (btn) btn.style.color = '#ff2d55';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '';
                  const btn = e.currentTarget.querySelector('.action-icon');
                  if (btn) btn.style.color = '#ff6b6b';
                }}
              >
                <div className="col-number">{index + 1}</div>
                <div className="col-title">
                  <div className="track-info">
                    {song.cover ? (
                      <img src={song.cover} alt={song.title} className="track-image" />
                    ) : (
                      <div className="track-image-placeholder">♪</div>
                    )}
                    <div className="track-details">
                      <div className="track-name">{song.title}</div>
                      <div className="track-artist">{song.artist}</div>
                    </div>
                  </div>
                </div>
                <div className="col-artist">{song.artist}</div>
                <div className="col-album">{song.album || '-'}</div>
                <div className="col-remove">
                  <button
                    className="action-icon"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemove(song.url);
                    }}
                    title="Xóa khỏi yêu thích"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', transition: 'color 0.2s' }}
                  >
                    <AiOutlineDelete size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoriteSongs;
