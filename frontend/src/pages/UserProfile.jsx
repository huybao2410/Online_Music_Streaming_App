// UserProfile.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiEdit } from "react-icons/fi";
import { BsMusicNoteBeamed } from "react-icons/bs";
import { AiOutlineHeart, AiOutlineClockCircle } from "react-icons/ai";
import { RiPlayListLine } from "react-icons/ri";
import { CgProfile } from "react-icons/cg";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import EditProfileModal from "../components/EditProfileModal";
import axios from "axios";
import "./UserProfile.css";

export default function UserProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("yeuthich");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [userInfo, setUserInfo] = useState({
    username: localStorage.getItem("username") || "Người dùng",
    memberType: "Miễn phí",
    followers: 0,
    following: 0,
    avatar: null
  });

  const [favoriteSongs, setFavoriteSongs] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    // Fetch user data from API
    fetchUserProfile();
    fetchFavoriteSongs();
    fetchRecentSongs();
    fetchUserPlaylists();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }
      
      const response = await axios.get("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const user = response.data.user;
        setUserInfo({
          username: user.username,
          memberType: user.role === 'premium' ? 'Premium' : 'Miễn phí',
          followers: 0, // TODO: implement followers
          following: 0, // TODO: implement following
          avatar: user.avatar_url
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const fetchFavoriteSongs = async () => {
    try {
      // TODO: Call API to get favorite songs
      setFavoriteSongs([
        {
          id: 1,
          title: "Bài hát yêu thích 1",
          artist: "Ca sĩ 1",
          duration: "3:45",
          thumbnail: null
        }
      ]);
    } catch (error) {
      console.error("Error fetching favorite songs:", error);
    }
  };

  const fetchRecentSongs = async () => {
    try {
      // TODO: Call API to get recent songs
      setRecentSongs([
        {
          id: 1,
          title: "Bài hát gần đây 1",
          artist: "Ca sĩ 1",
          duration: "3:45",
          thumbnail: null
        }
      ]);
    } catch (error) {
      console.error("Error fetching recent songs:", error);
    }
  };

  const fetchUserPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch("http://localhost:5000/api/playlists/my-playlists", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setPlaylists(data.playlists);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    window.dispatchEvent(new Event("storage"));
    navigate("/");
  };

  const handlePlaylistCreated = () => {
    // Refresh playlists after creation
    fetchUserPlaylists();
  };

  const handleProfileUpdated = (updatedInfo) => {
    // Update user info after edit
    setUserInfo(prev => ({
      ...prev,
      username: updatedInfo.username,
      avatar: updatedInfo.avatar
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "yeuthich":
        return (
          <div className="songs-grid">
            {favoriteSongs.length > 0 ? (
              favoriteSongs.map((song) => (
                <div key={song.id} className="song-card">
                  <div className="song-thumbnail">
                    {song.thumbnail ? (
                      <img src={song.thumbnail} alt={song.title} />
                    ) : (
                      <div className="song-thumbnail-placeholder">
                        <BsMusicNoteBeamed size={40} />
                      </div>
                    )}
                  </div>
                  <div className="song-info">
                    <h4 className="song-title">{song.title}</h4>
                    <p className="song-artist">{song.artist}</p>
                    <span className="song-duration">{song.duration}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <AiOutlineHeart size={60} />
                <p>Chưa có bài hát yêu thích</p>
              </div>
            )}
          </div>
        );
      
      case "ganday":
        return (
          <div className="songs-grid">
            {recentSongs.length > 0 ? (
              recentSongs.map((song) => (
                <div key={song.id} className="song-card">
                  <div className="song-thumbnail">
                    {song.thumbnail ? (
                      <img src={song.thumbnail} alt={song.title} />
                    ) : (
                      <div className="song-thumbnail-placeholder">
                        <BsMusicNoteBeamed size={40} />
                      </div>
                    )}
                  </div>
                  <div className="song-info">
                    <h4 className="song-title">{song.title}</h4>
                    <p className="song-artist">{song.artist}</p>
                    <span className="song-duration">{song.duration}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <AiOutlineClockCircle size={60} />
                <p>Chưa có bài hát nghe gần đây</p>
              </div>
            )}
          </div>
        );
      
      case "playlist":
        return (
          <div className="playlists-section">
            <div className="playlists-header">
              <h3>Playlist đã tạo ({playlists.length})</h3>
              <button 
                className="create-playlist-btn"
                onClick={() => setShowCreatePlaylist(true)}
              >
                + Tạo playlist
              </button>
            </div>
            {playlists.length > 0 ? (
              <div className="playlists-grid">
                {playlists.map((playlist) => {
                  // Get cover URL - prioritize playlist cover, fallback to song covers
                  let coverUrl = null;
                  if (playlist.cover_url) {
                    coverUrl = playlist.cover_url.startsWith('http') 
                      ? playlist.cover_url 
                      : `http://localhost:5000${playlist.cover_url}`;
                  } else if (playlist.cover_images && playlist.cover_images[0]) {
                    coverUrl = playlist.cover_images[0];
                  }

                  return (
                    <div 
                      key={playlist.id} 
                      className="playlist-card"
                      onClick={() => navigate(`/playlist/${playlist.id}`)}
                    >
                      <div className="playlist-thumbnail">
                        {coverUrl ? (
                          <img src={coverUrl} alt={playlist.name} />
                        ) : (
                          <RiPlayListLine size={50} />
                        )}
                      </div>
                      <div className="playlist-info">
                        <h4>{playlist.name}</h4>
                        <p>{playlist.song_count || 0} bài hát</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <img 
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%234a9b9b' d='M50 10 L60 40 L90 40 L65 60 L75 90 L50 70 L25 90 L35 60 L10 40 L40 40 Z'/%3E%3C/svg%3E" 
                    alt="Empty playlist" 
                    style={{ width: 80, height: 80, opacity: 0.5 }}
                  />
                </div>
                <p className="empty-title">Danh sách playlist chưa có</p>
                <p className="empty-subtitle">Hãy tạo playlist đầu tiên của bạn.</p>
                <button 
                  className="create-playlist-btn-large"
                  onClick={() => setShowCreatePlaylist(true)}
                >
                  Tạo playlist
                </button>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="user-profile-page">
      <div className="profile-header">
        <div className="profile-banner">
          <div className="profile-info-container">
            <div className="profile-avatar-wrapper">
              {userInfo.avatar ? (
                <img src={userInfo.avatar} alt={userInfo.username} className="profile-avatar" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <CgProfile size={80} />
                </div>
              )}
            </div>
            
            <div className="profile-details">
              <h1 className="profile-username">{userInfo.username}</h1>
              <span className="profile-member-type">{userInfo.memberType}</span>
              
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">Đang theo dõi</span>
                  <span className="stat-value">{userInfo.following}</span>
                </div>
                <div className="stat-separator">·</div>
                <div className="stat-item">
                  <span className="stat-label">Người theo dõi</span>
                  <span className="stat-value">{userInfo.followers}</span>
                </div>
              </div>
            </div>

            <button className="profile-edit-btn" onClick={() => setShowEditProfile(true)}>
              <FiEdit size={18} />
              <span>Chỉnh sửa hồ sơ</span>
            </button>
          </div>
        </div>
      </div>

      <div className="profile-content">
        <div className="profile-tabs">
          <button 
            className={`tab-item ${activeTab === "yeuthich" ? "active" : ""}`}
            onClick={() => setActiveTab("yeuthich")}
          >
            <AiOutlineHeart size={20} />
            <span>Bài hát Yêu thích</span>
            <span className="tab-count">1 bài hát</span>
          </button>
          
          <button 
            className={`tab-item ${activeTab === "ganday" ? "active" : ""}`}
            onClick={() => setActiveTab("ganday")}
          >
            <AiOutlineClockCircle size={20} />
            <span>Nghe gần đây</span>
            <span className="tab-count">2 bài hát</span>
          </button>
          
          <button 
            className={`tab-item ${activeTab === "playlist" ? "active" : ""}`}
            onClick={() => setActiveTab("playlist")}
          >
            <RiPlayListLine size={20} />
            <span>Playlist đã tạo</span>
            <span className="tab-count">(0)</span>
          </button>
        </div>

        <div className="profile-tab-content">
          {renderTabContent()}
        </div>
      </div>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onSuccess={handlePlaylistCreated}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        currentUser={userInfo}
        onSuccess={handleProfileUpdated}
      />
    </div>
  );
}
