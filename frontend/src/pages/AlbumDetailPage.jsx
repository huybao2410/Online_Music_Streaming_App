// src/pages/AlbumDetailPage.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiHeart, HiOutlineHeart, HiArrowLeft } from "react-icons/hi2";
import { PlayerContext } from "../context/PLayerContext";
import "./AlbumDetailPage.css";

const PHP_API_URL = "http://localhost:8081/music_API/online_music";

// FIX URL (Android Emulator → Web)
const fixUrl = (url) => (url ? url.replace("10.0.2.2", "localhost") : "");

const AlbumDetailPage = () => {
  const { albumId } = useParams();
  const navigate = useNavigate();
  const { setPlaylist, setCurrentSong } = useContext(PlayerContext);

  const [songs, setSongs] = useState([]);
  const [albumInfo, setAlbumInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

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
        artist: s.artist,
        url: fixUrl(s.audio_url || s.audio || s.url),
        cover: fixUrl(s.cover_url || s.cover),
        duration: s.duration || 0,
      }));

      setSongs(normalized);

      // 🟢 Kiểm tra favorite album
      const favRes = await fetch(`${PHP_API_URL}/album/check_favorite_album.php?id=${albumId}`);
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
    try {
      const API = isFavorite
        ? `${PHP_API_URL}/album/remove_favorite_album.php?id=${albumId}`
        : `${PHP_API_URL}/album/add_favorite_album.php?id=${albumId}`;

      await fetch(API);
      setIsFavorite(!isFavorite);
    } catch (e) {
      console.error("Lỗi favorite album:", e);
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

  return (
    <div className="album-detail-page fade-in">

      {/* Nút quay lại */}
      <button className="back-button" onClick={() => navigate(-1)}>
        <HiArrowLeft size={24} />
      </button>

      {/* HEADER */}
      <div className="album-header">
        <img
          src={albumInfo.cover || "https://placehold.co/300x300"}
          alt={albumInfo.name}
          className="album-cover-img"
          onError={(e) => (e.target.src = "https://placehold.co/300x300")}
        />

        <div className="album-info-text">
          <p className="album-type">Album</p>
          <h1 className="album-title">{albumInfo.name}</h1>
          <p className="album-artist">{albumInfo.artist}</p>
          <p className="album-count">{songs.length} bài hát</p>
        </div>

        <button className="favorite-button" onClick={handleToggleFavorite}>
          {isFavorite ? (
            <HiHeart size={38} className="heart-active" />
          ) : (
            <HiOutlineHeart size={38} />
          )}
        </button>
      </div>

      {/* DANH SÁCH BÀI HÁT */}
      <div className="song-list">
        {songs.map((song, idx) => (
          <div
            key={song.id}
            className="song-row hover-highlight"
            onClick={() => handlePlaySong(song, idx)}
          >
            <img
              src={song.cover || "https://placehold.co/80"}
              alt={song.title}
              className="song-cover"
              onError={(e) => (e.target.src = "https://placehold.co/80")}
            />

            <div className="song-info">
              <h3>{song.title}</h3>
              <p>{song.artist}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AlbumDetailPage;
