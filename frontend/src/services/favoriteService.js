// src/services/favoriteService.js
import axios from "axios";

const API_URL = "http://localhost:5000/api"; // Node.js Backend

export const getFavoriteSongIds = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];
    const response = await axios.get(`${API_URL}/favorite-songs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (response.data.success) {
      return response.data.favorites.map(item => item.song_id);
    }
    return [];
  } catch (error) {
    console.error("Lỗi lấy bài hát yêu thích:", error);
    return [];
  }
};

// Toggle thích bài hát
export const toggleSongFavorite = async (songId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${API_URL}/favorite-songs/check/${songId}`, {
       headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.is_favorite) {
       await axios.delete(`${API_URL}/favorite-songs/remove/${songId}`, {
          headers: { Authorization: `Bearer ${token}` }
       });
       return false; // Đã xóa -> Hết thích
    } else {
       await axios.post(`${API_URL}/favorite-songs/add`, { song_id: songId }, {
          headers: { Authorization: `Bearer ${token}` }
       });
       return true; // Đã thêm -> Thích
    }
  } catch (error) {
    console.error("Lỗi toggle song favorite:", error);
    throw error;
  }
};