import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaUserAlt, FaTimes } from "react-icons/fa";
import axios from "axios";
import "./ArtistManagementContent.css";

// Sử dụng PHP API để load nghệ sĩ
const PHP_API_URL = "http://localhost:8081/music_API/online_music";
const NODE_API_URL = "http://localhost:5000/api";

export default function ArtistManagementContent() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" or "edit"
  const [currentArtist, setCurrentArtist] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    avatar: null,
  });

  const [avatarPreview, setAvatarPreview] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalArtists, setTotalArtists] = useState(0);
  const artistsPerPage = 10;

  useEffect(() => {
    console.log("Component mounted, fetching artists...");
    fetchArtists();
  }, [currentPage, searchTerm]);

  const fetchArtists = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("Fetching artists from PHP API...");
      
      // Gọi endpoint get_artists.php
      try {
        const artistResponse = await axios.get(`${PHP_API_URL}/artist/get_artists.php`);
        console.log("Artists API response:", artistResponse.data);
        
        if (artistResponse.data.status === "success" && Array.isArray(artistResponse.data.artists)) {
          let artistsList = artistResponse.data.artists.map(artist => ({
            artist_id: artist.artist_id,
            name: artist.name,
            bio: artist.bio || "",
            avatar_url: fixLocalUrl(artist.avatar_url),
            song_count: 0,
          }));

          // Count songs per artist từ get_songs.php
          try {
            const songsResponse = await axios.get(`${PHP_API_URL}/song/get_songs.php`);
            if (songsResponse.data.status && Array.isArray(songsResponse.data.songs)) {
              const songCountMap = new Map();
              songsResponse.data.songs.forEach(song => {
                if (song.artist_id) {
                  songCountMap.set(song.artist_id, (songCountMap.get(song.artist_id) || 0) + 1);
                }
              });
              
              // Update song_count
              artistsList = artistsList.map(artist => ({
                ...artist,
                song_count: songCountMap.get(artist.artist_id) || 0,
              }));
            }
          } catch (songErr) {
            console.warn("⚠️ Could not fetch songs for counting:", songErr.message);
          }

          // Apply client-side search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            artistsList = artistsList.filter(artist => 
              artist.name.toLowerCase().includes(searchLower)
            );
          }

          setTotalArtists(artistsList.length);

          // Apply pagination
          const startIndex = (currentPage - 1) * artistsPerPage;
          const paginatedArtists = artistsList.slice(startIndex, startIndex + artistsPerPage);
          
          setArtists(paginatedArtists);
          console.log(`✅ Loaded ${paginatedArtists.length} artists from get_artists.php (total: ${artistsList.length})`);
          setLoading(false);
          return;
        }
      } catch (artistErr) {
        console.warn("⚠️ get_artists.php not available, falling back to extracting from songs:", artistErr.message);
      }

      // Fallback: Lấy danh sách bài hát để extract artists
      const response = await axios.get(`${PHP_API_URL}/song/get_songs.php`);
      console.log("Songs response (fallback):", response.data);
      
      if (response.data.status && Array.isArray(response.data.songs)) {
        // Extract unique artists từ songs
        const artistsMap = new Map();
        response.data.songs.forEach(song => {
          if (song.artist_id && song.artist && !artistsMap.has(song.artist_id)) {
            artistsMap.set(song.artist_id, {
              artist_id: song.artist_id,
              name: song.artist,
              bio: "",
              avatar_url: song.cover || "", // Tạm dùng cover của bài hát
              song_count: 0,
            });
          }
        });

        // Count songs per artist
        response.data.songs.forEach(song => {
          if (song.artist_id && artistsMap.has(song.artist_id)) {
            const artist = artistsMap.get(song.artist_id);
            artist.song_count++;
          }
        });
        
        let uniqueArtists = Array.from(artistsMap.values());

        // Apply client-side search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          uniqueArtists = uniqueArtists.filter(artist => 
            artist.name.toLowerCase().includes(searchLower)
          );
        }

        setTotalArtists(uniqueArtists.length);

        // Apply pagination
        const startIndex = (currentPage - 1) * artistsPerPage;
        const paginatedArtists = uniqueArtists.slice(startIndex, startIndex + artistsPerPage);
        
        setArtists(paginatedArtists);
        console.log(`✅ Loaded ${paginatedArtists.length} artists from songs fallback (total: ${uniqueArtists.length})`);
      } else {
        console.warn("⚠️ API trả dữ liệu không hợp lệ:", response.data);
        setError("API không trả về dữ liệu hợp lệ");
        setArtists([]);
      }
    } catch (err) {
      console.error("❌ Error fetching artists:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      if (err.code === "ERR_NETWORK") {
        setError("⚠️ Không thể kết nối với PHP API server!\n\n" +
                 "Vui lòng:\n" +
                 "1. Bật XAMPP Apache server\n" +
                 "2. Kiểm tra PHP API chạy ở: http://localhost:8081/music_API\n" +
                 "3. Đảm bảo file get_songs.php tồn tại");
      } else {
        setError("Không thể tải danh sách nghệ sĩ. Vui lòng thử lại.");
      }
      setArtists([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fix localhost URLs
  const fixLocalUrl = (url) => {
    if (!url) return "";
    return url.replace("10.0.2.2", "localhost");
  };

  const openModal = (mode, artist = null) => {
    setModalMode(mode);
    setCurrentArtist(artist);

    if (mode === "edit" && artist) {
      setFormData({
        name: artist.name || "",
        bio: artist.bio || "",
        avatar: null,
      });
    } else {
      setFormData({
        name: "",
        bio: "",
        avatar: null,
      });
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentArtist(null);
    setFormData({
      name: "",
      bio: "",
      avatar: null,
    });
    setAvatarPreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData({ ...formData, avatar: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
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

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("bio", formData.bio);

      if (formData.avatar) {
        formDataToSend.append("avatar", formData.avatar);
      }

      if (modalMode === "create") {
        // Sử dụng Node.js API cho admin operations
        const response = await axios.post(`${NODE_API_URL}/artists`, formDataToSend, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data.success) {
          setSuccess("Thêm nghệ sĩ thành công!");
          fetchArtists();
          closeModal();
        }
      } else {
        // Sử dụng Node.js API cho admin operations
        const response = await axios.put(
          `${NODE_API_URL}/artists/${currentArtist.artist_id}`,
          formDataToSend,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          setSuccess("Cập nhật nghệ sĩ thành công!");
          fetchArtists();
          closeModal();
        }
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi lưu nghệ sĩ. Vui lòng thử lại."
      );
    }
  };

  const handleDelete = async (artistId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nghệ sĩ này?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Sử dụng Node.js API cho admin operations
      const response = await axios.delete(`${NODE_API_URL}/artists/${artistId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSuccess("Xóa nghệ sĩ thành công!");
        fetchArtists();
      }
    } catch (err) {
      console.error("Error deleting artist:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi xóa nghệ sĩ. Vui lòng thử lại."
      );
    }
  };

  const totalPages = Math.ceil(totalArtists / artistsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="artist-management-content">
      <div className="content-header">
        <div className="header-left">
          <h2>
            <FaUserAlt /> Quản lý nghệ sĩ
          </h2>
          <p>
            Tổng số: <strong>{totalArtists}</strong> nghệ sĩ
          </p>
        </div>
        <button className="btn-add" onClick={() => openModal("create")}>
          <FaPlus /> Thêm nghệ sĩ
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}>×</button>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Tìm kiếm nghệ sĩ..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error && artists.length === 0 ? (
        <div className="empty-state error">
          <FaUserAlt size={48} />
          <p>{error}</p>
          <button className="btn-add" onClick={fetchArtists}>
            <FaPlus /> Thử lại
          </button>
        </div>
      ) : artists.length === 0 ? (
        <div className="empty-state">
          <FaUserAlt size={48} />
          <p>Chưa có nghệ sĩ nào</p>
          <button className="btn-add" onClick={() => openModal("create")}>
            <FaPlus /> Thêm nghệ sĩ đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Avatar</th>
                  <th>Tên nghệ sĩ</th>
                  <th>Số bài hát</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {artists.map((artist) => (
                  <tr key={artist.artist_id}>
                    <td>{artist.artist_id}</td>
                    <td>
                      {artist.avatar_url ? (
                        <img
                          src={`${PHP_API_URL}/${artist.avatar_url}`}
                          alt={artist.name}
                          className="avatar-thumb"
                        />
                      ) : (
                        <div className="no-avatar"><FaUserAlt /></div>
                      )}
                    </td>
                    <td className="artist-name">{artist.name}</td>
                    <td>{artist.song_count} bài hát</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon edit"
                          onClick={() => openModal("edit", artist)}
                          title="Sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(artist.artist_id)}
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

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="page-btn"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                « Trước
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    className={`page-btn ${currentPage === pageNum ? "active" : ""}`}
                    onClick={() => goToPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                className="page-btn"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Sau »
              </button>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === "create" ? "Thêm nghệ sĩ mới" : "Chỉnh sửa nghệ sĩ"}</h3>
              <button className="close-btn" onClick={closeModal}><FaTimes /></button>
            </div>

            <div className="modal-body">
              <form id="artist-form" onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Tên nghệ sĩ <span className="required">*</span></label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="VD: Sơn Tùng M-TP"
                  />
                </div>

                <div className="form-group">
                  <label>Tiểu sử</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Nhập tiểu sử nghệ sĩ..."
                  />
                </div>

                <div className="form-group">
                  <label>Avatar</label>
                  {avatarPreview && (
                    <div className="avatar-preview">
                      <img src={avatarPreview} alt="Preview" />
                    </div>
                  )}
                  <input
                    type="file"
                    name="avatar"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <small className="form-hint">Định dạng: JPG, PNG. Tối đa 5MB</small>
                </div>
              </form>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeModal}>
                Hủy
              </button>
              <button type="submit" form="artist-form" className="btn-submit">
                {modalMode === "create" ? "Thêm" : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
