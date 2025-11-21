import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAddCircleOutline } from 'react-icons/io5';
import { RiPlayListLine } from 'react-icons/ri';
import { BsMusicNoteBeamed } from 'react-icons/bs';
import { getMyPlaylists, createPlaylist } from '../services/playlistService';
import './LibraryScreen.css';

export default function LibraryScreen() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    try {
      const response = await getMyPlaylists();
      if (response.success) {
        setPlaylists(response.playlists);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const response = await createPlaylist({ 
        name: newPlaylistName.trim(),
        is_public: false 
      });
      
      if (response.success) {
        setShowCreateModal(false);
        setNewPlaylistName('');
        fetchPlaylists();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Lỗi khi tạo playlist');
    } finally {
      setIsCreating(false);
    }
  };

  const renderPlaylistCover = (playlist) => {
    const coverImages = playlist.cover_images || [];
    
    if (playlist.cover_url) {
      return <img src={playlist.cover_url} alt={playlist.name} />;
    }
    
    if (coverImages.length >= 4) {
      return (
        <div className="playlist-grid-cover">
          {coverImages.slice(0, 4).map((img, idx) => (
            <img 
              key={idx} 
              src={img?.replace('10.0.2.2', 'localhost') || ''} 
              alt="" 
            />
          ))}
        </div>
      );
    }
    
    if (coverImages.length > 0) {
      return <img src={coverImages[0]?.replace('10.0.2.2', 'localhost')} alt={playlist.name} />;
    }
    
    return (
      <div className="playlist-cover-placeholder">
        <RiPlayListLine size={60} />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="library-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  return (
    <div className="library-screen">
      <div className="library-header">
        <h1>Thư viện của bạn</h1>
      </div>

      <div className="playlists-grid">
        {/* Create New Playlist Card */}
        <div 
          className="playlist-card create-card"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="playlist-cover">
            <div className="create-placeholder">
              <IoAddCircleOutline size={50} />
            </div>
          </div>
          <div className="playlist-info">
            <h3>Tạo danh sách phát</h3>
          </div>
        </div>

        {/* Existing Playlists */}
        {playlists.map((playlist) => (
          <div
            key={playlist.playlist_id}
            className="playlist-card"
            onClick={() => navigate(`/playlist/${playlist.playlist_id}`)}
          >
            <div className="playlist-cover">
              {renderPlaylistCover(playlist)}
            </div>
            <div className="playlist-info">
              <h3>{playlist.name}</h3>
              <p>{playlist.song_count || 0} bài hát</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Tạo playlist mới</h2>
            <form onSubmit={handleCreatePlaylist}>
              <input
                type="text"
                placeholder="Nhập tên playlist"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                maxLength={100}
                autoFocus
              />
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowCreateModal(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn-create"
                  disabled={!newPlaylistName.trim() || isCreating}
                >
                  {isCreating ? 'Đang tạo...' : 'Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
