import axios from "axios";

const API_URL = "http://localhost:5000/api"; // URL Node.js Backend

// ... (giữ nguyên các hàm getAllAlbums, getAlbumSongs cũ) ...
export const getAllAlbums = async () => {
  // Giữ nguyên logic gọi PHP hoặc Node của bạn
  try {
    const response = await axios.get("http://localhost:8081/music_API/online_music/album/get_albums.php");
    if (response.data.status && Array.isArray(response.data.albums)) {
      return response.data.albums;
    }
    return [];
  } catch (error) {
    return [];
  }
};

// --- CÁC HÀM MỚI ---

/** Lấy danh sách ID album đã thích */
export const getFavoriteAlbumIds = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return [];
    
    const response = await axios.get(`${API_URL}/favorite-albums`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    return response.data.favorites || [];
  } catch (error) {
    console.error("Lỗi lấy favorite albums:", error);
    return [];
  }
};

/** Toggle yêu thích album */
export const toggleAlbumFavorite = async (albumId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_URL}/favorite-albums/toggle`,
      { album_id: albumId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi toggle favorite album:", error);
    throw error;
  }
};