import React, { useState, useEffect } from 'react';
import { BsMusicNoteBeamed, BsSearch, BsX } from 'react-icons/bs';
import axios from 'axios';
import './AddSongToPlaylistModal.css';

export default function AddSongToPlaylistModal({ 
  isOpen, 
  onClose, 
  playlistId, 
  onSongAdded 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recommendedSongs, setRecommendedSongs] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [addingStates, setAddingStates] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchRecommendedSongs();
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.length > 0) {
      const timer = setTimeout(() => {
        searchSongs();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fetchRecommendedSongs = async () => {
    setIsLoadingSongs(true);
    try {
      // Lấy tất cả bài hát từ PHP API
      const response = await axios.get(
        'http://localhost:8081/music_API/online_music/song/get_songs.php'
      );

      if (response.data.status === 'success' && Array.isArray(response.data.songs)) {
        // Format songs để match với cấu trúc hiện tại
        const formattedSongs = response.data.songs.map(song => ({
          song_id: song.song_id,
          title: song.title,
          artist_name: song.artist,
          cover_url: song.cover ? song.cover.replace('10.0.2.2', 'localhost') : null,
          audio_url: song.audio ? song.audio.replace('10.0.2.2', 'localhost') : null,
          duration: song.duration || 0
        }));
        setRecommendedSongs(formattedSongs);
      }
    } catch (error) {
      console.error('Error fetching recommended songs:', error);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const searchSongs = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Tìm kiếm trong danh sách recommendedSongs (đã load tất cả)
      const query = searchQuery.toLowerCase().trim();
      const filtered = recommendedSongs.filter(song => 
        song.title.toLowerCase().includes(query) ||
        song.artist_name.toLowerCase().includes(query)
      );
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching songs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSong = async (songId) => {
    setAddingStates(prev => ({ ...prev, [songId]: true }));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/playlists/${playlistId}/songs`,
        { song_id: songId },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Show success feedback
        setTimeout(() => {
          setAddingStates(prev => ({ ...prev, [songId]: false }));
        }, 1000);
        
        // Trigger event to reload sidebar playlists
        window.dispatchEvent(new Event('playlistUpdated'));
        
        if (onSongAdded) {
          onSongAdded();
        }
      }
    } catch (error) {
      console.error('Error adding song:', error);
      alert(error.response?.data?.message || 'Không thể thêm bài hát');
      setAddingStates(prev => ({ ...prev, [songId]: false }));
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderSongItem = (song) => {
    const isAdding = addingStates[song.song_id];
    const coverUrl = song.cover_url && !song.cover_url.startsWith('http')
      ? `http://localhost:5000${song.cover_url}`
      : song.cover_url;

    return (
      <div key={song.song_id} className="modal-song-item">
        <div className="modal-song-info">
          {coverUrl ? (
            <img src={coverUrl} alt={song.title} className="modal-song-cover" />
          ) : (
            <div className="modal-song-cover-placeholder">
              <BsMusicNoteBeamed size={20} />
            </div>
          )}
          <div className="modal-song-details">
            <div className="modal-song-title">{song.title}</div>
            <div className="modal-song-artist">{song.artist_name}</div>
          </div>
        </div>
        <div className="modal-song-actions">
          <span className="modal-song-duration">{formatDuration(song.duration)}</span>
          <button
            className={`modal-add-button ${isAdding ? 'added' : ''}`}
            onClick={() => handleAddSong(song.song_id)}
            disabled={isAdding}
          >
            {isAdding ? '✓' : '+'}
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const displaySongs = searchQuery.length > 0 ? searchResults : recommendedSongs;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-song-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Thêm bài hát vào playlist</h2>
          <button className="modal-close-button" onClick={onClose}>
            <BsX size={32} />
          </button>
        </div>

        <div className="modal-search-container">
          <div className="modal-search-box">
            <BsSearch size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm bài hát hoặc nghệ sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button 
                className="clear-search-button"
                onClick={() => setSearchQuery('')}
              >
                <BsX size={20} />
              </button>
            )}
          </div>
        </div>

        <div className="modal-content">
          {isLoadingSongs ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <p>Đang tải danh sách bài hát...</p>
            </div>
          ) : isSearching ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <p>Đang tìm kiếm...</p>
            </div>
          ) : displaySongs.length > 0 ? (
            <>
              <div className="modal-section-title">
                {searchQuery 
                  ? `Kết quả tìm kiếm: ${displaySongs.length} bài hát` 
                  : `Tất cả bài hát (${recommendedSongs.length})`
                }
              </div>
              <div className="modal-songs-list">
                {displaySongs.map(song => renderSongItem(song))}
              </div>
            </>
          ) : searchQuery ? (
            <div className="modal-empty-state">
              <BsMusicNoteBeamed size={48} />
              <p>Không tìm thấy bài hát nào phù hợp với "{searchQuery}"</p>
            </div>
          ) : (
            <div className="modal-empty-state">
              <BsMusicNoteBeamed size={48} />
              <p>Không có bài hát nào</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
