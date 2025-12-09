import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/music_API/online_music';
const API = "http://localhost:5000/api/search";

export const suggestions = async (query, limit = 5) => {
  const res = await axios.get(`${API}/suggestions`, { params: { query, limit } });
  return res.data;
};

export const searchAll = async (query, page = 1, pageSize = 20) => {
  const res = await axios.get(API, { params: { query, page, pageSize } });
  return res.data;
};

export const searchSongs = async (query) => {
  return axios.get(`${API_BASE_URL}/search/songs`, { params: { q: query } });
};


export const searchArtists = async (query) => {
  return axios.get(`${API_BASE_URL}/search/artists`, { params: { q: query } });
};

export const searchAlbums = async (query) => {
  return axios.get(`${API_BASE_URL}/search/albums`, { params: { q: query } });
};

export const searchPlaylists = async (query) => {
  return axios.get(`${API_BASE_URL}/search/playlists`, { params: { q: query } });
};