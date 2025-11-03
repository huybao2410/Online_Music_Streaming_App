import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiHome, HiMagnifyingGlass } from "react-icons/hi2";
import { IoDownload } from "react-icons/io5";
import { FaChevronDown } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";

export default function Header({ isLoginOpen, setIsLoginOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
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
    window.dispatchEvent(new Event("storage"));
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

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
      setUsername(localStorage.getItem("username") || "User");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <header className="header">
      <div className="header-left">
        <button className="header-btn" onClick={() => navigate("/")}>
          <HiHome size={24} />
        </button>
        <div className="brand">
          <span className="logo-icon">🎵</span>
          <span className="logo-text">MusicDBG</span>
        </div>
      </div>

      <div className="header-center">
        <div className="search-bar">
          <HiMagnifyingGlass className="search-icon" size={24} />
          <input
            type="text"
            placeholder="Bạn muốn nghe gì?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
      </div>

      <div className="header-right" ref={dropdownRef}>
        <a href="#premium" className="premium-btn">
          Dùng Premium
        </a>
        
        <button className="install-btn">
          <IoDownload size={20} />
          <span>Cài đặt ứng dụng</span>
        </button>

        {isLoggedIn ? (
          <div className="user-menu">
            <button
              className="profile-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="avatar">
                <CgProfile size={24} />
              </div>
              <span className="username">{username}</span>
              <FaChevronDown 
                size={12}
                style={{ 
                  transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.2s ease' 
                }}
              />
            </button>

            {isDropdownOpen && (
              <div className="profile-menu">
                <a href="#account" className="menu-item">Tài khoản</a>
                <a href="#profile" className="menu-item">Hồ sơ</a>
                <a href="#settings" className="menu-item">Cài đặt</a>
                <div className="menu-separator"></div>
                <button className="menu-item" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="signup-btn" onClick={() => setIsLoginOpen(true)}>
            Đăng ký
          </button>
        )}
      </div>
    </header>
  );
}