import React, { useState, useEffect, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaPlay, FaPause, FaHeart, FaRegHeart, FaClock } from 'react-icons/fa';
import { PlayerContext } from '../context/PLayerContext';
import './ArtistDetailPage.css';

const PHP_API_URL = 'http://localhost:8081/music_API/online_music';

export default function ArtistDetailPage() {
  const { artistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentSong, isPlaying, playSong, togglePlay } = useContext(PlayerContext);
  
  const [artistName, setArtistName] = useState(location.state?.artistName || '');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetchArtistSongs();
    loadFavorites();
  }, [artistId]);

  const loadFavorites = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(favs);
    } catch (err) {
      setFavorites([]);
    }
  };

  const fetchArtistSongs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${PHP_API_URL}/song/get_songs.php`);
      
      if (response.data.status === 'success' && Array.isArray(response.data.songs)) {
        const artistSongs = response.data.songs.filter(
          song => song.artist_id && song.artist_id.toString() === artistId.toString()
        );
        
        if (artistSongs.length > 0 && !artistName) {
          setArtistName(artistSongs[0].artist);
        }
        
        setSongs(artistSongs);
      }
    } catch (err) {
      console.error('Error fetching artist songs:', err);
      setError('Không thể tải bài hát của nghệ sĩ');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaySong = (song, index) => {
    const songData = {
      id: song.song_id,
      song_id: song.song_id,
      title: song.title,
      artist: song.artist,
      artist_name: song.artist,
      cover_url: fixLocalUrl(song.cover),
      audio_url: fixLocalUrl(song.audio || song.url),
      duration: song.duration || 0
    };

    playSong(songData, songs.map(s => ({
      id: s.song_id,
      song_id: s.song_id,
      title: s.title,
      artist: s.artist,
      artist_name: s.artist,
      cover_url: fixLocalUrl(s.cover),
      audio_url: fixLocalUrl(s.audio || s.url),
      duration: s.duration || 0
    })));
  };

  const handlePlayAll = () => {
    if (songs.length > 0) {
      handlePlaySong(songs[0], 0);
    }
  };

  const toggleLike = (songId, e) => {
    e.stopPropagation();
    
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      const isLiked = favs.includes(songId);
      
      let newFavorites;
      if (isLiked) {
        newFavorites = favs.filter(id => id !== songId);
      } else {
        newFavorites = [...favs, songId];
      }
      
      localStorage.setItem('favorites', JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const isLiked = (songId) => {
    return favorites.includes(songId);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fixLocalUrl = (url) => {
    if (!url) return '';
    return url.replace('10.0.2.2', 'localhost');
  };

  const artistCover = songs.length > 0 ? fixLocalUrl(songs[0].cover) : null;

  if (loading) {
    return (
      <div className="artist-detail-page">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="artist-detail-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="artist-detail-page">
      {/* Artist Header */}
      <div className="artist-header">
        <div className="artist-header-bg">
          {artistCover && (
            <img src={artistCover} alt={artistName} className="bg-image" />
          )}
          <div className="bg-overlay"></div>
        </div>
        
        <div className="artist-header-content">
          <div className="artist-avatar">
            {artistCover ? (
              <img src={artistCover} alt={artistName} />
            ) : (
              <div className="avatar-placeholder">🎤</div>
            )}
          </div>
          
          <div className="artist-info">
            <p className="artist-label">Nghệ sĩ</p>
            <h1 className="artist-name">{artistName}</h1>
            <p className="artist-stats">{songs.length} bài hát</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="artist-controls">
        <button className="play-all-btn" onClick={handlePlayAll}>
          {isPlaying && currentSong?.artist === artistName ? (
            <>
              <FaPause size={24} />
              <span>Tạm dừng</span>
            </>
          ) : (
            <>
              <FaPlay size={24} />
              <span>Phát tất cả</span>
            </>
          )}
        </button>
      </div>

      {/* Songs List */}
      <div className="songs-section">
        <div className="songs-header">
          <div className="col-number">#</div>
          <div className="col-title">Tiêu đề</div>
          <div className="col-duration"><FaClock /></div>
        </div>

        <div className="songs-list">
          {songs.map((song, index) => {
            const isCurrentSong = currentSong?.song_id === song.song_id;
            const isPlayingNow = isCurrentSong && isPlaying;

            return (
              <div
                key={song.song_id}
                className={`song-row ${isCurrentSong ? 'active' : ''}`}
                onClick={() => handlePlaySong(song, index)}
              >
                <div className="col-number">
                  {isPlayingNow ? (
                    <div className="playing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <span className="number">{index + 1}</span>
                  )}
                </div>

                <div className="col-title">
                  <img 
                    src={fixLocalUrl(song.cover)} 
                    alt={song.title}
                    className="song-cover"
                  />
                  <div className="song-info">
                    <div className={`song-title ${isCurrentSong ? 'playing' : ''}`}>
                      {song.title}
                    </div>
                    <div className="song-artist">{song.artist}</div>
                  </div>
                </div>

                <div className="col-actions">
                  <button
                    className={`like-btn ${isLiked(song.song_id) ? 'liked' : ''}`}
                    onClick={(e) => toggleLike(song.song_id, e)}
                  >
                    {isLiked(song.song_id) ? (
                      <FaHeart size={16} />
                    ) : (
                      <FaRegHeart size={16} />
                    )}
                  </button>
                </div>

                <div className="col-duration">
                  {formatDuration(song.duration)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
