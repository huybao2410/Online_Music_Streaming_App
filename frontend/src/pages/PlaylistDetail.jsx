// PlaylistDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BsMusicNoteBeamed, BsThreeDots } from "react-icons/bs";
import { AiOutlineHeart, AiFillHeart, AiOutlineEdit, AiOutlineDelete } from "react-icons/ai";
import { BiPlay, BiTime } from "react-icons/bi";
import { HiOutlineDotsHorizontal } from "react-icons/hi";
import { RiPlayListLine } from "react-icons/ri";
import axios from "axios";
import "./PlaylistDetail.css";

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchPlaylistDetail();
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
        
        // Process cover URLs to use full server path
        if (playlistData.cover_url && !playlistData.cover_url.startsWith('http')) {
          playlistData.cover_url = `http://localhost:5000${playlistData.cover_url}`;
        }
        
        // Process song cover URLs
        if (playlistData.songs) {
          playlistData.songs = playlistData.songs.map(song => ({
            ...song,
            cover_url: song.cover_url && !song.cover_url.startsWith('http')
              ? `http://localhost:5000${song.cover_url}`
              : song.cover_url
          }));
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

  return (
    <div className="playlist-detail-page">
      {/* Header */}
      <div className="playlist-header">
        <div className="playlist-cover">
          {playlist.cover_url ? (
            <img src={playlist.cover_url} alt={playlist.name} />
          ) : (
            <div className="playlist-cover-placeholder">
              <RiPlayListLine size={80} />
            </div>
          )}
        </div>
        
        <div className="playlist-info">
          <span className="playlist-type">Playlist</span>
          <h1 className="playlist-name">{playlist.name}</h1>
          {playlist.description && (
            <p className="playlist-description">{playlist.description}</p>
          )}
          
          <div className="playlist-meta">
            <span className="playlist-owner">{playlist.owner_name}</span>
            <span className="meta-dot">•</span>
            <span className="playlist-count">{playlist.songs?.length || 0} bài hát</span>
            {playlist.songs?.length > 0 && (
              <>
                <span className="meta-dot">•</span>
                <span className="playlist-duration">{getTotalDuration()}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="playlist-actions">
        <button className="play-btn">
          <BiPlay size={28} />
        </button>
        
        {isOwner && (
          <div className="owner-actions">
            <button 
              className="action-btn"
              onClick={() => navigate(`/playlist/${id}/edit`)}
              title="Chỉnh sửa"
            >
              <AiOutlineEdit size={24} />
            </button>
            <button 
              className="action-btn delete-btn"
              onClick={handleDeletePlaylist}
              title="Xóa playlist"
            >
              <AiOutlineDelete size={24} />
            </button>
          </div>
        )}
      </div>

      {/* Songs List */}
      <div className="playlist-songs">
        {playlist.songs && playlist.songs.length > 0 ? (
          <div className="songs-table">
            <div className="songs-header">
              <div className="col-index">#</div>
              <div className="col-title">Tiêu đề</div>
              <div className="col-artist">Nghệ sĩ</div>
              <div className="col-duration">
                <BiTime size={20} />
              </div>
              {isOwner && <div className="col-actions"></div>}
            </div>

            {playlist.songs.map((song, index) => (
              <div key={song.id} className="song-row">
                <div className="col-index">{index + 1}</div>
                
                <div className="col-title">
                  <div className="song-thumbnail">
                    {song.cover_url ? (
                      <img src={song.cover_url} alt={song.title} />
                    ) : (
                      <div className="song-thumbnail-placeholder">
                        <BsMusicNoteBeamed size={20} />
                      </div>
                    )}
                  </div>
                  <span className="song-name">{song.title}</span>
                </div>
                
                <div className="col-artist">{song.artist_name}</div>
                <div className="col-duration">{formatDuration(song.duration)}</div>
                
                {isOwner && (
                  <div className="col-actions">
                    <button
                      className="remove-btn"
                      onClick={() => handleRemoveSong(song.id)}
                      title="Xóa khỏi playlist"
                    >
                      <AiOutlineDelete size={18} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-playlist">
            <BsMusicNoteBeamed size={60} />
            <p>Playlist chưa có bài hát nào</p>
            {isOwner && (
              <button className="add-songs-btn">
                Thêm bài hát
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
