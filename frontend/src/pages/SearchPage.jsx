import React, { useEffect, useState, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { searchAll } from "../services/searchService";
import { PlayerContext } from "../context/PLayerContext";
import { FaMusic, FaUser, FaCompactDisc } from "react-icons/fa";
import "./SearchPage.css";

export default function SearchPage() {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchParams] = useSearchParams();
  const { setCurrentSong, setPlaylist } = useContext(PlayerContext);
  const navigate = useNavigate();

  const query = searchParams.get("query");

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const result = await searchAll(query);
        if (result.success) {
          setSongs(result.songs || []);
          setArtists(result.artists || []);
          setAlbums(result.albums || []);
          if (result.songs && result.songs.length > 0) {
            setPlaylist(result.songs);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query, setPlaylist]);

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!query) return <div className="search-empty">Hãy nhập từ khóa để tìm kiếm</div>;
  if (loading) return <div className="search-loading">🔎 Đang tìm kiếm...</div>;

  const totalResults = songs.length + artists.length + albums.length;
  const filteredSongs = activeTab === 'all' || activeTab === 'songs' ? songs : [];
  const filteredArtists = activeTab === 'all' || activeTab === 'artists' ? artists : [];
  const filteredAlbums = activeTab === 'all' || activeTab === 'albums' ? albums : [];

  return (
    <div className="search-page">
      <div className="search-header">
        <h2>Kết quả cho "{query}"</h2>
        <p className="search-count">{totalResults} kết quả</p>
      </div>

      <div className="search-tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Tất cả
        </button>
        <button 
          className={`tab-btn ${activeTab === 'songs' ? 'active' : ''}`}
          onClick={() => setActiveTab('songs')}
        >
          <FaMusic /> Bài hát ({songs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'artists' ? 'active' : ''}`}
          onClick={() => setActiveTab('artists')}
        >
          <FaUser /> Nghệ sĩ ({artists.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'albums' ? 'active' : ''}`}
          onClick={() => setActiveTab('albums')}
        >
          <FaCompactDisc /> Album ({albums.length})
        </button>
      </div>

      <div className="search-results">
        {/* Artists */}
        {filteredArtists.length > 0 && (
          <div className="result-section">
            <h3 className="section-title"><FaUser /> Nghệ sĩ</h3>
            <div className="artists-grid">
              {filteredArtists.map((artist) => (
                <div 
                  key={artist.id} 
                  className="artist-card" 
                  onClick={() => navigate(`/artist/${artist.id}`)}
                >
                  <div className="artist-avatar">
                    {artist.avatar_url ? (
                      <img 
                        src={artist.avatar_url.replace('10.0.2.2', 'localhost')} 
                        alt={artist.name} 
                      />
                    ) : (
                      <div className="avatar-placeholder"><FaUser /></div>
                    )}
                  </div>
                  <div className="artist-info">
                    <h4>{artist.name}</h4>
                    <p>Nghệ sĩ</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Albums */}
        {filteredAlbums.length > 0 && (
          <div className="result-section">
            <h3 className="section-title"><FaCompactDisc /> Album</h3>
            <div className="albums-grid">
              {filteredAlbums.map((album, idx) => (
                <div key={`album-${idx}`} className="album-card">
                  <div className="album-cover">
                    {album.cover_url ? (
                      <img 
                        src={album.cover_url.replace('10.0.2.2', 'localhost')} 
                        alt={album.name} 
                      />
                    ) : (
                      <div className="cover-placeholder"><FaCompactDisc /></div>
                    )}
                  </div>
                  <div className="album-info">
                    <h4>{album.name}</h4>
                    <p>{album.artist_name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Songs */}
        {filteredSongs.length > 0 && (
          <div className="result-section songs-section">
            <h3 className="section-title"><FaMusic /> Bài hát</h3>
            <div className="songs-list">
              {filteredSongs.map((song, idx) => {
                // Format song object cho PlayerContext
                // Replace 10.0.2.2 (Android emulator) with localhost for web
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
                
                return (
                <div 
                  key={song.id} 
                  className="song-row" 
                  onClick={() => { 
                    setCurrentSong(formattedSong);
                    // Format all songs for playlist
                    const formattedPlaylist = songs.map(s => ({
                      id: s.id,
                      title: s.title,
                      artist: s.artist_name,
                      cover: s.cover_url 
                        ? s.cover_url.replace('10.0.2.2', 'localhost')
                        : 'http://localhost:8081/music_API/online_music/cover/default.png',
                      url: s.audio_url
                        ? s.audio_url.replace('10.0.2.2', 'localhost')
                        : '',
                      duration: s.duration
                    }));
                    setPlaylist(formattedPlaylist); 
                  }}
                >
                  <div className="song-index">{idx + 1}</div>
                  <div className="song-cover">
                    {song.cover_url ? (
                      <img 
                        src={song.cover_url.replace('10.0.2.2', 'localhost')} 
                        alt={song.title} 
                      />
                    ) : (
                      <div className="cover-placeholder"><FaMusic /></div>
                    )}
                  </div>
                  <div className="song-details">
                    <div className="song-title">{song.title}</div>
                    <div className="song-artist">{song.artist_name}</div>
                  </div>
                  {song.genre_name && (
                    <div className="song-genre">{song.genre_name}</div>
                  )}
                  {song.duration && (
                    <div className="song-duration">{formatDuration(song.duration)}</div>
                  )}
                </div>
              );
              })}
            </div>
          </div>
        )}

        {totalResults === 0 && (
          <div className="no-results">
            <FaMusic size={48} />
            <h3>Không tìm thấy kết quả</h3>
            <p>Hãy thử với từ khóa khác</p>
          </div>
        )}
      </div>
    </div>
  );
}
