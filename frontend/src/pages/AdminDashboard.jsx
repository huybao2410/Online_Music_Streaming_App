import React from "react";
import { useNavigate } from "react-router-dom";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>🎵 Admin Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>

      <div className="dashboard-content">
        <div className="card">
          <p>👤 Quản lý người dùng</p>
        </div>
        <div className="card">
          <p>🎶 Quản lý bài hát</p>
        </div>
        <div className="card">
          <p>📊 Thống kê hệ thống</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
