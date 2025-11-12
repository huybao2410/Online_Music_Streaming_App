import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArtistModal from "../components/ArtistModal";
import SongManagementContent from "../components/SongManagementContent";
import ArtistManagementContent from "../components/ArtistManagementContent";
import UserManagementContent from "../components/UserManagementContent";
import AdminProfileContent from "../components/AdminProfileContent";
import GenreManagementContent from "../components/GenreManagementContent";
import axios from "axios";
import { 
  FaTachometerAlt, 
  FaMusic, 
  FaUsers, 
  FaHistory, 
  FaUserCircle,
  FaCheckCircle,
  FaClock
} from "react-icons/fa";
import { 
  MdDashboard, 
  MdQueueMusic, 
  MdPeopleAlt, 
  MdSchedule 
} from "react-icons/md";
import { IoMdNotifications, IoMdSearch } from "react-icons/io";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artists, setArtists] = useState([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [stats, setStats] = useState({
    totalSongs: 0,
    totalArtists: 0,
    totalUsers: 0,
    totalPlaylists: 0,
    totalGenres: 0
  });
  const [adminAvatar, setAdminAvatar] = useState(null);
  
  const username = localStorage.getItem("username");

  // Get token once
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
    fetchAdminProfile();
  }, []);

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

  // Listen to storage event to update avatar when changed
  useEffect(() => {
    const handleStorageChange = () => {
      fetchAdminProfile();
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // NOTE: artist data is now loaded by the ArtistManagementContent component itself (from PHP API).
  // Keep this effect only for legacy/old artists tab if needed in future.
  useEffect(() => {
    if (activeTab === "artists_old") {
      fetchArtists();
    }
  }, [activeTab]);

  // legacy fetchArtists kept as a fallback for the old artists tab
  const fetchArtists = async () => {
    console.log("fetchArtists called from AdminDashboard (legacy). ArtistManagementContent handles artist loading now.");
    // No-op by default to avoid calling Node API when backend may be down.
  };

  const handleAddArtist = () => {
    setSelectedArtist(null);
    setShowArtistModal(true);
  };

  const handleEditArtist = (artist) => {
    setSelectedArtist(artist);
    setShowArtistModal(true);
  };

  const handleDeleteArtist = async (id, name) => {
    if (!window.confirm(`Bạn có chắc muốn xóa nghệ sĩ "${name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `http://localhost:5000/api/artists/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        alert("Xóa nghệ sĩ thành công");
        fetchArtists();
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xóa nghệ sĩ");
    }
  };

  const handleArtistModalSuccess = () => {
    fetchArtists();
  };

  // User Management
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [searchUser, setSearchUser] = useState('');

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true);
      console.log('Fetching users with token:', token);
      
      const response = await axios.get('/api/admin/users', {
        params: { search: searchUser || undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Users response:', response.data);
      
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.response?.status === 401) {
        alert('Session hết hạn. Vui lòng đăng nhập lại.');
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
      } else {
        alert(`Lỗi khi tải danh sách người dùng: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    if (!window.confirm(`Bạn có chắc muốn đổi role thành "${newRole}"?`)) {
      return;
    }

    try {
      const response = await axios.patch(
        `/api/admin/users/${userId}/role`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Cập nhật role thành công!');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.message || 'Lỗi khi cập nhật role');
    }
  };

  const handleUpdateUserStatus = async (userId, newStatus) => {
    if (!window.confirm(`Bạn có chắc muốn đổi trạng thái thành "${newStatus}"?`)) {
      return;
    }

    try {
      const response = await axios.patch(
        `/api/admin/users/${userId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Cập nhật trạng thái thành công!');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`Bạn có chắc muốn xóa người dùng "${username}"?\nHành động này không thể hoàn tác!`)) {
      return;
    }

    try {
      const response = await axios.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        alert('Xóa người dùng thành công!');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Lỗi khi xóa người dùng');
    }
  };

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log("Fetching dashboard stats from PHP API...");
        
        // Lấy stats từ PHP API và Node.js API
        const [songsRes, artistsRes, usersRes, genresRes] = await Promise.all([
          axios.get("http://localhost:8081/music_API/online_music/song/get_songs.php"),
          axios.get("http://localhost:8081/music_API/online_music/artist/get_artists.php"),
          axios.get("/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => ({ data: { users: [] } })),
          axios.get("http://localhost:5000/api/genres").catch(() => ({ data: { genres: [] } }))
        ]);
        
        const totalSongs = songsRes.data?.status && songsRes.data?.songs 
          ? songsRes.data.songs.length 
          : 0;
          
        const totalArtists = artistsRes.data?.status === "success" && artistsRes.data?.artists
          ? artistsRes.data.artists.length
          : 0;
          
        const totalUsers = usersRes.data?.users?.length || 0;
        
        const totalGenres = genresRes.data?.genres?.length || 0;
        
        console.log(`Stats: ${totalSongs} songs, ${totalArtists} artists, ${totalUsers} users, ${totalGenres} genres`);
        
        setStats({
          totalSongs,
          totalArtists,
          totalUsers,
          totalPlaylists: 0, // Tạm thời set 0, có thể thêm API sau
          totalGenres
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
        setStats({
          totalSongs: 0,
          totalArtists: 0,
          totalUsers: 0,
          totalPlaylists: 0,
          totalGenres: 0
        });
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

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'artists') {
      fetchArtists();
    }
  }, [activeTab]);

  const getCurrentDate = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  };

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <FaMusic className="logo-icon" />
            <div>
              <h3>Music Streaming</h3>
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
            <button
              className={`nav-item ${activeTab === "stats" ? "active" : ""}`}
              onClick={() => setActiveTab("stats")}
            >
              <MdDashboard />
              <span>Thống kê</span>
            </button>
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">QUẢN LÝ</h4>
            <button
              className={`nav-item ${activeTab === "songs" ? "active" : ""}`}
              onClick={() => setActiveTab("songs")}
            >
              <FaMusic />
              <span>Bài hát</span>
            </button>
            <button
              className={`nav-item ${activeTab === "artists" ? "active" : ""}`}
              onClick={() => setActiveTab("artists")}
            >
              <MdPeopleAlt />
              <span>Nghệ sĩ</span>
            </button>
            <button
              className={`nav-item ${activeTab === "genres" ? "active" : ""}`}
              onClick={() => setActiveTab("genres")}
            >
              <FaMusic />
              <span>Thể loại</span>
            </button>
            <button
              className={`nav-item ${activeTab === "users" ? "active" : ""}`}
              onClick={() => setActiveTab("users")}
            >
              <FaUsers />
              <span>Người dùng</span>
            </button>
            <button
              className={`nav-item ${activeTab === "playlists" ? "active" : ""}`}
              onClick={() => setActiveTab("playlists")}
            >
              <MdQueueMusic />
              <span>Playlist</span>
            </button>
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">HỆ THỐNG</h4>
            <button className="nav-item">
              <FaHistory />
              <span>Lịch sử hoạt động</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="admin-main">
        {/* Top Header */}
        <header className="admin-top-header">
          <div className="header-search">
            <div className="search-wrapper">
              <div className="search-icon-wrapper">
                <IoMdSearch size={18} />
              </div>
              <input 
                type="text" 
                placeholder="Tìm kiếm..." 
                className="header-search-input" 
              />
            </div>
          </div>
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
                    src={adminAvatar} 
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
        {/* === THỐNG KÊ === */}
        {activeTab === "overview" && (
          <div className="dashboard-overview">
            {/* Page Title */}
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

              <div className="stat-card-modern orange">
                <div className="card-icon">
                  <MdQueueMusic size={32} />
                </div>
                <div className="card-content">
                  <p className="card-label">PLAYLIST</p>
                  <h2 className="card-value">{stats.totalPlaylists}</h2>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
              <h3>⚡ Hành Động Nhanh</h3>
              <div className="quick-actions-grid">
                <button 
                  className="quick-action-card"
                  onClick={() => setActiveTab("songs")}
                >
                  <div className="action-icon blue">
                    <FaMusic size={28} />
                  </div>
                  <p>Quản Lý Bài Hát</p>
                </button>

                <button 
                  className="quick-action-card"
                  onClick={() => setActiveTab("artists")}
                >
                  <div className="action-icon green">
                    <MdPeopleAlt size={28} />
                  </div>
                  <p>Quản Lý Nghệ Sĩ</p>
                </button>

                <button 
                  className="quick-action-card"
                  onClick={() => setActiveTab("genres")}
                >
                  <div className="action-icon pink">
                    <MdQueueMusic size={28} />
                  </div>
                  <p>Quản Lý Thể Loại</p>
                </button>

                <button 
                  className="quick-action-card"
                  onClick={() => setActiveTab("users")}
                >
                  <div className="action-icon purple">
                    <FaUsers size={28} />
                  </div>
                  <p>Quản Lý Người Dùng</p>
                </button>

                <button 
                  className="quick-action-card"
                  onClick={() => setActiveTab("playlists")}
                >
                  <div className="action-icon orange">
                    <MdQueueMusic size={28} />
                  </div>
                  <p>Quản Lý Playlist</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* === HỒ SƠ === */}
        {activeTab === "profile" && (
          <div className="tab-content">
            <AdminProfileContent />
          </div>
        )}

        {/* === NGƯỜI DÙNG === */}
        {activeTab === "users" && (
          <div className="tab-content">
            <UserManagementContent />
          </div>
        )}

        {/* === THỂ LOẠI === */}
        {activeTab === "genres" && (
          <div className="tab-content">
            <GenreManagementContent />
          </div>
        )}

        {/* === BÀI HÁT === */}
        {activeTab === "songs" && (
          <div className="tab-content">
            <SongManagementContent />
          </div>
        )}

        {/* === NGHỆ SĨ === */}
        {activeTab === "artists" && (
          <div className="tab-content">
            <ArtistManagementContent />
          </div>
        )}

        {/* OLD ARTIST TABLE - BACKUP */}
        {activeTab === "artists_old" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>🎤 Quản Lý Nghệ Sĩ</h2>
              <button className="add-btn" onClick={handleAddArtist}>➕ Thêm Nghệ Sĩ</button>
            </div>
            
            {isLoadingArtists ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải...</p>
              </div>
            ) : artists.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có nghệ sĩ nào</p>
                <button className="add-btn" onClick={handleAddArtist}>➕ Thêm nghệ sĩ đầu tiên</button>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Ảnh</th>
                      <th>Tên Nghệ Sĩ</th>
                      <th>Số Bài Hát</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artists.map((artist) => (
                      <tr key={artist.id}>
                        <td>#{artist.id}</td>
                        <td>
                          <div className="artist-avatar">
                            {artist.avatar_url ? (
                              <img src={artist.avatar_url} alt={artist.name} />
                            ) : (
                              <div className="avatar-placeholder">👤</div>
                            )}
                          </div>
                        </td>
                        <td className="artist-name">{artist.name}</td>
                        <td>{artist.song_count || 0} bài hát</td>
                        <td className="action-cell">
                          <button 
                            className="action-btn edit"
                            onClick={() => handleEditArtist(artist)}
                          >
                            ✏️ Sửa
                          </button>
                          <button 
                            className="action-btn delete"
                            onClick={() => handleDeleteArtist(artist.id, artist.name)}
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        </div>
      </div>

      {/* Artist Modal */}
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
