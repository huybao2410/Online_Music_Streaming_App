import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ArtistModal from "../components/ArtistModal";
import axios from "axios";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [showArtistModal, setShowArtistModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [artists, setArtists] = useState([]);
  const [isLoadingArtists, setIsLoadingArtists] = useState(false);

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

  // Fetch artists when tab changes
  useEffect(() => {
    if (activeTab === "artists") {
      fetchArtists();
    }
  }, [activeTab]);

  const fetchArtists = async () => {
    setIsLoadingArtists(true);
    try {
      const response = await axios.get("http://localhost:5000/api/artists");
      if (response.data.success) {
        setArtists(response.data.artists);
      }
    } catch (error) {
      console.error("Error fetching artists:", error);
      alert("Lỗi khi tải danh sách nghệ sĩ");
    } finally {
      setIsLoadingArtists(false);
    }
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

  const [songs] = useState([
    { id: 1, title: "Chill Vibes", artist: "Artist A", plays: 2450, uploaded: "2024-01-20", status: "Active" },
    { id: 2, title: "Summer Hits", artist: "Artist B", plays: 3120, uploaded: "2024-02-15", status: "Active" },
    { id: 3, title: "Night Drive", artist: "Artist C", plays: 1890, uploaded: "2024-03-05", status: "Inactive" },
  ]);

  const stats = [
    { label: "Tổng Người Dùng", value: "1,234", icon: "👤", color: "#00c4cc" },
    { label: "Tổng Bài Hát", value: "5,678", icon: "🎶", color: "#ffd700" },
    { label: "Lượt Phát", value: "45.2K", icon: "▶️", color: "#ff6b9d" },
    { label: "Lượt Tải", value: "12.5K", icon: "📥", color: "#a78bfa" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleDeleteSong = (id) => alert(`Xóa bài hát #${id}`);
  const handleAddSong = () => alert("Mở form thêm bài hát mới");

  // Fetch data when tab changes
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'artists') {
      fetchArtists();
    }
  }, [activeTab]);

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="header-left">
          <h1>🎵 Quản Lý Ứng Dụng</h1>
          <p>Quản lý ứng dụng nghe nhạc trực tuyến</p>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>

      {/* Navigation */}
      <div className="admin-nav">
        <button
          className={`nav-btn ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          📊 Thống Kê
        </button>
        <button
          className={`nav-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setActiveTab("users")}
        >
          👥 Quản Lý Người Dùng
        </button>
        <button
          className={`nav-btn ${activeTab === "songs" ? "active" : ""}`}
          onClick={() => setActiveTab("songs")}
        >
          🎶 Quản Lý Bài Hát
        </button>
        <button
          className={`nav-btn ${activeTab === "artists" ? "active" : ""}`}
          onClick={() => setActiveTab("artists")}
        >
          🎤 Quản Lý Nghệ Sĩ
        </button>
      </div>

      {/* Content */}
      <div className="admin-content">
        {/* === THỐNG KÊ === */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <h2>📊 Thống Kê Hệ Thống</h2>

            <div className="stats-grid">
              {stats.map((stat, i) => (
                <div key={i} className="stat-card" style={{ borderLeftColor: stat.color }}>
                  <div className="stat-icon">{stat.icon}</div>
                  <div>
                    <p className="stat-label">{stat.label}</p>
                    <p className="stat-value">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="charts-section">
              <div className="chart-card">
                <h3>📈 Lượt Phát (7 Ngày Gần Đây)</h3>
                <div className="chart-placeholder">
                  {["40%", "60%", "55%", "75%", "70%", "85%", "90%"].map((h, i) => (
                    <div key={i} className="bar" style={{ height: h }}></div>
                  ))}
                </div>
              </div>

              <div className="chart-card">
                <h3>🎯 Top 5 Bài Hát Yêu Thích</h3>
                <div className="top-songs-list">
                  {[
                    ["Summer Hits - Artist B", "3.1K"],
                    ["Chill Vibes - Artist A", "2.4K"],
                    ["Night Drive - Artist C", "1.8K"],
                    ["Weekend Mood - Artist D", "1.5K"],
                    ["Love Story - Artist E", "1.2K"],
                  ].map(([title, plays], i) => (
                    <div key={i} className="top-item">
                      <span className="rank">{i + 1}.</span>
                      <span className="title">{title}</span>
                      <span className="plays">{plays} plays</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* === NGƯỜI DÙNG === */}
        {activeTab === "users" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>👥 Quản Lý Người Dùng ({users.length})</h2>
              <div className="header-actions">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Tìm kiếm theo tên hoặc email..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                />
                <button className="search-btn" onClick={fetchUsers}>🔍 Tìm</button>
              </div>
            </div>

            {isLoadingUsers ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Đang tải danh sách người dùng...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <p>Không tìm thấy người dùng nào</p>
              </div>
            ) : (
              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên Người Dùng</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Trạng Thái</th>
                      <th>Playlist</th>
                      <th>Yêu Thích</th>
                      <th>Ngày Tham Gia</th>
                      <th>Hành Động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>#{u.id}</td>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.email}</td>
                        <td>
                          <select
                            className={`role-select ${u.role}`}
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className={`status-select ${u.status}`}
                            value={u.status}
                            onChange={(e) => handleUpdateUserStatus(u.id, e.target.value)}
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="banned">Banned</option>
                          </select>
                        </td>
                        <td>{u.playlist_count || 0}</td>
                        <td>{u.favorite_count || 0}</td>
                        <td>{new Date(u.created_at).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <button 
                            className="action-btn delete" 
                            onClick={() => handleDeleteUser(u.id, u.username)}
                            title="Xóa người dùng"
                          >
                            🗑️
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

        {/* === BÀI HÁT === */}
        {activeTab === "songs" && (
          <div className="tab-content">
            <div className="tab-header">
              <h2>🎶 Quản Lý Bài Hát</h2>
              <button className="add-btn" onClick={handleAddSong}>➕ Thêm Bài Hát</button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên Bài Hát</th>
                    <th>Nghệ Sĩ</th>
                    <th>Lượt Phát</th>
                    <th>Ngày Upload</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {songs.map((s) => (
                    <tr key={s.id}>
                      <td>#{s.id}</td>
                      <td>{s.title}</td>
                      <td>{s.artist}</td>
                      <td>{s.plays.toLocaleString()}</td>
                      <td>{s.uploaded}</td>
                      <td><span className={`status-badge ${s.status.toLowerCase()}`}>{s.status}</span></td>
                      <td>
                        <button className="action-btn edit">✏️ Sửa</button>
                        <button className="action-btn delete" onClick={() => handleDeleteSong(s.id)}>🗑️ Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* === NGHỆ SĨ === */}
        {activeTab === "artists" && (
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
