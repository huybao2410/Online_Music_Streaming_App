import axios from "axios";

// PHP API URL (hiện tại hệ thống cũ)
const PHP_API_URL = "http://localhost:80/music_API/online_music";

// Node API URL (tương lai)
const NODE_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Lấy danh sách nghệ sĩ từ PHP API
 * Trả về mảng nghệ sĩ dạng ["Sơn Tùng M-TP", "Đen Vâu", ...]
 */
export const getAllArtists = async () => {
  try {
    const response = await axios.get(`${PHP_API_URL}/get_artists.php`, {
      headers: { "Cache-Control": "no-cache" },
    });

    if (response && Array.isArray(response.data)) {
      return response.data;
    } else if (response?.data?.artists) {
      return response.data.artists;
    } else {
      console.warn("API không trả dữ liệu nghệ sĩ hợp lệ:", response.data);
      return [];
    }
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nghệ sĩ từ PHP API:", error);
    return [];
  }
};

/**
 * Lấy danh sách nghệ sĩ từ Node API
 * Trả về mảng object: [{ id, name, cover_url }, ...]
 */
export const getAllArtistsFromNode = async () => {
  try {
    const response = await axios.get(`${NODE_API_URL}/artists`);
    const artists = response.data.artists || response.data || [];

    return artists.map(artist => ({
      id: artist.id,
      name: artist.name || artist.artist_name,
      cover: artist.cover_url && !artist.cover_url.startsWith('http')
        ? `http://localhost:5000${artist.cover_url}`
        : artist.cover_url
    }));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nghệ sĩ từ Node API:", error);
    return [];
  }
};

/**
 * Lấy thông tin nghệ sĩ theo id từ Node API
 */
export const getArtistById = async (id) => {
  try {
    const response = await axios.get(`${NODE_API_URL}/artists/${id}`);
    const artist = response.data.artist;

    return {
      ...artist,
      cover: artist.cover_url && !artist.cover_url.startsWith('http')
        ? `http://localhost:5000${artist.cover_url}`
        : artist.cover_url,
      name: artist.name || artist.artist_name
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nghệ sĩ:", error);
    return null;
  }
};

/**
 * Tạo nghệ sĩ mới trên Node API
 */
export const createArtist = async (formData, token) => {
  try {
    const response = await axios.post(`${NODE_API_URL}/artists`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo nghệ sĩ:", error);
    throw error;
  }
};

/**
 * Cập nhật nghệ sĩ theo id trên Node API
 */
export const updateArtist = async (id, data, token) => {
  try {
    const response = await axios.put(`${NODE_API_URL}/artists/${id}`, data, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật nghệ sĩ:", error);
    throw error;
  }
};

/**
 * Xóa nghệ sĩ theo id trên Node API
 */
export const deleteArtist = async (id, token) => {
  try {
    const response = await axios.delete(`${NODE_API_URL}/artists/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa nghệ sĩ:", error);
    throw error;
  }
};
