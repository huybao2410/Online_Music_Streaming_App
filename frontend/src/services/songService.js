import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8081/music_API/online_music",
  headers: { "Content-Type": "application/json" },
});

/**
 * 🟢 Lấy danh sách bài hát từ PHP API (get_songs.php)
 * Chuẩn hóa dữ liệu về dạng: { title, artist, url, cover }
 */
export const getSongs = async () => {
  try {
    const response = await API.get("/song/get_songs_web.php");

    if (response.data.status && Array.isArray(response.data.songs)) {
      const fixedSongs = response.data.songs.map((song) => ({
        id: song.song_id || null,
        title: song.title || "Không rõ tên",
        artist: song.artist || "Không rõ nghệ sĩ",
        cover: fixLocalUrl(song.cover),
        url: fixLocalUrl(song.audio), // ✅ SongList.jsx dùng song.url
        duration: song.duration || 0,
      }));

      return fixedSongs;
    } else {
      console.warn("⚠️ API trả dữ liệu không hợp lệ:", response.data);
      return [];
    }
  } catch (error) {
    console.error("❌ Lỗi khi gọi API PHP:", error);
    return [];
  }
};

/**
 * 🟡 Dùng cho AddToPlaylistModal — thêm/sửa bài hát ngoại
 * Nếu Node backend chưa bật, sẽ mock dữ liệu để không crash
 */
export const upsertExternalSong = async (songData) => {
  try {
    const res = await fetch("http://localhost:5000/api/songs/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(songData),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Lỗi khi thêm/sửa bài hát!");
    }
    return await res.json();
  } catch (err) {
    console.error("❌ upsertExternalSong error:", err);
    throw err;
  }
};

/**
 * 🟣 (Tùy chọn) Hàm tiện ích phát bài hát trực tiếp
 * Gọi từ PlayerContext hoặc SongList nếu cần test
 */
export const playSong = (songUrl) => {
  if (!songUrl) return;
  const fixedUrl = fixLocalUrl(songUrl);
  const audio = new Audio(fixedUrl);
  audio.play().catch((err) => console.error("Không thể phát nhạc:", err));
  return audio;
};

/**
 * 🧩 Tiện ích sửa IP Android Emulator → localhost
 */
const fixLocalUrl = (url) => {
  if (!url) return "";
  return url.replace("10.0.2.2", "localhost");
};
export const searchAll = async (query) => {
  try {
    const res = await API.get("/search/get_search.php");
    if (!res.data || !res.data.status) return { songs: [], albums: [] };

    const fixUrl = (url) => url?.replace("10.0.2.2", "localhost");

    // Chuẩn hóa lại dữ liệu
    const songs = (res.data.songs || []).map(song => ({
      id: song.song_id,
      title: song.title,
      artist: song.artist,
      genre: song.genre,
      duration: song.duration,
      cover: fixUrl(song.cover_url),
      audio: fixUrl(song.audio_url),
    }));

    const albums = (res.data.albums || []).map(album => ({
      id: album.album_id,
      name: album.name,
      artist: album.artist,
      cover: fixUrl(album.cover_url),
      release_date: album.release_date,
    }));

    return { songs, albums };
  } catch (err) {
    console.error("❌ Lỗi tìm kiếm:", err);
    return { songs: [], albums: [] };
  }
  
};
export const getSongsByGenre = async (genre_id) => {
  const res = await fetch(
    `http://localhost:8081/music_API/online_music/song/get_songs_by_genre.php?genre_id=${genre_id}`
  );

  const data = await res.json();
  if (!data.status) return [];

  return data.songs.map(song => ({
    id: song.song_id,
    title: song.title,
    artist: song.artist,              // chuẩn
    cover: song.cover?.replace("10.0.2.2", "localhost"),
    url: song.audio?.replace("10.0.2.2", "localhost"), // FE dùng field url để play
    duration: song.duration ?? 0,
  }));
};



