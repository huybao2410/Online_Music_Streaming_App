// src/services/artistService.js
import axios from "axios";

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8081/music_API/online_music",
  headers: { "Content-Type": "application/json" },
});

/**
 * 🟢 Lấy danh sách nghệ sĩ từ PHP API
 */
export const getArtists = async () => {
  try {
    const response = await API.get("/artist/get_artists.php");

    if (response.data.status && Array.isArray(response.data.artists)) {
      const fixedArtists = response.data.artists.map((artist) => ({
        id: artist.id,
        name: artist.name,
        bio: artist.bio || "Không có mô tả",
        avatar: fixLocalUrl(artist.avatar),
      }));
      return fixedArtists;
    } else {
      console.warn("⚠️ API nghệ sĩ trả dữ liệu không hợp lệ:", response.data);
      return [];
    }
  } catch (error) {
    console.error("❌ Lỗi khi gọi API get_artists.php:", error);
    return [];
  }
};

/**
 * Sửa IP emulator → localhost
 */
const fixLocalUrl = (url) => {
  if (!url) return "";
  return url.replace("10.0.2.2", "localhost");
};