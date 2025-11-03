import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiHome, HiMagnifyingGlass, HiPlus, HiArrowRight, HiHeart, HiChevronDown } from "react-icons/hi2";
import { BiLibrary } from "react-icons/bi";

export default function Sidebar({ isLoginOpen, setIsLoginOpen }) {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-library">
        <div className="library-header">
          <div className="library-title">
            <span>Thư viện</span>
          </div>
        </div>

        <div className="filter-tabs">
          <button className="filter-tab active">Playlist</button>
          <button className="filter-tab">Nghệ sĩ</button>
          <button className="filter-tab">Album</button>
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
          {isLoggedIn ? (
            <>
              <button onClick={() => navigate("/favorite")} className="library-item">
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

              {/* Example items - replace with real data */}
              <button className="library-item">
                <div className="item-cover playlist">
                  <img src="https://via.placeholder.com/48" alt="Ảnh playlist" />
                </div>
                <div className="item-info">
                  <span className="item-title">Playlist của tôi #1</span>
                  <span className="item-subtitle">
                    <span className="item-type">Playlist</span> • <span className="item-owner">Bạn</span>
                  </span>
                </div>
              </button>
            </>
          ) : (
            <div className="login-prompt">
              <h3>Tạo playlist đầu tiên</h3>
              <p>Rất đơn giản, chúng tôi sẽ hướng dẫn bạn</p>
              <button onClick={() => setIsLoginOpen(true)} className="create-playlist-btn">
                Tạo playlist
              </button>

              <div className="prompt-separator"></div>

              <h3>Khám phá podcast yêu thích</h3>
              <p>Chúng tôi sẽ cập nhật các tập mới cho bạn</p>
              <button onClick={() => setIsLoginOpen(true)} className="browse-btn">
                Duyệt podcast
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}