// frontend/src/services/api.js
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8081/music_API/online_music';

const instance = axios.create({
  baseURL: API,
  headers: { 'Content-Type': 'application/json' }
});

// attach token automatically
instance.interceptors.request.use(config => {
  const token = localStorage.getItem('token'); // đơn giản - xem lưu trữ an toàn bên dưới
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default instance;
