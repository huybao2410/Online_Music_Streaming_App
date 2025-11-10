import axios from "axios";

// Use PHP API for songs (existing system)
const PHP_API_URL = "http://localhost/music_API/online_music/song";
const NODE_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Get songs from PHP API (original system)
export const getSongs = async (params = {}) => {
  try {
    const response = await axios.get(`${PHP_API_URL}/get_songs.php`, { params });
    return response.data || [];
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài hát từ PHP API:", error);
    return [];
  }
};

// Node.js API functions (for future use)
export const getSongsFromNode = async (params = {}) => {
  try {
    const response = await axios.get(`${NODE_API_URL}/songs`, { params });
    
    // Process cover URLs to use full server path
    const songs = response.data.songs || response.data;
    return songs.map(song => ({
      ...song,
      cover: song.cover_url && !song.cover_url.startsWith('http')
        ? `http://localhost:5000${song.cover_url}`
        : song.cover_url,
      url: song.audio_url && !song.audio_url.startsWith('http')
        ? `http://localhost:5000${song.audio_url}`
        : song.audio_url,
      artist: song.artist_name || song.artist,
      title: song.title
    }));
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài hát từ Node API:", error);
    return [];
  }
};

export const getSongById = async (id) => {
  try {
    const response = await axios.get(`${NODE_API_URL}/songs/${id}`);
    const song = response.data.song;
    
    return {
      ...song,
      cover: song.cover_url && !song.cover_url.startsWith('http')
        ? `http://localhost:5000${song.cover_url}`
        : song.cover_url,
      url: song.audio_url && !song.audio_url.startsWith('http')
        ? `http://localhost:5000${song.audio_url}`
        : song.audio_url,
      artist: song.artist_name || song.artist
    };
  } catch (error) {
    console.error("Lỗi khi lấy thông tin bài hát:", error);
    return null;
  }
};

export const createSong = async (formData, token) => {
  try {
    const response = await axios.post(`${NODE_API_URL}/songs`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tạo bài hát:", error);
    throw error;
  }
};

export const updateSong = async (id, data, token) => {
  try {
    const response = await axios.put(`${NODE_API_URL}/songs/${id}`, data, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật bài hát:", error);
    throw error;
  }
};

export const deleteSong = async (id, token) => {
  try {
    const response = await axios.delete(`${NODE_API_URL}/songs/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa bài hát:", error);
    throw error;
  }
};

// Upsert (import) an external song into Node backend so we get a numeric id
export const upsertExternalSong = async ({ url, title, artist }) => {
  try {
    const response = await axios.post(`${NODE_API_URL}/songs/import`, {
      external_url: url,
      title,
      artist_name: artist,
    });
    return response.data?.song || null;
  } catch (error) {
    console.error('Lỗi khi import bài hát vào Node API:', error);
    throw error;
  }
};