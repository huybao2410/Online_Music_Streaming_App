import React, { useState } from "react";
import { FaHeart, FaSearch, FaUser, FaMusic, FaCompactDisc, FaTimes } from "react-icons/fa";
import "./FavoriteManagementContent.css";

// Dữ liệu mẫu
const sampleFavorites = [
  { id: 1, type: "song", name: "Ai biết", user: "user1", date: "2025-12-17" },
  { id: 2, type: "artist", name: "Negav", user: "user2", date: "2025-12-17" },
  { id: 3, type: "album", name: "Best Hits", user: "user3", date: "2025-12-17" },
  { id: 4, type: "song", name: "Năm Tháng Ấy", user: "user4", date: "2025-12-17" },
  { id: 5, type: "artist", name: "GreenD", user: "user5", date: "2025-12-17" },
  { id: 6, type: "album", name: "Chill Vibes", user: "user6", date: "2025-12-17" },
];

const typeLabel = {
  song: { label: "Bài hát", icon: <FaMusic className="favorite-type-icon" /> },
  artist: { label: "Nghệ sĩ", icon: <FaUser className="favorite-type-icon" /> },
  album: { label: "Album", icon: <FaCompactDisc className="favorite-type-icon" /> },
};

export default function FavoriteManagementContent() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  // Alert state demo
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filtered data
  const filteredFavorites = sampleFavorites.filter(fav =>
    fav.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fav.user.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentFavorites = filteredFavorites.slice(startIndex, startIndex + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="favorite-management-content">
      {/* Header */}
      <div className="content-header">
        <div>
          <h2><FaHeart style={{ color: "#e11d48", marginRight: 8 }} /> Quản lý lượt thích</h2>
          <p className="subtitle">Quản lý các lượt yêu thích bài hát, nghệ sĩ, album trong hệ thống</p>
        </div>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error} <button onClick={() => setError("")}><FaTimes /></button></div>}
      {success && <div className="alert alert-success">{success} <button onClick={() => setSuccess("")}><FaTimes /></button></div>}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm tên, người dùng..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className="stats">
          Tổng: <strong>{filteredFavorites.length}</strong> lượt thích
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Loại</th>
              <th>Tên</th>
              <th>Người dùng</th>
              <th>Ngày thích</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {currentFavorites.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "#6b7280" }}>Không có dữ liệu</td></tr>
            ) : currentFavorites.map(fav => (
              <tr key={fav.id}>
                <td>{fav.id}</td>
                <td className="favorite-type">
                  {typeLabel[fav.type]?.icon} {typeLabel[fav.type]?.label}
                </td>
                <td>{fav.name}</td>
                <td>{fav.user}</td>
                <td>{fav.date}</td>
                <td>
                  <button className="favorite-action-btn">Xem</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>« Trước</button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button className="page-btn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Sau »</button>
        </div>
      )}
    </div>
  );
}
