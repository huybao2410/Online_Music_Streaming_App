import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/music_API/online_music';

export const searchSongs = async (query) => {
  return axios.get(`${API_BASE_URL}/search/songs`, { params: { q: query } });
};
export const searchAll = async (query) => {
  return axios.get(`${API_BASE_URL}/search/all`, { params: { q: query } });
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
