import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiMagnifyingGlass,
  HiPlus,
  HiHeart,
  HiChevronDown,
} from "react-icons/hi2";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { getArtists } from "../services/artistService";

export default function Sidebar({ isLoginOpen, setIsLoginOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("playlist"); // 🆕 tab đang chọn
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
  const navigate = useNavigate();

  // Theo dõi đăng nhập
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserPlaylists();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (activeTab === "artist") {
      fetchArtists();
    }
  }, [activeTab]);

  const fetchUserPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        "http://localhost:5000/api/playlists/my-playlists",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await response.json();
      if (data.success) {
        setPlaylists(data.playlists);
      }
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const fetchArtists = async () => {
    try {
      setLoadingArtists(true);
      const data = await getArtists();
      setArtists(data);
    } catch (error) {
      console.error("Lỗi khi tải danh sách nghệ sĩ:", error);
    } finally {
      setLoadingArtists(false);
    }
  };

  const handleCreatePlaylist = () => setShowCreatePlaylist(true);

  return (
    <aside className="sidebar">
      <div className="sidebar-library">
        <div className="library-header">
          <div className="library-title">
            <span>Thư viện</span>
          </div>
        </div>

        {/* 🟢 Tab chuyển giữa Playlist / Nghệ sĩ */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${
              activeTab === "playlist" ? "active" : ""
            }`}
            onClick={() => setActiveTab("playlist")}
          >
            Playlist
          </button>
          <button
            className={`filter-tab ${activeTab === "artist" ? "active" : ""}`}
            onClick={() => setActiveTab("artist")}
          >
            Nghệ sĩ
          </button>
          <button className="filter-tab disabled" disabled>
            Album
          </button>
        </div>

        <div className="library-controls">
          <button className="control-btn" title="Tìm trong thư viện">
            <HiMagnifyingGlass size={16} />
          </button>
          <button className="control-btn">
            <span>Gần đây</span>
            <HiChevronDown size={16} />
          </button>
        </div>

        <div className="library-content">
          {/* 🟢 Nếu đang chọn tab Playlist */}
          {activeTab === "playlist" && (
            <>
              {isLoggedIn ? (
                <>
                  <div className="create-playlist-section">
                    <button
                      className="create-playlist-btn-logged"
                      onClick={handleCreatePlaylist}
                    >
                      <HiPlus size={20} />
                      <span>Tạo playlist</span>
                    </button>
                  </div>

                  <button
                    onClick={() => navigate("/favorites")}
                    className="library-item"
                  >
                    <div className="item-cover liked-songs">
                      <HiHeart size={32} />
                    </div>
                    <div className="item-info">
                      <span className="item-title">Bài hát đã thích</span>
                      <span className="item-subtitle">
                        <span className="item-type">Playlist</span>
                      </span>
                    </div>
                  </button>

                  {playlists.map((playlist) => {
                    let coverUrl = null;
                    if (playlist.cover_url) {
                      coverUrl = playlist.cover_url.startsWith("http")
                        ? playlist.cover_url
                        : `http://localhost:5000${playlist.cover_url}`;
                    } else if (playlist.cover_images?.[0]) {
                      coverUrl = playlist.cover_images[0];
                    }

                    return (
                      <button
                        key={playlist.id}
                        className="library-item"
                        onClick={() => navigate(`/playlist/${playlist.id}`)}
                      >
                        <div className="item-cover playlist">
                          {coverUrl ? (
                            <img src={coverUrl} alt={playlist.name} />
                          ) : (
                            <div className="playlist-placeholder">
                              <HiPlus size={24} />
                            </div>
                          )}
                        </div>
                        <div className="item-info">
                          <span className="item-title">{playlist.name}</span>
                          <span className="item-subtitle">
                            <span className="item-type">Playlist</span> •{" "}
                            <span className="item-owner">
                              {playlist.song_count || 0} bài hát
                            </span>
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </>
              ) : (
                <div className="login-prompt">
                  <h3>Tạo playlist đầu tiên</h3>
                  <p>Rất đơn giản, chúng tôi sẽ hướng dẫn bạn</p>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="create-playlist-btn"
                  >
                    Tạo playlist
                  </button>

                  <div className="prompt-separator"></div>

                  <h3>Khám phá podcast yêu thích</h3>
                  <p>Chúng tôi sẽ cập nhật các tập mới cho bạn</p>
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="browse-btn"
                  >
                    Duyệt podcast
                  </button>
                </div>
              )}
            </>
          )}

          {/* 🟣 Nếu đang chọn tab Nghệ sĩ */}
          {activeTab === "artist" && (
            <div className="artist-section" style={{ padding: "10px 0" }}>
              {loadingArtists ? (
                <p style={{ color: "#888" }}>Đang tải nghệ sĩ...</p>
              ) : artists.length === 0 ? (
                <p style={{ color: "#888" }}>Không có nghệ sĩ nào</p>
              ) : (
                artists.map((artist) => (
                  <div
                    key={artist.id}
                    className="library-item"
                    onClick={() => navigate(`/artist/${artist.id}`)}
                  >
                    <div className="item-cover artist">
                      {artist.avatar ? (
                        <img src={artist.avatar} alt={artist.name} />
                      ) : (
                        <div className="artist-placeholder">🎤</div>
                      )}
                    </div>
                    <div className="item-info">
                      <span className="item-title">{artist.name}</span>
                      <span className="item-subtitle">
                        <span className="item-type">Nghệ sĩ</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <CreatePlaylistModal
        isOpen={showCreatePlaylist}
        onClose={() => setShowCreatePlaylist(false)}
        onSuccess={fetchUserPlaylists}
      />
    </aside>
  );
}
