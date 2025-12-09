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
  }, [searchQuery]);

  /** FIX MULTI ARTIST */
  const formatArtists = (artists) => {
    if (!artists) return "Không rõ nghệ sĩ";

    if (Array.isArray(artists)) {
      return artists.map(a => a.name).join(", ");
    }

    return artists; // fallback nếu PHP trả về text
  };

  const fetchRecommendedSongs = async () => {
    setIsLoadingSongs(true);
    try {
      const res = await axios.get(
        "http://localhost:8081/music_API/online_music/song/get_songs.php"
      );

      if (res.data.status && Array.isArray(res.data.songs)) {
        const formattedSongs = res.data.songs.map(song => ({
          song_id: song.song_id,
          title: song.title,
          /** FIX MULTI ARTIST */
          artist_display: formatArtists(song.artists), 
          artists: song.artists || [],
          cover_url: song.cover?.replace("10.0.2.2", "localhost") || null,
          audio_url: song.audio?.replace("10.0.2.2", "localhost") || null,
          duration: song.duration || 0
        }));

        setRecommendedSongs(formattedSongs);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setIsLoadingSongs(false);
    }
  };

  const searchSongs = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    setIsSearching(true);

    const filtered = recommendedSongs.filter(song => {
      const titleMatch = song.title.toLowerCase().includes(q);
      const artistMatch = song.artist_display.toLowerCase().includes(q);
      return titleMatch || artistMatch;
    });

    setSearchResults(filtered);
    setIsSearching(false);
  };

  const handleAddSong = async (songId) => {
    setAddingStates(prev => ({ ...prev, [songId]: true }));

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `http://localhost:5000/api/playlists/${playlistId}/songs`,
        { song_id: songId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        window.dispatchEvent(new Event("playlistUpdated"));
        onSongAdded && onSongAdded();
      }
    } catch (err) {
      console.error(err);
      alert("Không thể thêm bài hát");
    }

    setAddingStates(prev => ({ ...prev, [songId]: false }));
  };

  const formatDuration = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  /** 🟢 RENDER ITEM — ĐÃ FIX MULTI ARTIST */
  const renderSongItem = (song) => {
    const isAdding = addingStates[song.song_id];

    return (
      <div key={song.song_id} className="modal-song-item">
        <div className="modal-song-info">
          {song.cover_url ? (
            <img src={song.cover_url} alt={song.title} className="modal-song-cover" />
          ) : (
            <div className="modal-song-cover-placeholder">
              <BsMusicNoteBeamed size={20} />
            </div>
          )}

          <div className="modal-song-details">
            <div className="modal-song-title">{song.title}</div>

            {/* 🎉 MULTI ARTISTS SHOW HERE */}
            <div className="modal-song-artist">{song.artist_display}</div>
          </div>
        </div>

        <div className="modal-song-actions">
          <span className="modal-song-duration">
            {formatDuration(song.duration)}
          </span>
          <button
            className={`modal-add-button ${isAdding ? "added" : ""}`}
            onClick={() => handleAddSong(song.song_id)}
            disabled={isAdding}
          >
            {isAdding ? "✓" : "+"}
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  const displaySongs = searchQuery ? searchResults : recommendedSongs;

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
            <BsSearch className="search-icon" />
            <input
              type="text"
              placeholder="Tìm bài hát hoặc nghệ sĩ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-button" onClick={() => setSearchQuery("")}>
                <BsX />
              </button>
            )}
          </div>
        </div>

        <div className="modal-content">
          {isLoadingSongs ? (
            <p>Đang tải bài hát...</p>
          ) : displaySongs.length > 0 ? (
            <div className="modal-songs-list">
              {displaySongs.map(renderSongItem)}
            </div>
          ) : (
            <div className="modal-empty-state">
              <BsMusicNoteBeamed size={48} />
              <p>Không có kết quả phù hợp</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}