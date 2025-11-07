import axios from "axios";

const apiMusic = axios.create({
  baseURL: "http://localhost/music_API",
  headers: { "Content-Type": "application/json" },
});

export default apiMusic;