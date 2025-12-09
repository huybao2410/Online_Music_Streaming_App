import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUserAlt, FaTimes, FaCloudUploadAlt } from "react-icons/fa";
import axios from "axios";
import "./ArtistManagementContent.css";

// Base URL for PHP API
const PHP_API_URL = "http://10.0.2.2:8081/music_API/online_music";
const NODE_API_URL = "http://localhost:5000/api";

// Generate safe avatar filename
const generateAvatarFilename = (input) => {
  let originalName = "";

  if (typeof input === "string") originalName = input;
  else if (input && typeof input.name === "string") originalName = input.name;
  else originalName = "avatar.jpg";

  const ext = originalName.includes(".")
    ? originalName.substring(originalName.lastIndexOf("."))
    : ".jpg";

  const timestamp = Date.now();
  const rand = Math.floor(Math.random() * 1e9);

  return `artist-${timestamp}-${rand}${ext}`;
};

// Build avatar URL for display
const buildAvatarUrl = (url) => {
  if (!url) return null;

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace("10.0.2.2", "localhost");
  }

  return `${PHP_API_URL}/${url}`;
};

export default function ArtistManagementContent({ showModal: externalShowModal, setShowModal: externalSetShowModal }) {

  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentArtist, setCurrentArtist] = useState(null);

  const [formData, setFormData] = useState({ name: "", bio: "", avatar: null });
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalArtists, setTotalArtists] = useState(0);
  const artistsPerPage = 10;

  useEffect(() => {
    if (typeof externalShowModal === "boolean") setShowModal(externalShowModal);
  }, [externalShowModal]);

  useEffect(() => {
    fetchArtists();
  }, [currentPage, searchTerm]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${NODE_API_URL}/artists/admin/all`);

      if ((response.data.status || response.data.success) && Array.isArray(response.data.artists)) {
        let arr = response.data.artists;

        if (searchTerm) {
          const key = searchTerm.toLowerCase();
          arr = arr.filter(a => a.name.toLowerCase().includes(key));
        }

        setTotalArtists(arr.length);

        const start = (currentPage - 1) * artistsPerPage;
        setArtists(arr.slice(start, start + artistsPerPage));
      } else {
        setError("API không trả về dữ liệu hợp lệ");
      }

    } catch (err) {
      setError("Không thể tải nghệ sĩ.");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (mode, artist = null) => {
    setModalMode(mode);
    setCurrentArtist(artist);

    if (mode === "edit" && artist) {
      setFormData({ name: artist.name, bio: artist.bio || "", avatar: null });
      setAvatarPreview(buildAvatarUrl(artist.avatar_url));
    } else {
      setFormData({ name: "", bio: "", avatar: null });
      setAvatarPreview(null);
    }

    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (externalSetShowModal) externalSetShowModal(false);
    setFormData({ name: "", bio: "", avatar: null });
    setAvatarPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData(prev => ({ ...prev, avatar: file }));

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) return setError("Bạn cần đăng nhập.");

      const fd = new FormData();
      fd.append("name", formData.name);
      fd.append("bio", formData.bio || "");

      let finalAvatarUrl = currentArtist?.avatar_url || "";

      if (formData.avatar) {
        const filename = generateAvatarFilename(formData.avatar);

        const renamedFile = new File([formData.avatar], filename, {
          type: formData.avatar.type
        });

        fd.append("avatar", renamedFile);

        finalAvatarUrl = `http://10.0.2.2:8081/music_API/online_music/artist_avatar/${filename}`;
        fd.append("avatar_url", finalAvatarUrl);
      } else {
        fd.append("avatar_url", finalAvatarUrl);
      }

      let response;

      if (modalMode === "create") {
        response = await axios.post(`${NODE_API_URL}/artists`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
      } else {
        response = await axios.put(`${NODE_API_URL}/artists/${currentArtist.artist_id}`, fd, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }
        });
      }

      if (response.data.success) {
        setSuccess(modalMode === "create" ? "Thêm nghệ sĩ thành công!" : "Cập nhật thành công!");
        fetchArtists();
        handleCloseModal();
      } else {
        setError(response.data.message || "Có lỗi xảy ra.");
      }

    } catch (err) {
      setError("Lỗi khi lưu nghệ sĩ.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa?")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${NODE_API_URL}/artists/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setSuccess("Xóa thành công!");
        fetchArtists();
      }

    } catch (err) {
      setError("Không thể xóa nghệ sĩ.");
    }
  };

  const totalPages = Math.ceil(totalArtists / artistsPerPage);
  const goToPage = (p) => (p >= 1 && p <= totalPages) && setCurrentPage(p);

  return (
    <div className="artist-management-content">

      {/* HEADER */}
      <div className="content-header">
        <div>
          <h2><FaUserAlt /> Quản lý nghệ sĩ</h2>
          <p>Tổng số: <b>{totalArtists}</b></p>
        </div>
        <button className="btn-add" onClick={() => openModal("create")}>
          <FaPlus /> Thêm nghệ sĩ
        </button>
      </div>

      {/* ALERTS */}
      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* SEARCH */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Tìm kiếm nghệ sĩ..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {/* TABLE */}
      {!loading && artists.length > 0 && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Avatar</th>
                <th>Tên nghệ sĩ</th>
                <th>Số bài hát</th>
                <th>Hành động</th>
              </tr>
            </thead>

            <tbody>
              {artists.map((artist) => (
                <tr key={artist.artist_id}>
                  <td>{artist.artist_id}</td>

                  <td>
                    <img
                      src={buildAvatarUrl(artist.avatar_url)}
                      className="avatar-thumb"
                      alt=""
                    />
                  </td>

                  <td>{artist.name}</td>
                  <td>{artist.song_count ?? 0}</td>

                  <td>
                    <button className="btn-icon edit" onClick={() => openModal("edit", artist)}>
                      <FaEdit />
                    </button>
                    <button className="btn-icon delete" onClick={() => handleDelete(artist.artist_id)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={currentPage === 1} onClick={() => goToPage(currentPage - 1)}>«</button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={currentPage === i + 1 ? "active" : ""}
                  onClick={() => goToPage(i + 1)}
                >
                  {i + 1}
                </button>
              ))}

              <button disabled={currentPage === totalPages} onClick={() => goToPage(currentPage + 1)}>»</button>
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>

            <div className="modal-header">
              <h3>{modalMode === "create" ? "Thêm nghệ sĩ" : "Chỉnh sửa nghệ sĩ"}</h3>
              <button className="close-btn" onClick={handleCloseModal}><FaTimes /></button>
            </div>

            <form id="artist-form" onSubmit={handleSubmit}>

              <div className="form-group">
                <label>Tên nghệ sĩ *</label>
                <input
                  name="name"
                  value={formData.name}
                  required
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Ảnh đại diện</label>

                <div className="avatar-upload-area" onClick={() => document.getElementById("avatar-input").click()}>
                  {avatarPreview
                    ? <img src={avatarPreview} className="avatar-preview" alt="" />
                    : <div className="upload-placeholder"><FaCloudUploadAlt size={32} />Nhấn để tải ảnh</div>}
                </div>

                <input
                  id="avatar-input"
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
              </div>

              <div className="form-group">
                <label>Tiểu sử</label>
                <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="3" />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>Hủy</button>
                <button type="submit" className="btn-submit">
                  {modalMode === "create" ? "Thêm mới" : "Lưu thay đổi"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
