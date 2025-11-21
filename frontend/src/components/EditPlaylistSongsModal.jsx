import React, { useState } from 'react';
import { BsMusicNoteBeamed, BsX, BsTrash } from 'react-icons/bs';
import axios from 'axios';
import './EditPlaylistSongsModal.css';

export default function EditPlaylistSongsModal({ 
  isOpen, 
  onClose, 
  playlistId,
  songs,
  onSongsRemoved 
}) {
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleSong = (songId) => {
    setSelectedSongs(prev => 
      prev.includes(songId) 
        ? prev.filter(id => id !== songId)
        : [...prev, songId]
    );
  };

  const handleSelectAll = () => {
    if (selectedSongs.length === songs.length) {
      setSelectedSongs([]);
    } else {
      setSelectedSongs(songs.map(song => song.song_id));
    }
  };

  const handleRemoveSongs = async () => {
    if (selectedSongs.length === 0) return;

    const confirmMessage = selectedSongs.length === 1
      ? 'Bạn có chắc chắn muốn xóa bài hát này?'
      : `Bạn có chắc chắn muốn xóa ${selectedSongs.length} bài hát?`;

    if (!window.confirm(confirmMessage)) return;

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/playlists/${playlistId}/songs/remove-batch`,
        { song_ids: selectedSongs },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        if (onSongsRemoved) {
          onSongsRemoved();
        }
        setSelectedSongs([]);
        onClose();
      }
    } catch (error) {
      console.error('Error removing songs:', error);
      alert(error.response?.data?.message || 'Không thể xóa bài hát');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="edit-songs-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Chỉnh sửa playlist</h2>
          <button className="modal-close-button" onClick={onClose}>
            <BsX size={32} />
          </button>
        </div>

        {songs.length === 0 ? (
          <div className="modal-content">
            <div className="modal-empty-state">
              <BsMusicNoteBeamed size={48} />
              <p>Playlist chưa có bài hát nào</p>
            </div>
          </div>
        ) : (
          <>
            <div className="modal-toolbar">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={selectedSongs.length === songs.length}
                  onChange={handleSelectAll}
                />
                <span className="checkbox-label">
                  {selectedSongs.length === songs.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </span>
              </label>
              {selectedSongs.length > 0 && (
                <span className="selected-count">
                  Đã chọn {selectedSongs.length} bài
                </span>
              )}
            </div>

            <div className="modal-content">
              <div className="edit-songs-list">
                {songs.map((song) => {
                  const isSelected = selectedSongs.includes(song.song_id);
                  const coverUrl = song.cover_url && !song.cover_url.startsWith('http')
                    ? `http://localhost:5000${song.cover_url}`
                    : song.cover_url;

                  return (
                    <div
                      key={song.song_id}
                      className={`edit-song-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleToggleSong(song.song_id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSong(song.song_id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="edit-song-info">
                        {coverUrl ? (
                          <img src={coverUrl} alt={song.title} className="edit-song-cover" />
                        ) : (
                          <div className="edit-song-cover-placeholder">
                            <BsMusicNoteBeamed size={20} />
                          </div>
                        )}
                        <div className="edit-song-details">
                          <div className="edit-song-title">{song.title}</div>
                          <div className="edit-song-artist">{song.artist_name}</div>
                        </div>
                      </div>
                      <span className="edit-song-duration">{formatDuration(song.duration)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-button" 
                onClick={onClose}
                disabled={isDeleting}
              >
                Hủy
              </button>
              <button
                className="delete-button"
                onClick={handleRemoveSongs}
                disabled={selectedSongs.length === 0 || isDeleting}
              >
                <BsTrash size={18} />
                {isDeleting ? 'Đang xóa...' : `Xóa (${selectedSongs.length})`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
