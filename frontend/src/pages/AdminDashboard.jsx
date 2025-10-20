import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");

  const [users] = useState([
    { id: 1, name: "Nguyễn Văn A", email: "nguyena@example.com", joinDate: "2024-01-15", status: "Active" },
    { id: 2, name: "Trần Thị B", email: "tranb@example.com", joinDate: "2024-02-20", status: "Active" },
    { id: 3, name: "Lê Văn C", email: "levc@example.com", joinDate: "2024-03-10", status: "Inactive" },
  ]);

  const [songs] = useState([
    { id: 1, title: "Chill Vibes", artist: "Artist A", plays: 2450, uploaded: "2024-01-20", status: "Active" },
    { id: 2, title: "Summer Hits", artist: "Artist B", plays: 3120, uploaded: "2024-02-15", status: "Active" },
    { id: 3, title: "Night Drive", artist: "Artist C", plays: 1890, uploaded: "2024-03-05", status: "Inactive" },
  ]);

  const [artists] = useState([
    { id: 1, name: "Artist A", genre: "Pop", followers: 5200, joined: "2023-10-01", status: "Active" },
    { id: 2, name: "Artist B", genre: "Rock", followers: 4100, joined: "2023-12-12", status: "Active" },
    { id: 3, name: "Artist C", genre: "Indie", followers: 2750, joined: "2024-01-08", status: "Inactive" },
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

  const handleDeleteUser = (id) => alert(`Xóa người dùng #${id}`);
  const handleDeleteSong = (id) => alert(`Xóa bài hát #${id}`);
  const handleDeleteArtist = (id) => alert(`Xóa nghệ sĩ #${id}`);
  const handleAddUser = () => alert("Mở form thêm người dùng mới");
  const handleAddSong = () => alert("Mở form thêm bài hát mới");
  const handleAddArtist = () => alert("Mở form thêm nghệ sĩ mới");

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
              <h2>👥 Quản Lý Người Dùng</h2>
              <button className="add-btn" onClick={handleAddUser}>➕ Thêm Người Dùng</button>
            </div>
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên Người Dùng</th>
                    <th>Email</th>
                    <th>Ngày Tham Gia</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>#{u.id}</td>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>{u.joinDate}</td>
                      <td><span className={`status-badge ${u.status.toLowerCase()}`}>{u.status}</span></td>
                      <td>
                        <button className="action-btn edit">✏️ Sửa</button>
                        <button className="action-btn delete" onClick={() => handleDeleteUser(u.id)}>🗑️ Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
            <div className="table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên Nghệ Sĩ</th>
                    <th>Thể Loại</th>
                    <th>Lượt Theo Dõi</th>
                    <th>Ngày Gia Nhập</th>
                    <th>Trạng Thái</th>
                    <th>Hành Động</th>
                  </tr>
                </thead>
                <tbody>
                  {artists.map((a) => (
                    <tr key={a.id}>
                      <td>#{a.id}</td>
                      <td>{a.name}</td>
                      <td>{a.genre}</td>
                      <td>{a.followers.toLocaleString()}</td>
                      <td>{a.joined}</td>
                      <td><span className={`status-badge ${a.status.toLowerCase()}`}>{a.status}</span></td>
                      <td>
                        <button className="action-btn edit">✏️ Sửa</button>
                        <button className="action-btn delete" onClick={() => handleDeleteArtist(a.id)}>🗑️ Xóa</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
