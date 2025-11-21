// PlaylistDetail.jsx
import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsMusicNoteBeamed, BsThreeDots, BsShuffle, BsPlus } from "react-icons/bs";
import { AiOutlineDelete } from "react-icons/ai";
import { BiPlay, BiPause, BiTime } from "react-icons/bi";
import { RiPlayListLine } from "react-icons/ri";
import { FiEdit2 } from "react-icons/fi";
import axios from "axios";
import { PlayerContext } from "../context/PLayerContext";
import AddSongToPlaylistModal from "../components/AddSongToPlaylistModal";
import EditPlaylistSongsModal from "../components/EditPlaylistSongsModal";
import "./PlaylistDetail.css";

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentSong, setCurrentSong, setPlaylist: setPlayerPlaylist, isPlaying } = useContext(PlayerContext);
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwner, setIsOwner] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchPlaylistDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchPlaylistDetail = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      const response = await axios.get(
        `http://localhost:5000/api/playlists/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        const playlistData = response.data.playlist;
        console.log('Raw playlist data:', playlistData);
        
        // Process cover URLs to use full server path
        if (playlistData.cover_url && !playlistData.cover_url.startsWith('http')) {
          playlistData.cover_url = `http://localhost:5000${playlistData.cover_url}`;
        }
        
        // Process song cover and audio URLs
        if (playlistData.songs) {
          playlistData.songs = playlistData.songs.map(song => {
            console.log('Processing song:', song.title, 'cover:', song.cover_url, 'audio:', song.audio_url);
            let coverUrl = song.cover_url;
            // Handle both Node.js backend covers and PHP API covers
            if (coverUrl && !coverUrl.startsWith('http')) {
              if (coverUrl.startsWith('/uploads')) {
                coverUrl = `http://localhost:5000${coverUrl}`;
              } else {
                coverUrl = `http://localhost:8081/music_API/online_music/${coverUrl}`;
              }
            }
            
            return {
              ...song,
              cover_url: coverUrl
            };
          });
        }
        
        setPlaylist(playlistData);
        // Check if current user is owner
        const userId = JSON.parse(atob(token.split('.')[1])).id;
        setIsOwner(playlistData.user_id === userId);
      }
    } catch (err) {
      console.error("Error fetching playlist:", err);
      setError(err.response?.data?.message || "Không thể tải playlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa playlist này?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/playlists/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert("Xóa playlist thành công");
        navigate("/profile");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa playlist");
    }
  };

  const handleRemoveSong = async (songId) => {
    if (!window.confirm("Xóa bài hát này khỏi playlist?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/playlists/${id}/songs/${songId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        // Refresh playlist
        fetchPlaylistDetail();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Lỗi khi xóa bài hát");
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!playlist?.songs) return "0:00";
    const total = playlist.songs.reduce((sum, song) => sum + song.duration, 0);
    const hours = Math.floor(total / 3600);
    const mins = Math.floor((total % 3600) / 60);
    return hours > 0 ? `${hours} giờ ${mins} phút` : `${mins} phút`;
  };

  const formatSongForPlayer = (song) => {
    // audio_url is already a full path from PHP API
    let audioUrl = song.audio_url;
    if (audioUrl && !audioUrl.startsWith('http')) {
      audioUrl = `http://localhost:8081/music_API/online_music/${audioUrl}`;
    }
    
    console.log('Format song for player:', song.title, 'Audio URL:', audioUrl);
    
    // Footer expects 'url' not 'audio'
    return {
      id: song.song_id,
      title: song.title,
      artist: song.artist_name,
      cover: song.cover_url,
      url: audioUrl,  // Changed from 'audio' to 'url'
      duration: song.duration
    };
  };

  const handlePlayPlaylist = () => {
    if (!playlist?.songs || playlist.songs.length === 0) return;
    
    const formattedSongs = playlist.songs.map(formatSongForPlayer);
    setPlayerPlaylist(formattedSongs);
    setCurrentSong(formattedSongs[0]);
  };

  const handleShufflePlaylist = () => {
    if (!playlist?.songs || playlist.songs.length === 0) return;
    
    const shuffled = [...playlist.songs].sort(() => Math.random() - 0.5);
    const formattedSongs = shuffled.map(formatSongForPlayer);
    setPlayerPlaylist(formattedSongs);
    setCurrentSong(formattedSongs[0]);
  };

  const handlePlaySong = (song, index) => {
    const formattedSongs = playlist.songs.map(formatSongForPlayer);
    setPlayerPlaylist(formattedSongs);
    setCurrentSong(formattedSongs[index]);
  };

  const isCurrentSong = (song) => {
    return currentSong && currentSong.id === song.song_id;
  };

  if (isLoading) {
    return (
      <div className="playlist-detail-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlist-detail-error">
        <p>{error}</p>
        <button onClick={() => navigate("/profile")}>Quay lại</button>
      </div>
    );
  }

  if (!playlist) {
    return null;
  }

  const renderPlaylistCover = () => {
    // If playlist has explicit cover
    if (playlist.cover_url) {
      return <img src={playlist.cover_url} alt={playlist.name} />;
    }

    // Get covers from first 4 songs
    const songCovers = playlist.songs
      ?.filter(song => song.cover_url)
      .map(song => song.cover_url)
      .slice(0, 4) || [];

    // If 4+ songs with covers, show grid
    if (songCovers.length >= 4) {
      return (
        <div className="playlist-cover-grid">
          {songCovers.map((cover, idx) => (
            <img key={idx} src={cover} alt="" />
          ))}
        </div>
      );
    }

    // If 1-3 songs with covers, show first one
    if (songCovers.length > 0) {
      return <img src={songCovers[0]} alt={playlist.name} />;
    }

    // No covers available
    return (
      <div className="playlist-cover-placeholder">
        <RiPlayListLine size={100} />
      </div>
    );
  };

  return (
    <div className="playlist-detail-page">
      {/* Header Banner - Spotify Style */}
      <div className="playlist-banner">
        <div className="playlist-banner-content">
          <div className="playlist-cover-large">
            {renderPlaylistCover()}
          </div>
          
          <div className="playlist-header-info">
            <span className="playlist-badge">Public Playlist</span>
            <h1 className="playlist-title">{playlist.name}</h1>
            
            <div className="playlist-stats">
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.owner_name)}&background=4a9b9b&color=fff&size=24`}
                alt={playlist.owner_name}
                className="owner-avatar"
              />
              <span className="owner-name">{playlist.owner_name}</span>
              <span className="stat-separator">•</span>
              <span className="stat-text">{playlist.songs?.length || 0} songs</span>
              {playlist.songs?.length > 0 && (
                <>
                  <span className="stat-separator">, about</span>
                  <span className="stat-text">{getTotalDuration()}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="playlist-controls">
        <button 
          className="play-button-large" 
          disabled={!playlist.songs?.length}
          onClick={handlePlayPlaylist}
          title="Play"
        >
          {isPlaying && playlist.songs?.some(song => isCurrentSong(song)) ? (
            <BiPause size={32} />
          ) : (
            <BiPlay size={32} />
          )}
        </button>
        
        {playlist.songs?.length > 0 && (
          <button 
            className="icon-button shuffle"
            onClick={handleShufflePlaylist}
            title="Shuffle"
          >
            <BsShuffle size={24} />
          </button>
        )}
        
        {isOwner && (
          <>
            <button 
              className="icon-button add"
              onClick={() => setShowAddModal(true)}
              title="Add songs"
            >
              <BsPlus size={28} />
            </button>
            <button 
              className="icon-button edit"
              onClick={() => setShowEditModal(true)}
              title="Edit songs"
              disabled={!playlist.songs?.length}
            >
              <FiEdit2 size={22} />
            </button>
            <button 
              className="icon-button delete"
              onClick={handleDeletePlaylist}
              title="Delete playlist"
            >
              <AiOutlineDelete size={24} />
            </button>
          </>
        )}
        
        <button className="icon-button more">
          <BsThreeDots size={24} />
        </button>
      </div>

      {/* Songs Table */}
      <div className="playlist-content">
        {playlist.songs && playlist.songs.length > 0 ? (
          <div className="tracks-table">
            <div className="table-header">
              <div className="col-number">#</div>
              <div className="col-title">Title</div>
              <div className="col-album">Album</div>
              <div className="col-date">Date added</div>
              <div className="col-duration">
                <BiTime size={18} />
              </div>
              {isOwner && <div className="col-actions"></div>}
            </div>

            {playlist.songs.map((song, index) => (
              <div 
                key={song.song_id} 
                className={`track-row ${isCurrentSong(song) ? 'active' : ''}`}
                onClick={() => handlePlaySong(song, index)}
              >
                <div className="col-number">
                  {isCurrentSong(song) && isPlaying ? (
                    <span className="playing-indicator">♫</span>
                  ) : (
                    <span className="track-number">{index + 1}</span>
                  )}
                </div>
                
                <div className="col-title">
                  <div className="track-info">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt={song.title} className="track-image" />
                    ) : (
                      <div className="track-image-placeholder">
                        <BsMusicNoteBeamed size={20} />
                      </div>
                    )}
                    <div className="track-details">
                      <div className={`track-name ${isCurrentSong(song) ? 'active' : ''}`}>
                        {song.title}
                      </div>
                      <div className="track-artist">{song.artist_name}</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-album">-</div>
                <div className="col-date">
                  {new Date(song.added_at).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                <div className="col-duration">{formatDuration(song.duration)}</div>
                
                {isOwner && (
                  <div className="col-actions">
                    <button
                      className="action-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSong(song.song_id);
                      }}
                      title="Remove from playlist"
                    >
                      <AiOutlineDelete size={16} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <BsMusicNoteBeamed size={64} className="empty-icon" />
            <h3>Bắt đầu thêm bài hát</h3>
            <p>Tìm kiếm và thêm bài hát yêu thích vào playlist</p>
            {isOwner && (
              <button 
                className="add-songs-button"
                onClick={() => setShowAddModal(true)}
              >
                Thêm bài hát
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddSongToPlaylistModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          playlistId={id}
          onSongAdded={fetchPlaylistDetail}
        />
      )}

      {showEditModal && (
        <EditPlaylistSongsModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          playlistId={id}
          songs={playlist.songs || []}
          onSongsRemoved={fetchPlaylistDetail}
        />
      )}
    </div>
  );
}
