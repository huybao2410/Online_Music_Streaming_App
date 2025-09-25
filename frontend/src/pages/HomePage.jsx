import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

const Homepage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="homepage">
      {/* Header */}
      <div className="homepage-header">
        <h1>🎧 My Music App</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Đăng xuất
        </button>
      </div>

      {/* Content */}
      <div className="homepage-content">
        <h2>🔥 Playlist nổi bật</h2>
        <div className="playlist-grid">
          <div className="playlist-card">
            <img src="https://placehold.co/200x200" alt="playlist1" />
            <p>Top Hits 2025</p>
          </div>
          <div className="playlist-card">
            <img src="https://placehold.co/200x200" alt="playlist2" />
            <p>Acoustic Chill</p>
          </div>
          <div className="playlist-card">
            <img src="https://placehold.co/200x200" alt="playlist3" />
            <p>Rap Việt</p>
          </div>
          <div className="playlist-card">
            <img src="https://placehold.co/200x200" alt="playlist4" />
            <p>K-Pop Hot</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
