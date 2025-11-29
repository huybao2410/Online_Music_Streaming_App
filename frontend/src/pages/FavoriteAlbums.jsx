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
        // Chuẩn hóa dữ liệu trả về
        const mapped = res.data.favorites.map(album => ({
          album_id: album.album_id || album.id,
          name: album.name || album.album_name,
          artist_name: album.artist_name || album.artist,
          cover_url: album.cover || album.cover_url,
        }));
        setFavorites(mapped);
      }
    } catch (err) {
      console.error("Lỗi tải album yêu thích", err);
    }
  };

  return (
    <div className="favorites-container">
      <div className="favorites-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AiFillHeart size={32} style={{ color: '#ff6b6b' }} />
            Album Yêu Thích
          </h1>
          <p style={{ color: '#8a8f98', marginTop: '8px' }}>
            {favorites.length} album đã lưu
          </p>
        </div>
      </div>

      <div className="favorites-grid">
        {favorites.map((album) => (
          <div
            key={album.album_id}
            className="playlist-item"
            onClick={() => navigate(`/album/${album.album_id}`)}
          >
            <div className="playlist-cover">
              <img src={album.cover_url} alt={album.name} />
            </div>
            <div className="playlist-info">
              <h3>{album.name}</h3>
              <p>{album.artist_name}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavoriteAlbums;