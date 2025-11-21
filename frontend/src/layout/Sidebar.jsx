import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiMagnifyingGlass,
  HiPlus,
  HiHeart,
  HiChevronDown,
  HiMusicalNote,
} from "react-icons/hi2";
import CreatePlaylistModal from "../components/CreatePlaylistModal";
import { getFavoriteArtists } from "../services/favoriteArtistService";
import { getGenres } from "../services/genreService";
import "./Sidebar.css";

export default function Sidebar({ isLoginOpen, setIsLoginOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("playlist");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loadingFavoriteArtists, setLoadingFavoriteArtists] = useState(false);
  const [loadingGenres, setLoadingGenres] = useState(false);
  const navigate = useNavigate();

  // 🧠 Theo dõi đăng nhập
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 🟢 Nếu đăng nhập, lấy playlist
  useEffect(() => {
    if (isLoggedIn) fetchUserPlaylists();
  }, [isLoggedIn]);

  // 🔄 Reload playlists when updated
  useEffect(() => {
    const handlePlaylistUpdate = () => {
      if (isLoggedIn) fetchUserPlaylists();
    };
    window.addEventListener('playlistUpdated', handlePlaylistUpdate);
    return () => window.removeEventListener('playlistUpdated', handlePlaylistUpdate);
  }, [isLoggedIn]);

  // 🎤 Load favorite artists khi đăng nhập
  useEffect(() => {
    if (isLoggedIn) fetchFavoriteArtists();
  }, [isLoggedIn]);

  // 🎵 Nếu chọn tab Thể loại
  useEffect(() => {
    if (activeTab === "genre") fetchGenres();
  }, [activeTab]);

  // ======================= API CALLS ==========================
  const fetchUserPlaylists = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await fetch("http://localhost:5000/api/playlists/my-playlists", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setPlaylists(data.playlists);
    } catch (error) {
      console.error("Error fetching playlists:", error);
    }
  };

  const fetchFavoriteArtists = async () => {
    try {
      setLoadingFavoriteArtists(true);
      const data = await getFavoriteArtists();
      setFavoriteArtists(data);
    } catch (error) {
      console.error("Lỗi khi tải nghệ sĩ yêu thích:", error);
    } finally {
      setLoadingFavoriteArtists(false);
    }
  };

  const fetchGenres = async () => {
    try {
      setLoadingGenres(true);
      const data = await getGenres();
      // thêm "Tất cả bài hát" lên đầu
      setGenres([{ id: 0, name: "Tất cả bài hát" }, ...data]);
    } catch (err) {
      console.error("Lỗi khi tải thể loại:", err);
    } finally {
      setLoadingGenres(false);
    }
  };

  // ============================================================

  const handleCreatePlaylist = () => setShowCreatePlaylist(true);

  const handleGenreSelect = (genre) => {
    // gửi sự kiện để Home nhận
    window.dispatchEvent(new CustomEvent("genreSelected", { detail: genre }));
    navigate("/");
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-library">
        <div className="library-header">
          <div className="library-title">
            <span>Thư viện</span>
          </div>
        </div>

        {/* 🟢 Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === "playlist" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("playlist");
              navigate("/library");
            }}
          >
            Playlist
          </button>
          <button
            className={`filter-tab ${activeTab === "artists" ? "active" : ""}`}
            onClick={() => setActiveTab("artists")}
          >
            Nghệ sĩ
          </button>
          <button
            className={`filter-tab ${activeTab === "genre" ? "active" : ""}`}
            onClick={() => setActiveTab("genre")}
          >
            Thể loại
          </button>
        </div>

        {/* ================= NỘI DUNG ================= */}
        <div className="library-content">
          {/* 🟢 Playlist */}
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

                  {/* Nghệ sĩ yêu thích - Mục cố định */}
                  <button
                    onClick={() => favoriteArtists.length > 0 ? navigate("/favorite-artists") : navigate("/artist-selection")}
                    className="library-item"
                  >
                    <div className="item-cover" style={{ 
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "4px"
                    }}>
                      <span style={{ fontSize: "32px" }}>🎤</span>
                    </div>
                    <div className="item-info">
                      <span className="item-title">Nghệ sĩ yêu thích</span>
                      <span className="item-subtitle">
                        <span className="item-type">
                          {favoriteArtists.length > 0 
                            ? `${favoriteArtists.length} nghệ sĩ` 
                            : "Chưa có nghệ sĩ nào"}
                        </span>
                      </span>
                    </div>
                  </button>

                  {/* Danh sách nghệ sĩ yêu thích */}
                  {favoriteArtists.length > 0 && (
                    <>
                      {favoriteArtists.slice(0, 5).map((artist) => (
                        <button
                          key={artist.artist_id}
                          className="library-item"
                          onClick={() => navigate(`/artist/${artist.artist_id}`)}
                        >
                          <div className="item-cover artist">
                            {artist.cover_url ? (
                              <img 
                                src={artist.cover_url.startsWith('http') 
                                  ? artist.cover_url 
                                  : `http://localhost:8081/music_API/${artist.cover_url}`
                                } 
                                alt={artist.name}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.querySelector('.artist-placeholder')?.style.setProperty('display', 'flex');
                                }}
                              />
                            ) : null}
                            <div className="artist-placeholder" style={{ display: artist.cover_url ? 'none' : 'flex' }}>🎤</div>
                          </div>
                          <div className="item-info">
                            <span className="item-title">{artist.name}</span>
                            <span className="item-subtitle">
                              <span className="item-type">Nghệ sĩ</span>
                            </span>
                          </div>
                        </button>
                      ))}
                    </>
                  )}

                  {playlists.map((playlist) => {
                    let coverUrl = null;
                    
                    if (playlist.cover_url) {
                      coverUrl = playlist.cover_url.startsWith("http")
                        ? playlist.cover_url
                        : `http://localhost:5000${playlist.cover_url}`;
                    } else if (playlist.cover_images?.length > 0) {
                      const firstCover = playlist.cover_images[0];
                      if (firstCover) {
                        if (firstCover.startsWith('http')) {
                          coverUrl = firstCover;
                        } else if (firstCover.startsWith('/uploads')) {
                          coverUrl = `http://localhost:5000${firstCover}`;
                        } else {
                          coverUrl = `http://localhost:8081/music_API/online_music/${firstCover}`;
                        }
                      }
                    }

                    return (
                      <button
                        key={playlist.playlist_id}
                        className="library-item"
                        onClick={() => navigate(`/playlist/${playlist.playlist_id}`)}
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
                            {playlist.song_count || 0} bài hát
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

          {/* 🎤 Nghệ sĩ */}
          {activeTab === "artists" && (
            <div className="artists-section" style={{ padding: "10px 0" }}>
              <button
                onClick={() => navigate("/artists")}
                className="library-item"
                style={{ marginBottom: "10px" }}
              >
                <div className="item-cover" style={{ 
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%"
                }}>
                  <span style={{ fontSize: "32px" }}>🎤</span>
                </div>
                <div className="item-info">
                  <span className="item-title">Tất cả nghệ sĩ</span>
                  <span className="item-subtitle">
                    <span className="item-type">Xem danh sách</span>
                  </span>
                </div>
              </button>
            </div>
          )}

          {/* 🎵 Thể loại */}
          {activeTab === "genre" && (
            <div className="genre-section" style={{ padding: "10px 0" }}>
              {loadingGenres ? (
                <p style={{ color: "#888" }}>Đang tải thể loại...</p>
              ) : genres.length === 0 ? (
                <p style={{ color: "#888" }}>Không có thể loại nào</p>
              ) : (
                genres.map((genre) => (
                  <div
                    key={genre.id}
                    className="library-item genre-item"
                    onClick={() => handleGenreSelect(genre.name)}
                  >
                    <div className="item-cover genre">
                      <HiMusicalNote size={26} />
                    </div>
                    <div className="item-info">
                      <span className="item-title">{genre.name}</span>
                      <span className="item-subtitle">
                        <span className="item-type">Thể loại</span>
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
