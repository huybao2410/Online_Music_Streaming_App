import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8081/music_API/online_music",
  headers: { "Content-Type": "application/json" },
});

export const getGenres = async () => {
  try {
    const res = await API.get("/song/get_songs_by_genre.php");
    if (res.data.status && Array.isArray(res.data.genres)) {
      return res.data.genres.map((g) => ({
        id: g.genre_id,
        name: g.name,
      }));
    }
    return [];
  } catch (err) {
    console.error("❌ Lỗi khi tải thể loại:", err);
    return [];
  }
};
