import axios from "axios";

const apiMusic = axios.create({
  baseURL: "http://localhost/music_API", // ✅ URL của XAMPP server
  headers: { "Content-Type": "application/json" },
});

export default apiMusic;
