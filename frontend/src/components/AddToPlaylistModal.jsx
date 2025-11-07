import { useEffect, useState } from 'react';
import { getMyPlaylists, addSongToPlaylist, createPlaylist } from '../services/playlistService';
import './AddToPlaylistModal.css';
import { upsertExternalSong } from '../services/songService';

function AddToPlaylistModal({ isOpen, onClose, song }) {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPlaylists();
    }
  }, [isOpen]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const data = await getMyPlaylists();
      console.log('Playlists data:', data);
      
      // Handle different response formats
      if (Array.isArray(data)) {
        setPlaylists(data);
      } else if (data && Array.isArray(data.playlists)) {
        setPlaylists(data.playlists);
      } else if (data && typeof data === 'object') {
        // If data is an object, try to extract playlists array
        const playlistArray = Object.values(data).filter(item => 
          item && typeof item === 'object' && item.id
        );
        setPlaylists(playlistArray);
      } else {
        setPlaylists([]);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setPlaylists([]);
      alert('Không thể tải danh sách playlist');
    } finally {
      setLoading(false);
    }
  };

  const deriveSongId = (s) => {
    if (!s) return null;
    // Prefer explicit numeric id from Node API
    if (typeof s.id === 'number') return s.id;
    // Some APIs may use song_id
    if (typeof s.song_id === 'number') return s.song_id;
    // If still missing, cannot add to playlist (PHP source lacks id)
    return null;
  };

  const handleAddToPlaylist = async (playlistId) => {
    let sid = deriveSongId(song);
    if (!sid) {
      // Try to import the external song into Node backend to get an id
      try {
        const created = await upsertExternalSong({
          url: song.url,
          title: song.title,
          artist: song.artist,
        });
        sid = created?.id;
      } catch (err) {
        console.warn('Import external song failed:', err);
      }
    }
    if (!sid) {
      alert('Không thể xác định ID bài hát để thêm vào playlist');
      return;
    }

    try {
      const resp = await addSongToPlaylist(playlistId, sid);
      console.log('Add song response:', resp);
      alert(resp?.message || 'Đã thêm bài hát vào playlist!');
      onClose();
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      alert(error?.response?.data?.message || 'Không thể thêm bài hát vào playlist');
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) {
      alert('Vui lòng nhập tên playlist');
      return;
    }

    try {
      setCreating(true);
      const response = await createPlaylist({
        name: newPlaylistName,
        description: ''
      });
      console.log('Create playlist response:', response);
      const playlistId = response?.playlist?.id || response?.id;
      let sid = deriveSongId(song);
      if (!sid) {
        try {
          const created = await upsertExternalSong({
            url: song.url,
            title: song.title,
            artist: song.artist,
          });
          sid = created?.id;
        } catch (err) {
          console.warn('Import external song failed:', err);
        }
      }
      if (!playlistId) {
        alert('Tạo playlist thành công nhưng không lấy được ID playlist.');
        return;
      }
      if (!sid) {
        alert('Tạo playlist thành công. Tuy nhiên bài hát không có ID để thêm (hãy dùng danh sách từ Node API).');
      } else {
        try {
          const addResp = await addSongToPlaylist(playlistId, sid);
          alert(addResp?.message || 'Đã tạo playlist và thêm bài hát!');
        } catch (addErr) {
          console.error('Add after create error:', addErr);
          alert(addErr?.response?.data?.message || 'Tạo playlist thành công nhưng thêm bài hát thất bại');
        }
      }
      onClose();
      setNewPlaylistName('');
      setShowCreateNew(false);
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert(error?.response?.data?.message || 'Không thể tạo playlist mới');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="add-to-playlist-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Thêm vào playlist</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {song && (
          <div className="song-info">
            {song.cover && <img src={song.cover} alt={song.title} />}
            <div>
              <div className="song-title">{song.title}</div>
              <div className="song-artist">{song.artist}</div>
            </div>
          </div>
        )}

        <div className="modal-content">
          {loading ? (
            <div className="loading">Đang tải...</div>
          ) : (
            <>
              {!showCreateNew ? (
                <>
                  <div className="playlists-list">
                    {!Array.isArray(playlists) || playlists.length === 0 ? (
                      <div className="empty-message">
                        Bạn chưa có playlist nào
                      </div>
                    ) : (
                      playlists.map((playlist) => (
                        <div
                          key={playlist.id}
                          className="playlist-item"
                          onClick={() => handleAddToPlaylist(playlist.id)}
                        >
                          <div className="playlist-info">
                            {playlist.cover_url ? (
                              <img src={playlist.cover_url} alt={playlist.name} />
                            ) : (
                              <div className="playlist-placeholder">♫</div>
                            )}
                            <div>
                              <div className="playlist-name">{playlist.name}</div>
                              <div className="playlist-count">
                                {playlist.song_count || 0} bài hát
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    className="create-new-btn"
                    onClick={() => setShowCreateNew(true)}
                  >
                    + Tạo playlist mới
                  </button>
                </>
              ) : (
                <form onSubmit={handleCreatePlaylist} className="create-form">
                  <input
                    type="text"
                    placeholder="Tên playlist"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    autoFocus
                  />
                  <div className="form-buttons">
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => {
                        setShowCreateNew(false);
                        setNewPlaylistName('');
                      }}
                    >
                      Hủy
                    </button>
                    <button type="submit" className="submit-btn" disabled={creating}>
                      {creating ? 'Đang tạo...' : 'Tạo và thêm bài hát'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddToPlaylistModal;
