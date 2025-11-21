// src/services/favoriteArtistService.js
import axios from "axios";

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:5000";

/** 🟢 Lấy danh sách nghệ sĩ yêu thích của user */
export const getFavoriteArtists = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("⚠️ Chưa đăng nhập, không thể lấy favorite artists");
      return [];
    }

    const response = await axios.get(`${API_URL}/api/favorite-artists`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success && Array.isArray(response.data.favoriteArtists)) {
      return response.data.favoriteArtists;
    }
    return [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy favorite artists:", error);
    return [];
  }
};

/** 🟢 Thêm nghệ sĩ vào danh sách yêu thích */
export const addFavoriteArtist = async (artistId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/api/favorite-artists`,
      { artist_id: artistId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi thêm favorite artist:", error);
    throw error;
  }
};

/** 🟢 Xóa nghệ sĩ khỏi danh sách yêu thích */
export const removeFavoriteArtist = async (artistId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.delete(
      `${API_URL}/api/favorite-artists/${artistId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi xóa favorite artist:", error);
    throw error;
  }
};

/** 🟢 Lưu nhiều nghệ sĩ yêu thích cùng lúc (bulk) */
export const saveFavoriteArtistsBulk = async (artistIds) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/api/favorite-artists/bulk`,
      { artist_ids: artistIds },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Lỗi khi lưu bulk favorite artists:", error);
    throw error;
  }
};
