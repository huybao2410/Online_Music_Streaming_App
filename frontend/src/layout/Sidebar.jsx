import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <aside className="sidebar">
      <div className="sidebar-menu">
        <div onClick={() => navigate("/home")} className="sidebar-item">Khám Phá</div>
        <div onClick={() => navigate("/top")} className="sidebar-item">Hàng Đầu</div>
        <div onClick={() => navigate("/favorite")} className="sidebar-item">Yêu Thích</div>
        <div onClick={() => navigate("/playlist")} className="sidebar-item">Danh Sách Phát</div>
        <div onClick={() => navigate("/premium")} className="sidebar-item premium-link">
          Premium
        </div>

        {isLoggedIn && (
          <button className="upload-btn" onClick={() => navigate("/upload")}>
            ⬆️ Upload bài hát
          </button>
        )}
      </div>
    </aside>
  );
}
