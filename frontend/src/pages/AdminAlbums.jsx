
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaMusic, FaTimes } from "react-icons/fa";
import "../components/SongManagementContent.css";

function AdminAlbums() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentAlbum, setCurrentAlbum] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    artist_id: "",
    description: "",
    release_date: "",
    cover_url: "",
    song_ids: []
  });

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/admin/albums");
      setAlbums(res.data.albums || []);
    } catch (err) {
      setError("Không thể tải danh sách album");
    }
    setLoading(false);
  };

  const openModal = (mode, album = null) => {
    setModalMode(mode);
    setCurrentAlbum(album);
    if (mode === "edit" && album) {
      setFormData({
        name: album.name || "",
        artist_id: album.artist_id || "",
        description: album.description || "",
        release_date: album.release_date || "",
        cover_url: album.cover_url || "",
        song_ids: album.song_ids || []
      });
    } else {
      setFormData({
        name: "",
        artist_id: "",
        description: "",
        release_date: "",
        cover_url: "",
        song_ids: []
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentAlbum(null);
    setFormData({
      name: "",
      artist_id: "",
      description: "",
      release_date: "",
      cover_url: "",
      song_ids: []
    });
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === "create") {
        await axios.post("/api/admin/albums", formData);
        setSuccess("Thêm album thành công!");
      } else if (modalMode === "edit" && currentAlbum) {
        await axios.put(`/api/admin/albums/${currentAlbum.album_id}`, formData);
        setSuccess("Cập nhật album thành công!");
      }
      closeModal();
      fetchAlbums();
    } catch (err) {
      setError("Có lỗi xảy ra khi lưu album");
    }
  };

  const handleDelete = async (albumId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa album này?")) return;
    try {
      await axios.delete(`/api/admin/albums/${albumId}`);
      setSuccess("Xóa album thành công!");
      fetchAlbums();
    } catch (err) {
      setError("Có lỗi xảy ra khi xóa album");
    }
  };

  return (
    <div className="song-management-content">
      <div className="content-header">
        <div className="header-left">
          <h2><FaMusic /> Quản lý Album</h2>
          <p>Tổng số: <strong>{albums.length}</strong> album</p>
        </div>
        <button className="btn-add" onClick={() => openModal("create")}> <FaPlus /> Thêm album </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")}> <FaTimes /> </button>
        </div>
      )}
      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}> <FaTimes /> </button>
        </div>
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="empty-state">
          <FaMusic size={48} />
          <p>Chưa có album nào</p>
          <button className="btn-add" onClick={() => openModal("create")}> <FaPlus /> Thêm album đầu tiên </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên album</th>
                <th>Nghệ sĩ</th>
                <th>Số bài hát</th>
                <th>Ngày phát hành</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr key={album.album_id}>
                  <td>{album.album_id}</td>
                  <td className="song-title">{album.name}</td>
                  <td>{album.artist_name}</td>
                  <td>{album.song_count}</td>
                  <td>{album.release_date}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-icon edit" onClick={() => openModal("edit", album)} title="Sửa">
                        <FaEdit />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(album.album_id)} title="Xóa">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === "create" ? "Thêm album mới" : "Chỉnh sửa album"}</h3>
              <button className="close-btn" onClick={closeModal}><FaTimes /></button>
            </div>
            <div className="modal-body">
              <form id="album-form" onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Tên album <span className="required">*</span></label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>ID nghệ sĩ <span className="required">*</span></label>
                  <input type="text" name="artist_id" value={formData.artist_id} onChange={handleInputChange} required />
                </div>
                <div className="form-group">
                  <label>Mô tả</label>
                  <input type="text" name="description" value={formData.description} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>Ngày phát hành</label>
                  <input type="date" name="release_date" value={formData.release_date} onChange={handleInputChange} />
                </div>
                <div className="form-group">
                  <label>URL cover</label>
                  <input type="url" name="cover_url" value={formData.cover_url} onChange={handleInputChange} />
                </div>
                {/* TODO: Chọn bài hát, upload ảnh cover, ... */}
              </form>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeModal}>
                Hủy
              </button>
              <button type="submit" form="album-form" className="btn-submit">
                {modalMode === "create" ? "Thêm" : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAlbums;
