import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaHeart, FaRegHeart, FaSearch } from 'react-icons/fa';
import './ArtistSelectionScreen.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const PHP_API_URL = process.env.REACT_APP_PHP_API_URL || 'http://localhost:8081/music_API/online_music';

export default function ArtistSelectionScreen() {
  const navigate = useNavigate();
  const [artists, setArtists] = useState([]);
  const [filteredArtists, setFilteredArtists] = useState([]);
  const [selectedArtists, setSelectedArtists] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${PHP_API_URL}/artist/get_artists.php`);
      
      if (response.data.status === 'success' && response.data.artists) {
        setArtists(response.data.artists);
        setFilteredArtists(response.data.artists);
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError('Không thể tải danh sách nghệ sĩ');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    const filtered = artists.filter(artist =>
      artist.name.toLowerCase().includes(value.toLowerCase()) ||
      (artist.bio && artist.bio.toLowerCase().includes(value.toLowerCase()))
    );
    setFilteredArtists(filtered);
  };

  const toggleSelection = (artist) => {
    if (selectedArtists.find(a => a.artist_id === artist.artist_id)) {
      setSelectedArtists(selectedArtists.filter(a => a.artist_id !== artist.artist_id));
    } else {
      setSelectedArtists([...selectedArtists, artist]);
    }
  };

  const handleContinue = async () => {
    if (selectedArtists.length < 3) {
      setError('Vui lòng chọn ít nhất 3 nghệ sĩ!');
      return;
    }

    try {
      setSaving(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const artistIds = selectedArtists.map(a => a.artist_id);
      
      await axios.post(
        `${API_URL}/favorite-artists/bulk`,
        { artist_ids: artistIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to home
      navigate('/home');
    } catch (err) {
      console.error('Error saving favorites:', err);
      setError('Không thể lưu nghệ sĩ yêu thích. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="artist-selection-screen">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải nghệ sĩ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="artist-selection-screen">
      <div className="artist-selection-header">
        <h1>Chọn nghệ sĩ yêu thích của bạn</h1>
        <p>Hãy chọn ít nhất 3 nghệ sĩ để cá nhân hóa trải nghiệm của bạn</p>
      </div>

      <div className="search-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="artists-grid">
        {filteredArtists.map(artist => {
          const isSelected = selectedArtists.find(a => a.artist_id === artist.artist_id);
          return (
            <div
              key={artist.artist_id}
              className={`artist-card ${isSelected ? 'selected' : ''}`}
              onClick={() => toggleSelection(artist)}
            >
              <div className="artist-avatar">
                <img 
                  src={artist.avatar_url ? `${PHP_API_URL}/${artist.avatar_url}` : '/default-avatar.png'} 
                  alt={artist.name}
                  onError={(e) => e.target.src = '/default-avatar.png'}
                />
                <div className="favorite-icon">
                  {isSelected ? (
                    <FaHeart className="icon-filled" />
                  ) : (
                    <FaRegHeart className="icon-outline" />
                  )}
                </div>
              </div>
              <div className="artist-name">{artist.name}</div>
            </div>
          );
        })}
      </div>

      {filteredArtists.length === 0 && (
        <div className="no-results">
          <p>Không tìm thấy nghệ sĩ nào</p>
        </div>
      )}

      <div className="footer-actions">
        <div className="selection-count">
          Đã chọn: <strong>{selectedArtists.length}</strong> nghệ sĩ
        </div>
        <button
          className="continue-btn"
          onClick={handleContinue}
          disabled={selectedArtists.length < 3 || saving}
        >
          {saving ? 'Đang lưu...' : 'Tiếp tục'}
        </button>
      </div>
    </div>
  );
}
