// src/pages/AlbumDetailPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiHeart, HiOutlineHeart, HiArrowLeft } from "react-icons/hi2";
import { PlayerContext } from "../context/PLayerContext";
import AdOverlay from "../components/AdOverlay";
import "./AlbumDetailPage.css";

const PHP_API_URL = "http://localhost:8081/music_API/online_music";

// FIX URL (Android Emulator → Web)
const fixUrl = (url) => (url ? url.replace("10.0.2.2", "localhost") : "");

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { setPlaylist, setCurrentSong, showAd, setShowAd } = useContext(PlayerContext);

  const [songs, setSongs] = useState([]);
  const [albumInfo, setAlbumInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  // Load album data
  useEffect(() => {
    loadAlbumData();
  }, [albumId]);

  const loadAlbumData = async () => {
    try {
      setLoading(true);

      // 🟢 API duy nhất lấy album + danh sách bài hát
      const res = await fetch(`${PHP_API_URL}/album/get_album_by_id_web.php?id=${albumId}`);
      const data = await res.json();

      console.log("📡 Album API:", data);

      if (!data.status) {
        setAlbumInfo(null);
        return;
      }

      // 🟢 ALBUM INFO
      setAlbumInfo({
        id: data.album.album_id,
        name: data.album.name,
        artist: data.album.artist,
        cover: fixUrl(data.album.cover_url),
        description: data.album.description,
      });

      // 🟢 SONGS (FORMAT CHUẨN GIỐNG HOME PAGE)
      const normalized = data.songs.map((s) => ({
        id: s.song_id,
        title: s.title,
        artist: s.artist || (s.artists && s.artists.join(', ')) || '',
        genre: s.genre || (s.genres && s.genres.join(', ')) || '',
        url: fixUrl(s.audio_url || s.audio || s.url),
        cover: fixUrl(s.cover_url || s.cover),
        duration: s.duration || 0,
      }));

      setSongs(normalized);

      // 🟢 Kiểm tra favorite album
      const token = localStorage.getItem("token");
      const favRes = await fetch(`${PHP_API_URL}/album/check_favorite_album.php?id=${albumId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const favData = await favRes.json();
      setIsFavorite(favData.is_favorite === true);
    } catch (err) {
      console.error("❌ Lỗi load album:", err);
    } finally {
      setLoading(false);
    }
  };

  // ❤️ Toggle favorite
  const handleToggleFavorite = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("user_id");
    if (!token) {
      alert("Bạn cần đăng nhập để sử dụng tính năng này.");
      return;
    }
    if (!userId || !albumId) {
      alert("Thiếu user_id hoặc album_id");
      return;
    }
    setFavoriteLoading(true);
    try {
      const API = isFavorite
        ? `${PHP_API_URL}/album/remove_favorite_album.php?id=${albumId}`
        : `${PHP_API_URL}/album/add_favorite_album.php?id=${albumId}`;
      const res = await fetch(API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ user_id: userId, album_id: albumId })
      });
      const result = await res.json();
      if (result.status) {
        // Reload trạng thái favorite từ API để đảm bảo đồng bộ
        await loadAlbumData();
      } else {
        alert(result.message || "Có lỗi xảy ra, thử lại sau.");
      }
    } catch (e) {
      console.error("Lỗi favorite album:", e);
      alert("Có lỗi xảy ra, thử lại sau.");
    } finally {
      setFavoriteLoading(false);
    }
  };

  // ▶ PLAY SONG GIỐNG HOME PAGE
  const handlePlaySong = (song, index) => {
    setPlaylist(songs);
    setCurrentSong(song); // ĐÚNG FORMAT
  };

  if (loading)
    return (
      <div className="album-detail-page">
        <p>Đang tải...</p>
      </div>
    );

  if (!albumInfo)
    return (
      <div className="album-detail-page">
        <p>Không tìm thấy album</p>
      </div>
    );

  // Format duration mm:ss
  function formatDuration(duration) {
    if (!duration) return '';
    const min = Math.floor(duration / 60);
    const sec = Math.floor(duration % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }

  return (
    <div className="album-detail-page fade-in">
      {showAd && <AdOverlay onClose={() => setShowAd(false)} />}
      {/* Nút quay lại */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <HiArrowLeft size={24} />
      </button>

      {/* HEADER */}
      <div className="album-header" style={{display: 'flex', alignItems: 'center', gap: 32, position: 'relative'}}>
        <img
          src={albumInfo.cover || "https://placehold.co/300x300"}
          alt={albumInfo.name}
          className="album-cover-img"
          style={{width: 220, height: 220, borderRadius: 20, objectFit: 'cover', boxShadow: '0 4px 24px #0004'}}
          onError={(e) => (e.target.src = "https://placehold.co/300x300")}
        />
        <div style={{flex: 1}}>
          <div style={{fontSize: 18, color: '#b3b3b3', fontWeight: 500, marginBottom: 4}}>Album · {songs.length} Bài hát</div>
          <h1 style={{fontSize: 44, fontWeight: 800, color: '#fff', margin: 0}}>{albumInfo.name}</h1> 
          <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 12}}>
            <button className="favorite-button" onClick={handleToggleFavorite} disabled={favoriteLoading} style={{background: 'none', border: 'none', cursor: 'pointer'}}>
              {favoriteLoading ? (
                <span className="favorite-loading">...</span>
              ) : isFavorite ? (
                <HiHeart size={38} className="heart-active" style={{color: '#00e0ff'}} />
              ) : (
                <HiOutlineHeart size={38} style={{color: '#fff'}} />
              )}
            </button>
            <button
              className="play-all-btn"
              style={{
                background: '#00e0ff',
                color: '#222',
                fontWeight: 700,
                fontSize: 18,
                border: 'none',
                borderRadius: 32,
                padding: '10px 32px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                boxShadow: '0 2px 8px #0002',
                cursor: 'pointer',
                zIndex: 2
              }}
              onClick={() => {
                if (songs.length > 0) {
                  setPlaylist(songs);
                  setCurrentSong(songs[0]);
                }
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7L8 5z" fill="#222"/></svg>
              Phát tất cả
            </button>
            {/* Bỏ nút tải xuống */}
          </div>
        </div>
      </div>

      {/* DANH SÁCH BÀI HÁT */}
      <div className="song-list" style={{marginTop: 32}}>
        {/* Header */}
        <div className="song-list-header" style={{display: 'flex', alignItems: 'center', padding: '8px 16px', fontWeight: 700, color: '#b3b3b3', borderBottom: '1px solid #222'}}>
          <div style={{width: 40, textAlign: 'center'}}>#</div>
          <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: 12}}>Tiêu đề</div>
          <div style={{flex: 1, textAlign: 'left'}}>Nghệ sĩ</div>
          <div style={{flex: 1, textAlign: 'left'}}>Thể loại</div>
          <div style={{width: 60, textAlign: 'right'}}>⏱</div>
        </div>
        {/* Song rows */}
        {songs.map((song, idx) => (
          <div
            key={song.id}
            className="song-row hover-highlight"
            onClick={() => handlePlaySong(song, idx)}
            style={{display: 'flex', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #222', cursor: 'pointer'}}>
            <div style={{width: 40, textAlign: 'center', fontWeight: 600, color: '#b3b3b3'}}>{idx + 1}</div>
            <div style={{flex: 2, display: 'flex', alignItems: 'center', gap: 12}}>
              <img
                src={song.cover || "https://placehold.co/80"}
                alt={song.title}
                style={{width: 48, height: 48, objectFit: 'cover', borderRadius: 6, boxShadow: '0 2px 8px #0002'}}
                onError={(e) => (e.target.src = "https://placehold.co/80")}
              />
              <span style={{fontWeight: 600, color: '#fff'}}>{song.title}</span>
            </div>
            <div style={{flex: 1, color: '#fff', fontWeight: 400}}>{song.artist}</div>
            <div style={{flex: 1, color: '#fff', fontWeight: 400}}>{song.genre}</div>
            <div style={{width: 60, textAlign: 'right', color: '#b3b3b3', fontVariantNumeric: 'tabular-nums'}}>{formatDuration(song.duration)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumDetailPage;