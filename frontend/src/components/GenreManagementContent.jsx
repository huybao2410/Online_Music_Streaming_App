import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes, FaMusic } from "react-icons/fa";
import axios from "axios";
import "./GenreManagementContent.css";

const NODE_API_URL = "http://localhost:5000/api";

export default function GenreManagementContent() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [currentGenre, setCurrentGenre] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  const fetchGenres = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${NODE_API_URL}/genres`);
      if (response.data.success) {
        setGenres(response.data.genres);
      }
    } catch (err) {
      console.error("Error fetching genres:", err);
      setError("Không thể tải danh sách thể loại");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, genre = null) => {
    setModalMode(mode);
    if (mode === "edit" && genre) {
      setCurrentGenre(genre);
      setFormData({
        name: genre.name || "",
        description: genre.description || "",
      });
    } else {
      setCurrentGenre(null);
      setFormData({
        name: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentGenre(null);
    setFormData({
      name: "",
      description: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn cần đăng nhập để thực hiện thao tác này.");
        return;
      }

      if (modalMode === "create") {
        const response = await axios.post(`${NODE_API_URL}/genres`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data.success) {
          setSuccess("Thêm thể loại thành công!");
          fetchGenres();
          closeModal();
        }
      } else {
        const response = await axios.put(
          `${NODE_API_URL}/genres/${currentGenre.genre_id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.data.success) {
          setSuccess("Cập nhật thể loại thành công!");
          fetchGenres();
          closeModal();
        }
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi lưu thể loại. Vui lòng thử lại."
      );
    }
  };

  const handleDelete = async (genreId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa thể loại này?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${NODE_API_URL}/genres/${genreId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSuccess("Xóa thể loại thành công!");
        fetchGenres();
      }
    } catch (err) {
      console.error("Error deleting genre:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi xóa thể loại. Vui lòng thử lại."
      );
    }
  };

  // Filter genres by search term
  const filteredGenres = genres.filter((genre) =>
    genre.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredGenres.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentGenres = filteredGenres.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (loading) {
    return <div className="genre-management-content loading">Đang tải...</div>;
  }

  return (
    <div className="genre-management-content">
      {/* Header */}
      <div className="content-header">
        <div>
          <h2>Quản lý thể loại nhạc</h2>
          <p className="subtitle">
            Quản lý danh sách thể loại nhạc trong hệ thống
          </p>
        </div>
        <button className="btn-primary" onClick={() => openModal("create")}>
          <FaPlus /> Thêm thể loại mới
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên thể loại..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div className="stats">
          Tổng: <strong>{filteredGenres.length}</strong> thể loại
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên thể loại</th>
              <th>Mô tả</th>
              <th>Số bài hát</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {currentGenres.map((genre) => (
              <tr key={genre.genre_id}>
                <td>{genre.genre_id}</td>
                <td className="genre-name">
                  <FaMusic className="genre-icon" /> {genre.name}
                </td>
                <td className="description">{genre.description || "Chưa có mô tả"}</td>
                <td>{genre.song_count} bài hát</td>
                <td>
                  <div className="action-btns">
                    <button
                      className="btn-icon edit"
                      onClick={() => openModal("edit", genre)}
                      title="Sửa"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-icon delete"
                      onClick={() => handleDelete(genre.genre_id)}
                      title="Xóa"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            « Trước
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i + 1}
              className={`page-btn ${currentPage === i + 1 ? "active" : ""}`}
              onClick={() => goToPage(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button
            className="page-btn"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Sau »
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === "create" ? "Thêm thể loại mới" : "Chỉnh sửa thể loại"}
              </h3>
              <button className="close-btn" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Tên thể loại *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Nhập tên thể loại..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Mô tả</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Nhập mô tả về thể loại nhạc..."
                  rows="4"
                />
                <small className="form-hint">Tối đa 500 ký tự</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {modalMode === "create" ? "Thêm" : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
