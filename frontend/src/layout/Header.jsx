import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Header({ isLoginOpen, setIsLoginOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("username") || "Người dùng");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    setUsername("Người dùng");
    window.dispatchEvent(new Event("storage")); // để Sidebar cập nhật lại
  };

  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Cập nhật khi localStorage thay đổi (đăng nhập/đăng xuất)
  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUsername(localStorage.getItem("username") || "Người dùng");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <header className="homepage-header">
      <div className="header-left">
        <button
          className="menu-btn"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          ☰
        </button>
        <div className="logo">🎵 MusicDBG</div>
      </div>

      <div className="header-center">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="search-btn" onClick={handleSearch}>
            🔍
          </button>
        </div>
      </div>

      <div className="header-right" ref={dropdownRef}>
        {isLoggedIn ? (
          <div className="user-menu">
            <button
              className="user-icon"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              👤
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                {/* ✅ Hiển thị đúng tên user */}
                <div className="dropdown-item">{username}</div>
                <div className="dropdown-item">Thông tin tài khoản</div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  Đăng xuất
                </div>
              </div>
            )}
          </div>
        ) : (
          <button className="login-btn" onClick={() => setIsLoginOpen(true)}>
            Log in
          </button>
        )}
      </div>
    </header>
  );
}
