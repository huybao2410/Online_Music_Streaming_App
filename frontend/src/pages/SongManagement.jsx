import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaMusic, FaDownload, FaTimes } from "react-icons/fa";
import axios from "axios";
import AdminLayout from "../layout/AdminLayout";
import "./SongManagement.css";

const API_URL = "http://localhost:5000/api";

function SongManagement() {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArtist, setFilterArtist] = useState("");
  const [filterGenre, setFilterGenre] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [currentSong, setCurrentSong] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    genre: "",
    album: "",
    duration: 0,
    cover: null,
    audio: null,
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSongs, setTotalSongs] = useState(0);
  const songsPerPage = 10;

  // Fetch data on mount
  useEffect(() => {
    fetchSongs();
    fetchArtists();
    fetchGenres();
  }, [currentPage, searchTerm, filterArtist]);

  // Fetch songs from API
  const fetchSongs = async () => {
    try {
      setLoading(true);
      const offset = (currentPage - 1) * songsPerPage;
      const params = {
        limit: songsPerPage,
        offset: offset,
      };

      if (searchTerm) params.search = searchTerm;
      if (filterArtist) params.artist_id = filterArtist;

      const response = await axios.get(`${API_URL}/songs`, { params });
      
      if (response.data.success) {
        setSongs(response.data.songs || []);
        setTotalSongs(response.data.total || 0);
        setError("");
      }
    } catch (err) {
      console.error("Error fetching songs:", err);
      setError("Không thể tải danh sách bài hát. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch artists
  const fetchArtists = async () => {
    try {
      const response = await axios.get(`${API_URL}/artists`);
      if (response.data.success) {
        setArtists(response.data.artists || []);
      }
    } catch (err) {
      console.error("Error fetching artists:", err);
    }
  };

  // Fetch genres from database
  const fetchGenres = async () => {
    // Mock genres - bạn có thể tạo API endpoint riêng nếu cần
    setGenres([
      "Pop", "Rock", "Hip Hop", "R&B", "Country", "Jazz", "Blues",
      "Electronic", "Dance", "EDM", "Ballad", "Indie", "Reggae",
      "K-Pop", "J-Pop", "Latin", "Classical", "Lo-fi", "Acoustic",
      "Rap", "Soul", "Alternative", "V-Pop", "Bolero"
    ]);
  };

  // Open modal for create/edit
  const openModal = (mode, song = null) => {
    setModalMode(mode);
    setCurrentSong(song);

    if (mode === "edit" && song) {
      setFormData({
        title: song.title || "",
        artist_id: song.artist_id || "",
        genre: song.genre || "",
        album: song.album || "",
        duration: song.duration || 0,
        cover: null,
        audio: null,
      });
    } else {
      setFormData({
        title: "",
        artist_id: "",
        genre: "",
        album: "",
        duration: 0,
        cover: null,
        audio: null,
      });
    }

    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setCurrentSong(null);
    setFormData({
      title: "",
      artist_id: "",
      genre: "",
      album: "",
      duration: 0,
      cover: null,
      audio: null,
    });
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file upload
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  // Submit form (create or update)
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

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("artist_id", formData.artist_id);
      formDataToSend.append("genre", formData.genre);
      formDataToSend.append("album", formData.album);
      formDataToSend.append("duration", formData.duration);

      if (formData.cover) {
        formDataToSend.append("cover", formData.cover);
      }
      if (formData.audio) {
        formDataToSend.append("audio", formData.audio);
      }

      if (modalMode === "create") {
        // Create new song
        const response = await axios.post(`${API_URL}/songs`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          setSuccess("Thêm bài hát thành công!");
          fetchSongs();
          closeModal();
        }
      } else {
        // Update existing song
        const response = await axios.put(
          `${API_URL}/songs/${currentSong.id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          setSuccess("Cập nhật bài hát thành công!");
          fetchSongs();
          closeModal();
        }
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi lưu bài hát. Vui lòng thử lại."
      );
    }
  };

  // Delete song
  const handleDelete = async (songId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài hát này?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${API_URL}/songs/${songId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSuccess("Xóa bài hát thành công!");
        fetchSongs();
      }
    } catch (err) {
      console.error("Error deleting song:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi xóa bài hát. Vui lòng thử lại."
      );
    }
  };

  // Pagination
  const totalPages = Math.ceil(totalSongs / songsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Format duration (seconds to mm:ss)
  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <AdminLayout>
    <div className="song-management">
      <div className="song-management-header">
        <h1>
          <FaMusic /> Quản lý bài hát
        </h1>
        <button className="btn-add" onClick={() => openModal("create")}>
          <FaPlus /> Thêm bài hát mới
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")}>
            <FaTimes />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>
            <FaTimes />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="filters">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên bài hát hoặc nghệ sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="filter-select"
          value={filterArtist}
          onChange={(e) => setFilterArtist(e.target.value)}
        >
          <option value="">Tất cả nghệ sĩ</option>
          {artists.map((artist) => (
            <option key={artist.id} value={artist.id}>
              {artist.name}
            </option>
          ))}
        </select>

        <button className="btn-reset" onClick={() => {
          setSearchTerm("");
          setFilterArtist("");
          setCurrentPage(1);
        }}>
          Đặt lại bộ lọc
        </button>
      </div>

      {/* Stats */}
      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Tổng số bài hát:</span>
          <span className="stat-value">{totalSongs}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Trang hiện tại:</span>
          <span className="stat-value">{currentPage} / {totalPages}</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : songs.length === 0 ? (
        <div className="no-data">Không có bài hát nào.</div>
      ) : (
        <>
          <div className="table-container">
            <table className="songs-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cover</th>
                  <th>Tên bài hát</th>
                  <th>Nghệ sĩ</th>
                  <th>Thể loại</th>
                  <th>Album</th>
                  <th>Thời lượng</th>
                  <th>Ngày tạo</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.id}>
                    <td>{song.id}</td>
                    <td>
                      {song.cover_url ? (
                        <img
                          src={
                            song.cover_url.startsWith("http")
                              ? song.cover_url
                              : `http://localhost:5000${song.cover_url}`
                          }
                          alt={song.title}
                          className="song-cover-thumb"
                        />
                      ) : (
                        <div className="no-cover">
                          <FaMusic />
                        </div>
                      )}
                    </td>
                    <td className="song-title">{song.title}</td>
                    <td>{song.artist_name || "Chưa có"}</td>
                    <td>{song.genre || "Chưa rõ"}</td>
                    <td>{song.album || "-"}</td>
                    <td>{formatDuration(song.duration)}</td>
                    <td>{new Date(song.created_at).toLocaleDateString("vi-VN")}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-edit"
                          onClick={() => openModal("edit", song)}
                          title="Chỉnh sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => handleDelete(song.id)}
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
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              « Trước
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 2 && page <= currentPage + 2)
              ) {
                return (
                  <button
                    key={page}
                    className={`page-btn ${page === currentPage ? "active" : ""}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 3 || page === currentPage + 3) {
                return <span key={page} className="page-dots">...</span>;
              }
              return null;
            })}

            <button
              className="page-btn"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau »
            </button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalMode === "create" ? "Thêm bài hát mới" : "Chỉnh sửa bài hát"}
              </h2>
              <button className="modal-close" onClick={closeModal}>
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>
                  Tên bài hát <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Nhập tên bài hát..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Nghệ sĩ <span className="required">*</span>
                  </label>
                  <select
                    name="artist_id"
                    value={formData.artist_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Chọn nghệ sĩ --</option>
                    {artists.map((artist) => (
                      <option key={artist.id} value={artist.id}>
                        {artist.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Thể loại</label>
                  <select
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Chọn thể loại --</option>
                    {genres.map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Album</label>
                  <input
                    type="text"
                    name="album"
                    value={formData.album}
                    onChange={handleInputChange}
                    placeholder="Tên album (tùy chọn)"
                  />
                </div>

                <div className="form-group">
                  <label>Thời lượng (giây)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    placeholder="180"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ảnh bìa {modalMode === "create" && <span className="optional">(khuyến nghị)</span>}</label>
                <input
                  type="file"
                  name="cover"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <small>Định dạng: JPG, PNG, WEBP. Tối đa 5MB.</small>
              </div>

              <div className="form-group">
                <label>
                  File nhạc {modalMode === "create" && <span className="required">*</span>}
                </label>
                <input
                  type="file"
                  name="audio"
                  accept="audio/*"
                  onChange={handleFileChange}
                  required={modalMode === "create"}
                />
                <small>Định dạng: MP3, WAV, M4A, FLAC. Tối đa 50MB.</small>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn-submit">
                  {modalMode === "create" ? "Thêm bài hát" : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
    </AdminLayout>
  );
}

export default SongManagement;
