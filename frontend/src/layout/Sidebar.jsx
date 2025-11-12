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
import { getArtists } from "../services/artistService";
import { getGenres } from "../services/genreService";
import "./Sidebar.css";

export default function Sidebar({ isLoginOpen, setIsLoginOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("playlist");
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);
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

  // 🎤 Nếu chọn tab Nghệ sĩ
  useEffect(() => {
    if (activeTab === "artist") fetchArtists();
  }, [activeTab]);

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

  const fetchGenres = async () => {
    try {
      setLoadingGenres(true);
      const data = await getGenres();
      // thêm “Tất cả bài hát” lên đầu
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
          <button
            className={`filter-tab ${activeTab === "genre" ? "active" : ""}`}
            onClick={() => setActiveTab("genre")}
          >
            Thể loại
          </button>
        </div>

        {/* Thanh điều khiển */}
        <div className="library-controls">
          <button className="control-btn" title="Tìm trong thư viện">
            <HiMagnifyingGlass size={16} />
          </button>
          <button className="control-btn">
            <span>Gần đây</span>
            <HiChevronDown size={16} />
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

                  {playlists.map((playlist) => {
                    let coverUrl = playlist.cover_url
                      ? playlist.cover_url.startsWith("http")
                        ? playlist.cover_url
                        : `http://localhost:5000${playlist.cover_url}`
                      : playlist.cover_images?.[0] || null;

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
