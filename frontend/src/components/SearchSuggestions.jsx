// frontend/src/components/SearchSuggestions.jsx
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaMusic, FaUser, FaCompactDisc } from 'react-icons/fa';
import { PlayerContext } from '../context/PLayerContext';
import './SearchSuggestions.css';

export default function SearchSuggestions({ suggestions, onClose, onSelect }) {
  const navigate = useNavigate();
  const { setCurrentSong } = useContext(PlayerContext);

  if (!suggestions) return null;

  const { songs = [], artists = [], albums = [] } = suggestions;
  const hasResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

  if (!hasResults) return null;

  const handleSongClick = (song) => {
    onSelect && onSelect();
    
    // Format song cho PlayerContext - Replace 10.0.2.2 with localhost
    const formattedSong = {
      id: song.id,
      title: song.title,
      artist: song.artist_name,
      cover: song.cover_url 
        ? song.cover_url.replace('10.0.2.2', 'localhost')
        : 'http://localhost:8081/music_API/online_music/cover/default.png',
      url: song.audio_url
        ? song.audio_url.replace('10.0.2.2', 'localhost')
        : '',
      duration: song.duration
    };
    
    setCurrentSong(formattedSong);
  };

  const handleArtistClick = (artist) => {
    onSelect && onSelect();
    navigate(`/artist/${artist.id}`);
  };

  const handleAlbumClick = (album) => {
    onSelect && onSelect();
    // Navigate to album detail if you have that route
    console.log('View album:', album);
  };

  return (
    <div className="search-suggestions">
      <div className="suggestions-content">
        {/* Songs */}
        {songs.length > 0 && (
          <div className="suggestion-section">
            <h4 className="suggestion-title">
              <FaMusic /> Bài hát
            </h4>
            <div className="suggestion-list">
              {songs.map((song) => (
                <div
                  key={`song-${song.id}`}
                  className="suggestion-item"
                  onClick={() => handleSongClick(song)}
                >
                  <div className="suggestion-image">
                    {song.cover_url ? (
                      <img 
                        src={song.cover_url.replace('10.0.2.2', 'localhost')} 
                        alt={song.title} 
                      />
                    ) : (
                      <div className="suggestion-placeholder">
                        <FaMusic />
                      </div>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <div className="suggestion-name">{song.title}</div>
                    <div className="suggestion-meta">{song.artist_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Artists */}
        {artists.length > 0 && (
          <div className="suggestion-section">
            <h4 className="suggestion-title">
              <FaUser /> Nghệ sĩ
            </h4>
            <div className="suggestion-list">
              {artists.map((artist) => (
                <div
                  key={`artist-${artist.id}`}
                  className="suggestion-item"
                  onClick={() => handleArtistClick(artist)}
                >
                  <div className="suggestion-image circular">
                    {artist.avatar_url ? (
                      <img 
                        src={artist.avatar_url.replace('10.0.2.2', 'localhost')} 
                        alt={artist.name} 
                      />
                    ) : (
                      <div className="suggestion-placeholder">
                        <FaUser />
                      </div>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <div className="suggestion-name">{artist.name}</div>
                    <div className="suggestion-meta">Nghệ sĩ</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Albums */}
        {albums.length > 0 && (
          <div className="suggestion-section">
            <h4 className="suggestion-title">
              <FaCompactDisc /> Album
            </h4>
            <div className="suggestion-list">
              {albums.map((album, index) => (
                <div
                  key={`album-${index}`}
                  className="suggestion-item"
                  onClick={() => handleAlbumClick(album)}
                >
                  <div className="suggestion-image">
                    {album.cover_url ? (
                      <img 
                        src={album.cover_url.replace('10.0.2.2', 'localhost')} 
                        alt={album.name} 
                      />
                    ) : (
                      <div className="suggestion-placeholder">
                        <FaCompactDisc />
                      </div>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <div className="suggestion-name">{album.name}</div>
                    <div className="suggestion-meta">{album.artist_name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
