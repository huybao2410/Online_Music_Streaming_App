import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8081/music_API/online_music';

export const getAllGenres = async () => {
  return axios.get(`${API_BASE_URL}/genres`);
};

export const getGenres = getAllGenres;

export const getGenreById = async (genreId) => {
  return axios.get(`${API_BASE_URL}/genres/${genreId}`);
};

export const createGenre = async (genreData) => {
  return axios.post(`${API_BASE_URL}/genres`, genreData);
};

export const updateGenre = async (genreId, genreData) => {
  return axios.put(`${API_BASE_URL}/genres/${genreId}`, genreData);
};

export const deleteGenre = async (genreId) => {
  return axios.delete(`${API_BASE_URL}/genres/${genreId}`);
};
