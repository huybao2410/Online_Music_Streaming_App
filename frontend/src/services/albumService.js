// frontend/src/services/albumService.js
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

/** 🟢 Lấy albums từ nghệ sĩ yêu thích */
export const getAlbumsByFavoriteArtists = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ Chưa đăng nhập");
      return [];
    }

    const response = await axios.get(`${API_URL}/api/albums/by-favorite-artists`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success && Array.isArray(response.data.albums)) {
      return response.data.albums;
    }
    return [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy albums:", error);
    return [];
  }
};


/** 🟢 Lấy danh sách bài hát trong album */
export const getAlbumSongs = async (albumId) => {
  try {
    const response = await axios.get(`${API_URL}/api/albums/${albumId}/songs`);

    if (response.data.success && Array.isArray(response.data.songs)) {
      return response.data.songs;
    }
    return [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy bài hát trong album:", error);
    return [];
  }
};
export const getAlbumInfo = async (albumId) => {
  try {
    const res = await fetch(
      `http://localhost:8081/music_API/online_music/album/get_album_by_id.php?id=${albumId}`
    );
    const data = await res.json();

    if (data.status) return data.album;
    return null;
  } catch (err) {
    console.error("Lỗi getAlbumInfo:", err);
    return null;
  }
};


/** 🟢 Kiểm tra trạng thái yêu thích album */
export const checkAlbumFavoriteStatus = async (albumId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const response = await axios.get(
      `${API_URL}/api/albums/${albumId}/favorite-status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.is_favorite || false;
  } catch (error) {
    console.error("❌ Lỗi khi kiểm tra favorite status:", error);
    return false;
  }
};
export const getAllAlbums = async () => {
  try {
    const response = await axios.get(
      "http://localhost:8081/music_API/online_music/album/get_albums.php"
    );
    console.log("🔥 getAllAlbums response:", response.data);
    if (response.data.status && Array.isArray(response.data.albums)) {
      return response.data.albums;
    }
    return [];
  } catch (error) {
    console.error("❌ Lỗi getAllAlbums:", error);
    return [];
  }
};
/** 🟢 Toggle yêu thích album */
export const toggleAlbumFavorite = async (albumId, isFavorite) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/api/albums/${albumId}/favorite`,
      { action: isFavorite ? "add" : "remove" },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi toggle favorite:", error);
    throw error;
  }
};
