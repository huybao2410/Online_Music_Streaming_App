import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaMusic } from 'react-icons/fa';
import './ArtistsPage.css';

const PHP_API_URL = 'http://localhost:8081/music_API/online_music';

export default function ArtistsPage() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchArtists();
  }, []);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      
      // Lấy danh sách bài hát và extract nghệ sĩ
      const songsResponse = await axios.get(`${PHP_API_URL}/song/get_songs.php`);
      
      if (songsResponse.data.status === 'success' && Array.isArray(songsResponse.data.songs)) {
        const artistsMap = new Map();
        
        songsResponse.data.songs.forEach(song => {
          if (song.artist_id && song.artist) {
            if (!artistsMap.has(song.artist_id)) {
              artistsMap.set(song.artist_id, {
                artist_id: song.artist_id,
                name: song.artist,
                cover_url: song.cover || null,
                song_count: 0
              });
            }
            artistsMap.get(song.artist_id).song_count++;
          }
        });

        const artistsList = Array.from(artistsMap.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );
        
        setArtists(artistsList);
      }
    } catch (err) {
      console.error('Error fetching artists:', err);
      setError('Không thể tải danh sách nghệ sĩ');
    } finally {
      setLoading(false);
    }
  };

  const handleArtistClick = (artistId, artistName) => {
    navigate(`/artist/${artistId}`, { state: { artistName } });
  };

  const fixLocalUrl = (url) => {
    if (!url) return null;
    return url.replace('10.0.2.2', 'localhost');
  };

  if (loading) {
    return (
      <div className="artists-page">
        <div className="loading">Đang tải danh sách nghệ sĩ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="artists-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="artists-page">
      <div className="page-header">
        <h1>Nghệ Sĩ</h1>
        <p className="subtitle">{artists.length} nghệ sĩ</p>
      </div>

      <div className="artists-grid">
        {artists.map((artist) => (
          <div
            key={artist.artist_id}
            className="artist-card"
            onClick={() => handleArtistClick(artist.artist_id, artist.name)}
          >
            <div className="artist-image">
              {artist.cover_url ? (
                <img 
                  src={fixLocalUrl(artist.cover_url)} 
                  alt={artist.name}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="artist-placeholder" 
                style={{ display: artist.cover_url ? 'none' : 'flex' }}
              >
                <FaMusic size={48} />
              </div>
            </div>
            <div className="artist-info">
              <h3 className="artist-name">{artist.name}</h3>
              <p className="artist-songs">{artist.song_count} bài hát</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
