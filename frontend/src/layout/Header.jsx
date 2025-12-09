import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { HiHome, HiMagnifyingGlass } from "react-icons/hi2";
import { IoDownload } from "react-icons/io5";
import { FaChevronDown } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import { MdSettings, MdLogout } from "react-icons/md";
import { RiUserLine } from "react-icons/ri";
import axios from "axios";
import "./Header.css";
import PremiumExpiredModal from "../components/PremiumExpiredModal";
import PremiumInfoModal from "../components/PremiumInfoModal";
import SearchSuggestions from "../components/SearchSuggestions";
import { suggestions as suggestionsAPI } from "../services/searchService";

export default function Header({ isLoginOpen, setIsLoginOpen }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [searchQuery, setSearchQuery] = useState("");
  const [username, setUsername] = useState(localStorage.getItem("username") || "Người dùng");
  const [userAvatar, setUserAvatar] = useState(null);
  const [showExpired, setShowExpired] = useState(false);
  const [isPremium, setIsPremium] = useState(localStorage.getItem("is_premium") === "1");

  // Search suggestions state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);


  // ✅ Kiểm tra trạng thái Premium từ backend
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await suggestionsAPI(searchQuery.trim(), 5);
        if (res.success) {
          setSuggestions(res);
          setShowSuggestions(true);
        } else {
          setSuggestions({ songs: [], artists: [], albums: [] });
        }
      } catch (err) {
        console.error("Error fetching suggestions:", err);
        setSuggestions({ songs: [], artists: [], albums: [] });
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ✅ Khi đăng nhập, tải lại avatar
  useEffect(() => {
    if (isLoggedIn) {
      fetchUserProfile();
    }
  }, [isLoggedIn]);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get("http://localhost:5000/api/users/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setUserAvatar(response.data.user.avatar_url);
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("is_premium");
    localStorage.removeItem("premiumExpire");
    setIsLoggedIn(false);
    setIsDropdownOpen(false);
    setUsername("Người dùng");
    setUserAvatar(null);
    window.dispatchEvent(new Event("storage"));
  };

  const handleSearch = () => {
    if (searchQuery.trim() !== "") {
      setShowSuggestions(false);
      navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Fetch search suggestions with debounce
  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSuggestions(null);
      setShowSuggestions(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const response = await axios.get('http://localhost:5000/api/search/suggestions', {
          params: { query: searchQuery.trim(), limit: 5 }
        });

        if (response.data.success) {
          setSuggestions(response.data);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Đóng menu và suggestions khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Đồng bộ khi login/logout
  useEffect(() => {
    const handleStorageChange = () => {
      const loggedIn = !!localStorage.getItem("token");
      setIsLoggedIn(loggedIn);
      setUsername(localStorage.getItem("username") || "User");
      setIsPremium(localStorage.getItem("is_premium") === "1");
      if (loggedIn) fetchUserProfile();
      else setUserAvatar(null);
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
        <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={require('../assets/vivora_logo.jpg')} alt="Vivora Logo" className="vivora-logo" style={{ height: 48, width: 'auto' }} />
          <span className="logo-text" style={{ fontSize: '2rem', fontWeight: 'bold', letterSpacing: '2px' }}>VIVORA</span>
        </div>
      </div>

      <div className="header-center">
        <div className="search-bar" ref={searchRef}>
          <HiMagnifyingGlass className="search-icon" size={24} />
          <input
            type="text"
            placeholder="Bạn muốn nghe gì?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => searchQuery.trim() && setShowSuggestions(true)}
          />
          {showSuggestions && suggestions && (
            <SearchSuggestions
              suggestions={suggestions}
              onSelect={(type, item) => {
                const q = item.title || item.name || "";
                setShowSuggestions(false);
                setSearchQuery(q);
                // navigate to search page (SearchPage will load full results for this query)
                navigate(`/search?query=${encodeURIComponent(q)}`);
              }}
            />
          )}
        </div>
      </div>

      <div className="header-right" ref={dropdownRef}>
        {/* ✅ Nút Premium */}
        {isPremium ? (
          <button
            className="premium-active"
            onClick={() => navigate('/premium-status')}
          >
            💎 Thành viên Premium
          </button>
        ) : (
          <button
            className="premium-btn"
            onClick={() => {
              const token = localStorage.getItem("token");
              if (!token) setIsLoginOpen(true);
              else navigate("/premium-upgrade");
            }}
          >
            Trải nghiệm Premium
          </button>
        )}


        {isLoggedIn ? (
          <div className="user-menu">
            <button
              className="profile-btn"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="avatar">
                {userAvatar ? <img src={userAvatar} alt={username} /> : <CgProfile size={24} />}
              </div>
              <span className="username">{username}</span>
              <FaChevronDown
                size={12}
                style={{
                  transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0)",
                  transition: "transform 0.2s ease",
                }}
              />
            </button>

            {isDropdownOpen && (
              <div className="profile-menu">
                <button
                  className="menu-item"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                >
                  <RiUserLine size={18} />
                  <span>Hồ sơ</span>
                </button>
                <a href="#settings" className="menu-item">
                  <MdSettings size={18} />
                  <span>Cài đặt</span>
                </a>
                <div className="menu-separator"></div>
                <button className="menu-item" onClick={handleLogout}>
                  <MdLogout size={18} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="signup-btn" onClick={() => setIsLoginOpen(true)}>
            Đăng nhập
          </button>
        )}
      </div>

      {/* ✅ Modal hết hạn Premium */}
      {showExpired && <PremiumExpiredModal onClose={() => setShowExpired(false)} />}

      {/* ✅ Modal thông tin Premium */}
      {showPremiumModal && (
        <PremiumInfoModal onClose={() => setShowPremiumModal(false)} />
      )}
    </header>
  );
}