// playlistService.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/playlists';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

// Get all user's playlists
export const getMyPlaylists = async () => {
  try {
    const response = await axios.get(`${API_URL}/my-playlists`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching playlists:', error);
    throw error;
  }
};

// Get playlist by ID
export const getPlaylistById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error fetching playlist:', error);
    throw error;
  }
};

// Create new playlist
export const createPlaylist = async (playlistData) => {
  try {
    const response = await axios.post(API_URL, playlistData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error creating playlist:', error);
    throw error;
  }
};

// Update playlist
export const updatePlaylist = async (id, playlistData) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, playlistData, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error updating playlist:', error);
    throw error;
  }
};

// Delete playlist
export const deletePlaylist = async (id) => {
  try {
    const response = await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
    return response.data;
  } catch (error) {
    console.error('Error deleting playlist:', error);
    throw error;
  }
};

// Add song to playlist
export const addSongToPlaylist = async (playlistId, songId) => {
  try {
    const response = await axios.post(
      `${API_URL}/${playlistId}/songs`,
      { song_id: songId },
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    throw error;
  }
};

// Remove song from playlist
export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    const response = await axios.delete(
      `${API_URL}/${playlistId}/songs/${songId}`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    throw error;
  }
};

export default {
  getMyPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist
};
