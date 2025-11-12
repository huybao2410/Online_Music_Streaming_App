import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaTachometerAlt, 
  FaMusic, 
  FaUsers, 
  FaHistory, 
  FaUserCircle,
  FaSignOutAlt
} from "react-icons/fa";
import { 
  MdDashboard, 
  MdQueueMusic, 
  MdPeopleAlt, 
} from "react-icons/md";
import { IoMdNotifications } from "react-icons/io";
import "./AdminLayout.css";

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const username = localStorage.getItem("username") || "Admin";

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
      navigate("/login");
    }
  };

  return (
    <div className="admin-layout-container">
      {/* Sidebar */}
      <aside className="admin-layout-sidebar">
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
              className={`nav-item ${isActive("/admin") ? "active" : ""}`}
              onClick={() => navigate("/admin")}
            >
              <FaTachometerAlt />
              <span>Dashboard</span>
            </button>
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">QUẢN LÝ</h4>
            <button
              className={`nav-item ${isActive("/admin/songs") ? "active" : ""}`}
              onClick={() => navigate("/admin/songs")}
            >
              <FaMusic />
              <span>Bài hát</span>
            </button>
            <button
              className={`nav-item ${isActive("/admin/artists") ? "active" : ""}`}
              onClick={() => navigate("/admin/artists")}
            >
              <MdPeopleAlt />
              <span>Nghệ sĩ</span>
            </button>
            <button
              className={`nav-item ${isActive("/admin/users") ? "active" : ""}`}
              onClick={() => navigate("/admin/users")}
            >
              <FaUsers />
              <span>Người dùng</span>
            </button>
          </div>

          <div className="nav-section">
            <h4 className="nav-section-title">HỆ THỐNG</h4>
            <button className="nav-item" onClick={() => navigate("/")}>
              <FaHistory />
              <span>Về trang chủ</span>
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <FaUserCircle className="user-avatar" />
            <div>
              <p className="user-name">{username}</p>
              <p className="user-role">Administrator</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="admin-layout-main">
        <header className="admin-layout-header">
          <div className="header-left">
            <h2>
              {isActive("/admin/songs") && "Quản lý bài hát"}
              {isActive("/admin/artists") && "Quản lý nghệ sĩ"}
              {isActive("/admin/users") && "Quản lý người dùng"}
              {isActive("/admin") && "Tổng quan hệ thống"}
            </h2>
          </div>
          <div className="header-right">
            <button className="notification-btn">
              <IoMdNotifications />
              <span className="badge">3</span>
            </button>
          </div>
        </header>

        <main className="admin-layout-content">
          {children}
        </main>
      </div>
    </div>
  );
}
