import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArtistModal from "../components/ArtistModal";
import SongManagementContent from "../components/SongManagementContent";
import ArtistManagementContent from "../components/ArtistManagementContent";
import UserManagementContent from "../components/UserManagementContent";
import AdminProfileContent from "../components/AdminProfileContent";
import GenreManagementContent from "../components/GenreManagementContent";
import axios from "axios";
import AdminAlbums from "./AdminAlbums";
import AdminStatistics from "../components/AdminStatistics";
import AdminTopSongs from "../components/AdminTopSongs";

import ServicePlanManagement from "../components/ServicePlanManagement";
import PlaylistManagementContent from "../components/PlaylistManagementContent";

import OrderManagementContent from "../components/OrderManagementContent";
import FavoriteManagementContent from "../components/FavoriteManagementContent";

import {
  FaTachometerAlt,
  FaMusic,
  FaUsers,
  FaHistory,
  FaUserCircle,
  FaCompactDisc,
  FaFire, // Icon ngọn lửa cho Top Songs
  FaFileInvoiceDollar,
  FaHeart,
} from "react-icons/fa";
import {
  MdDashboard,
  MdQueueMusic,
  MdPeopleAlt,
} from "react-icons/md";
import { IoMdNotifications } from "react-icons/io";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Thêm totalAlbums vào state
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalArtists: 0,
    totalUsers: 0,
    totalPlaylists: 0,
    totalGenres: 0,
    totalAlbums: 0,
    totalServicePlans: 0
  });
  const [adminAvatar, setAdminAvatar] = useState(null);

  const username = localStorage.getItem("username");
  const token = localStorage.getItem("token");

  // Check admin permission
  useEffect(() => {
    const role = localStorage.getItem("role");

    if (!token) {
      alert("Vui lòng đăng nhập");
      navigate("/");
      return;
    }

    if (role !== "admin") {
      alert("Bạn không có quyền truy cập trang này");
      navigate("/");
      return;
    }
  }, [navigate]);

  // Fetch admin avatar
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.user && response.data.user.avatar_url) {
          setAdminAvatar(response.data.user.avatar_url);
        }
      } catch (error) {
        console.error("Error fetching admin profile:", error);
      }
    };
    if (token) fetchAdminProfile();
  }, [token]);

  // Listen to storage event
  useEffect(() => {
    const handleStorageChange = () => {
      // Logic reload avatar if needed
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleArtistModalSuccess = () => {
    // Refresh artists if needed
  };

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching dashboard stats...");

        // Gọi thêm API lấy Albums và Gói dịch vụ
        const [songsRes, artistsRes, usersRes, genresRes, albumsRes, servicePlansRes] = await Promise.all([
          axios.get("http://localhost:8081/music_API/online_music/song/get_songs_web.php"),
          axios.get("http://localhost:8081/music_API/online_music/artist/get_artists.php"),
          axios.get("/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { users: [] } })),
          axios.get("http://localhost:5000/api/genres").catch(() => ({ data: { genres: [] } })),
          axios.get("/api/admin/albums", {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { total: 0 } })),
          axios.get("/api/subscriptions/plans").catch(() => ({ data: { plans: [] } }))
        ]);

        const totalSongs = songsRes.data?.status && songsRes.data?.songs
          ? songsRes.data.songs.length
          : 0;

        const totalArtists = artistsRes.data?.status === "success" && artistsRes.data?.artists
          ? artistsRes.data.artists.length
          : 0;

        const totalUsers = usersRes.data?.users?.length || 0;
        const totalGenres = genresRes.data?.genres?.length || 0;
        const totalAlbums = albumsRes.data?.total || albumsRes.data?.albums?.length || 0;
        const totalServicePlans = servicePlansRes.data?.plans?.length || 0;

        setStats({
          totalSongs,
          totalArtists,
          totalUsers,
          totalPlaylists: 0, // Placeholder
          totalGenres,
          totalAlbums,
          totalServicePlans
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    navigate("/");
  };

  const getCurrentDate = () => {
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 'bold', letterSpacing: '2px' }}>VIVORA</h3>
              <p>Bảng Quản Trị</p>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <h4 className="nav-section-title">TỔNG QUAN</h4>
            <button
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </button>
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">QUẢN LÝ</h4>
            <button
              className={`nav-item ${activeTab === "top_songs" ? "active" : ""}`}
              onClick={() => setActiveTab("top_songs")}
            >
              <FaFire style={{ color: "#fff" }} />
              <span>Top Songs</span>
            </button>

            <button
              className={`nav-item ${activeTab === "songs" ? "active" : ""}`}
              onClick={() => setActiveTab("songs")}
            >
              <FaMusic style={{ color: "#fff" }} />
              <span>Bài hát</span>
            </button>
            <button
              className={`nav-item ${activeTab === "albums" ? "active" : ""}`}
              onClick={() => setActiveTab("albums")}
            >
              <FaCompactDisc style={{ color: "#fff" }} />
              <span>Album</span>
            </button>
            <button
              className={`nav-item ${activeTab === "artists" ? "active" : ""}`}
              onClick={() => setActiveTab("artists")}
            >
              <MdPeopleAlt style={{ color: "#fff" }} />
              <span>Nghệ sĩ</span>
            </button>
            <button
              className={`nav-item ${activeTab === "genres" ? "active" : ""}`}
              onClick={() => setActiveTab("genres")}
            >
              <FaMusic style={{ color: "#fff" }} />
              <span>Thể loại</span>
            </button>

            {/* Tab Playlist đã bị ẩn */}
            <button
              className={`nav-item ${activeTab === "favorites" ? "active" : ""}`}
              onClick={() => setActiveTab("favorites")}
            >
              <FaHeart style={{ color: "#fff" }} />
              <span>Lượt thích</span>
            </button>
            <button
              className={`nav-item ${activeTab === "service_plans" ? "active" : ""}`}
              onClick={() => setActiveTab("service_plans")}
            >
              <FaCompactDisc style={{ color: "#fff" }} />
              <span>Gói dịch vụ</span>
            </button>
            <button
              className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <FaUsers style={{ color: "#fff" }} />
              <span>Người dùng</span>
            </button>
            <button
              className={`nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <FaFileInvoiceDollar style={{ color: "#fff" }} />
              <span>Hóa đơn</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        <header className="admin-top-header">
          <div className="header-actions-bar">
            <button className="notification-btn">
              <IoMdNotifications size={20} />
              <div className="notification-badge"></div>
            </button>
            <div
              className="user-profile-section"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            >
              <div className="user-avatar-header">
                {adminAvatar ? (
                  <img
                    src="https://images.icon-icons.com/1378/PNG/512/avatardefault_92824.png"
                    alt="Avatar"
                    className="avatar-img"
                  />
                ) : (
                  <span className="avatar-placeholder">
                    {username?.charAt(0).toUpperCase() || 'A'}
                  </span>
                )}
              </div>
              <div className="user-info-header">
                <span className="user-name-header">{username || 'Admin'}</span>
                <span className="user-role-header">Administrator</span>
              </div>
              {showProfileDropdown && (
                <div className="profile-dropdown">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setActiveTab("profile");
                      setShowProfileDropdown(false);
                    }}
                  >
                    <FaUserCircle /> Hồ sơ
                  </button>
                  <button className="dropdown-item danger" onClick={handleLogout}>
                    <FaHistory /> Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="admin-content">
          {/* === THỐNG KÊ (OVERVIEW) === */}
          {activeTab === "overview" && (
            <div className="dashboard-overview">
              <div className="page-title-section">
                <div className="title-content">
                  <div className="icon-title">
                    <MdDashboard size={32} />
                    <h1>Bảng Điều Khiển Quản Trị</h1>
                  </div>
                  <p className="page-date">{getCurrentDate()}</p>
                </div>
                <button className="refresh-btn" onClick={() => window.location.reload()}>
                  Làm mới
                </button>
              </div>

              {/* Stats Cards */}

              <div className="stats-cards-grid">
                {/* Thẻ Album Mới Thêm (Cyan) */}
                <div className="stat-card-modern cyan">
                  <div className="card-icon">
                    <FaCompactDisc size={32} />
                  </div>
                  <div className="card-content">
                    <p className="card-label">TỔNG ALBUM</p>
                    <h2 className="card-value">{stats.totalAlbums}</h2>
                  </div>
                </div>

                <div className="stat-card-modern blue">
                  <div className="card-icon">
                    <FaMusic size={32} />
                  </div>
                  <div className="card-content">
                    <p className="card-label">TỔNG BÀI HÁT</p>
                    <h2 className="card-value">{stats.totalSongs}</h2>
                  </div>
                </div>

                <div className="stat-card-modern green">
                  <div className="card-icon">
                    <MdPeopleAlt size={32} />
                  </div>
                  <div className="card-content">
                    <p className="card-label">NGHỆ SĨ</p>
                    <h2 className="card-value">{stats.totalArtists}</h2>
                  </div>
                </div>

                <div className="stat-card-modern pink">
                  <div className="card-icon">
                    <MdQueueMusic size={32} />
                  </div>
                  <div className="card-content">
                    <p className="card-label">THỂ LOẠI</p>
                    <h2 className="card-value">{stats.totalGenres}</h2>
                  </div>
                </div>

                <div className="stat-card-modern purple">
                  <div className="card-icon">
                    <FaUsers size={32} />
                  </div>
                  <div className="card-content">
                    <p className="card-label">NGƯỜI DÙNG</p>
                    <h2 className="card-value">{stats.totalUsers}</h2>
                  </div>
                </div>

                {/* Ẩn thẻ Playlist */}

                <div className="stat-card-modern teal">
                  <div className="card-icon">
                    <FaCompactDisc style={{ color: "#00bcd4" }} size={32} />
                  </div>
                  <div className="card-content">
                    <p className="card-label">GÓI DỊCH VỤ</p>
                    <h2 className="card-value">{stats.totalServicePlans || 0}</h2>
                  </div>
                </div>
              </div>

              <div className="tab-content">
                <h2>📊 Bảng Thống Kê</h2>
              </div>
              <div className="dashboard-statistics-embedded">
                <AdminStatistics />
              </div>
            </div>
          )}

          {/* Tab Thống Kê */}
          {activeTab === "stats" && (
            <div className="tab-content">
              <h2>📊 Thống kê chi tiết</h2>
              <AdminStatistics />
            </div>
          )}

          {/* Các Tab Quản lý */}
          {activeTab === "profile" && <div className="tab-content"><AdminProfileContent /></div>}
          {activeTab === "users" && <div className="tab-content"><UserManagementContent /></div>}
          {activeTab === "genres" && <div className="tab-content"><GenreManagementContent /></div>}
          {activeTab === "songs" && <div className="tab-content"><SongManagementContent setActiveTab={setActiveTab} openArtistAddModal={() => { setActiveTab('artists'); setShowArtistModal(true); }} /></div>}
          {activeTab === "albums" && <div className="tab-content"><AdminAlbums /></div>}
          {activeTab === "artists" && <div className="tab-content"><ArtistManagementContent showModal={showArtistModal} setShowModal={setShowArtistModal} /></div>}
          {activeTab === "top_songs" && (
            <div className="tab-content">
              <AdminTopSongs />
            </div>
          )}
          {activeTab === "playlists" && <PlaylistManagementContent />}
          {activeTab === "service_plans" && <ServicePlanManagement />}

  {activeTab === "orders" && <OrderManagementContent />}

        </div>
      </div>

      <ArtistModal
        isOpen={showArtistModal}
        onClose={() => {
          setShowArtistModal(false);
          setSelectedArtist(null);
        }}
        artist={selectedArtist}
        onSuccess={handleArtistModalSuccess}
      />
    </div>
  );
};

export default AdminDashboard;