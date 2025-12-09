// src/pages/FavoriteAlbums.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AiFillHeart } from "react-icons/ai";
import { FaCompactDisc } from "react-icons/fa";
import axios from "axios";
import "./UserProfile.css"; // Tái sử dụng CSS

const FavoriteAlbums = () => {
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavoriteAlbums();
  }, []);

  const fetchFavoriteAlbums = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("http://localhost:5000/api/favorite-albums", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        // Chuẩn hóa dữ liệu trả về, giữ song_count
        const mapped = res.data.favorites.map(album => ({
          album_id: album.album_id || album.id,
          name: album.name || album.album_name,
          artist_name: album.artist_name || album.artist,
          cover_url: album.cover || album.cover_url,
          song_count: album.song_count ?? album.songCount ?? '-',
        }));
        setFavorites(mapped);
      }
    } catch (err) {
      console.error("Lỗi tải album yêu thích", err);
    }
  };

  // Lấy album đầu tiên làm cover và info
  const mainAlbum = favorites[0];

  const handlePlayAll = () => {
    if (favorites.length > 0) {
      navigate(`/album/${mainAlbum.album_id}`);
    }
  };

  // Dummy remove handler (implement backend if needed)
  const handleRemove = (albumId) => {
    setFavorites(prev => prev.filter(a => a.album_id !== albumId));
  };

  return (
    <div className="favorites-container">
      {/* Banner section giống FavoriteSongs */}
      {mainAlbum && (
        <div className="favorite-album-banner" style={{ display: 'flex', gap: 40, alignItems: 'center', marginBottom: 40 }}>
          <div style={{ minWidth: 220, width: 220, height: 220, borderRadius: 24, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
            <img src={mainAlbum.cover_url} alt={mainAlbum.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 24 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ marginBottom: 10, fontSize: 16, color: '#b3b3b3', fontWeight: 500 }}>
              Playlist &nbsp;·&nbsp; {favorites.length} Album
            </div>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: 0, color: '#fff', lineHeight: 1.1 }}>Album yêu thích</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0 10px 0' }}>
              <FaCompactDisc size={22} style={{ color: '#4a9b9b' }} />
              <span style={{ fontWeight: 700, color: '#fff', fontSize: 18 }}>{mainAlbum.artist_name}</span>
            </div>
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
          <p>Chưa có album yêu thích nào</p>
          <p style={{ fontSize: '12px', marginTop: '10px' }}>
            Hãy thêm album bạn yêu thích bằng cách ấn icon trái tim
          </p>
        </div>
      ) : (
        <div className="favorite-albums-table-wrapper">
          <div className="favorite-albums-table">
            <div className="table-header">
              <div className="col-number">#</div>
              <div className="col-title">Tiêu Đề</div>
              <div className="col-artist">Nghệ Sĩ</div>
              <div className="col-album">Số lượng bài hát</div>
              <div className="col-remove"></div>
            </div>
            {favorites.map((album, index) => (
              <div
                key={album.album_id}
                className="track-row"
                onClick={() => navigate(`/album/${album.album_id}`)}
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
                    {album.cover_url ? (
                      <img src={album.cover_url} alt={album.name} className="track-image" />
                    ) : (
                      <div className="track-image-placeholder">♪</div>
                    )}
                    <div className="track-details">
                      <div className="track-name">{album.name}</div>
                      <div className="track-artist">{album.artist_name}</div>
                    </div>
                  </div>
                </div>
                <div className="col-artist">{album.artist_name}</div>
                <div className="col-album">{album.song_count ?? '-'}</div>
                <div className="col-remove">
                  <button
                    className="action-icon"
                    onClick={e => {
                      e.stopPropagation();
                      handleRemove(album.album_id);
                    }}
                    title="Xóa khỏi yêu thích"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff6b6b', transition: 'color 0.2s' }}
                  >
                    <AiFillHeart size={20} />
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

export default FavoriteAlbums;