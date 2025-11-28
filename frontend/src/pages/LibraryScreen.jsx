import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoAddCircleOutline } from 'react-icons/io5';
import { RiPlayListLine } from 'react-icons/ri';
import { getMyPlaylists } from '../services/playlistService';
// 1. Import Component Modal mới
import CreatePlaylistModal from '../components/CreatePlaylistModal'; 
import './LibraryScreen.css';

export default function LibraryScreen() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Không cần state cho form cũ nữa (newPlaylistName, isCreating) vì Modal mới tự xử lý

  useEffect(() => {
    fetchPlaylists();
  }, []);

  // Lắng nghe sự kiện cập nhật playlist để reload danh sách
  useEffect(() => {
    const handlePlaylistUpdate = () => {
      console.log("LibraryScreen: Playlist changed, reloading...");
      fetchPlaylists();
    };

    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    return () => {
      window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
    };
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
        {/* Nút tạo playlist */}
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

        {/* Danh sách playlist */}
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

      {/* 2. Sử dụng Component Modal mới thay cho form cũ */}
      <CreatePlaylistModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchPlaylists()} 
      />
    </div>
  );
}