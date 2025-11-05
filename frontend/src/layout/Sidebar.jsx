import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiMagnifyingGlass,
  HiHeart,
  HiChevronDown,
} from "react-icons/hi2";
import { getAllArtists } from "../services/artistService"; // 🟢 Gọi API nghệ sĩ

export default function Sidebar({ isLoginOpen, setIsLoginOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activeTab, setActiveTab] = useState("playlist");
  const [artists, setArtists] = useState([]);
  const [loadingArtists, setLoadingArtists] = useState(false);

  const navigate = useNavigate();

  // Kiểm tra token đăng nhập thay đổi
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // 🟣 Khi nhấn vào tab Nghệ sĩ
  const handleArtistClick = async () => {
    console.log("🎵 Nhấn tab Nghệ sĩ");
    setActiveTab("artist");
    setLoadingArtists(true);
    try {
      const data = await getAllArtists();
      console.log("✅ Danh sách nghệ sĩ:", data);
      setArtists(data);
    } catch (err) {
      console.error("❌ Lỗi tải nghệ sĩ:", err);
      setArtists([]);
    } finally {
      setLoadingArtists(false);
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-library">
        <div className="library-header">
          <div className="library-title">
            <span>Thư viện</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="filter-tabs">
          <button
            className={`filter-tab ${activeTab === "playlist" ? "active" : ""}`}
            onClick={() => setActiveTab("playlist")}
          >
            Playlist
          </button>
          <button
            className={`filter-tab ${activeTab === "artist" ? "active" : ""}`}
            onClick={handleArtistClick}
          >
            Nghệ sĩ
          </button>
          <button
            className={`filter-tab ${activeTab === "album" ? "active" : ""}`}
            onClick={() => setActiveTab("album")}
          >
            Album
          </button>
        </div>

        {/* Controls */}
        <div className="library-controls">
          <button className="control-btn" title="Tìm trong thư viện">
            <HiMagnifyingGlass size={16} />
          </button>
          <button className="control-btn">
            <span>Gần đây</span>
            <HiChevronDown size={16} />
          </button>
        </div>

        {/* Nội dung hiển thị */}
        <div className="library-content">
          {isLoggedIn ? (
            <>
              {/* Tab Playlist */}
              {activeTab === "playlist" && (
                <button
                  onClick={() => navigate("/favorite")}
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
              )}

              {/* Tab Nghệ sĩ */}
              {activeTab === "artist" && (
                <div className="artist-list">
                  <h4>Danh sách nghệ sĩ</h4>
                  {loadingArtists ? (
                    <p>Đang tải nghệ sĩ...</p>
                  ) : artists.length > 0 ? (
                    artists.map((artist, i) => (
                      <div key={i} className="artist-item">
                        <span>🎤 {artist}</span>
                      </div>
                    ))
                  ) : (
                    <p>Không có nghệ sĩ nào.</p>
                  )}
                </div>
              )}

              {/* Tab Album */}
              {activeTab === "album" && (
                <div className="album-placeholder">
                  <p>Chức năng album sẽ cập nhật sau 🎧</p>
                </div>
              )}
            </>
          ) : (
            // Nếu chưa đăng nhập
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
        </div>
      </div>
    </aside>
  );
}
