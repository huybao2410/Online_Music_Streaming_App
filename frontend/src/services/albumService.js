// src/services/albumService.js
import axios from "axios";

const NODE_API_URL = "http://localhost:5000/api"; // API Node.js
const PHP_API_URL = "http://localhost:8081/music_API/online_music"; // API PHP

/** 🟢 Lấy tất cả albums từ PHP backend (Giữ nguyên logic cũ của bạn) */
export const getAllAlbums = async () => {
  try {
    const response = await axios.get(`${PHP_API_URL}/album/get_albums_web.php`);
    console.log("🔥 API trả về albums:", response.data);

    if (response.data.status && Array.isArray(response.data.albums)) {
      return response.data.albums;
    }
    return [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy albums:", error);
    return [];
  }
};

/** 🟢 Lấy danh sách bài hát trong album (Giữ nguyên logic cũ) */
export const getAlbumSongs = async (albumId) => {
  try {
    console.log("➡️ getAlbumSongs albumId=", albumId);
    const res = await fetch(
      `${PHP_API_URL}/album/get_album_songs.php?id=${albumId}`
    );
    const text = await res.text();
    const data = JSON.parse(text);
    
    if (Array.isArray(data)) return data;
    return [];
  } catch (err) {
    console.error("Lỗi load album songs:", err);
    return [];
  }
};

/** 🟢 Lấy thông tin chi tiết album (Giữ nguyên logic cũ) */
export const getAlbumInfo = async (albumId) => {
  try {
    const response = await axios.get(
      `${PHP_API_URL}/album/get_album_detail.php?id=${albumId}`
    );
    
    if (response.data && response.data.status === 'success') {
       return response.data.album;
    } else if (response.data && response.data.album_id) {
       return response.data;
    }
    return null;
  } catch (error) {
    console.error("❌ Lỗi khi lấy thông tin album:", error);
    return null;
  }
};

/** 🟢 Lấy albums từ nghệ sĩ yêu thích (API cũ) */
export const getAlbumsByFavoriteArtists = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];

    const response = await axios.get(`${NODE_API_URL}/albums/by-favorite-artists`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.data.success && Array.isArray(response.data.albums)) {
      return response.data.albums;
    }
    return [];
  } catch (error) {
    console.error("❌ Lỗi khi lấy albums yêu thích:", error);
    return [];
  }
};

// --- CÁC HÀM MỚI BỔ SUNG CHO TÍNH NĂNG YÊU THÍCH ---
/** Thêm album vào danh sách yêu thích */
export const addFavoriteAlbum = async (albumId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");
    const response = await axios.post(
      `${NODE_API_URL}/favorite-albums/add`,
      { album_id: albumId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi thêm album yêu thích:", error);
    throw error;
  }
};

/** Xóa album khỏi danh sách yêu thích */
export const removeFavoriteAlbum = async (albumId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) throw new Error("Chưa đăng nhập");
    const response = await axios.delete(
      `${NODE_API_URL}/favorite-albums/remove/${albumId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi xóa album yêu thích:", error);
    throw error;
  }
};

/** 🟢 Lấy danh sách ID album đã thích (Gọi Node.js API) */
/** 🟢 Lấy danh sách ID album đã thích */
export const getFavoriteAlbumIds = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];
    
    const response = await axios.get(`${NODE_API_URL}/favorite-albums`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && Array.isArray(response.data.favorites)) {
      // FIX: API trả về mảng object album, cần map lấy album_id
      return response.data.favorites.map(album => album.album_id);
    }
    return [];
  } catch (error) {
    console.error("Lỗi lấy favorite albums:", error);
    return [];
  }
};

/** 🟢 Toggle yêu thích album (Gọi Node.js API) */
export const toggleAlbumFavorite = async (albumId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${NODE_API_URL}/favorite-albums/toggle`,
      { album_id: albumId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi toggle favorite album:", error);
    throw error;
  }
};

/** 🟢 Kiểm tra trạng thái yêu thích (Legacy - có thể giữ lại nếu cần dùng lẻ) */
export const checkAlbumFavoriteStatus = async (albumId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const response = await axios.get(
      `${NODE_API_URL}/albums/${albumId}/favorite-status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return response.data.is_favorite || false;
  } catch (error) {
    return false;
  }
};
