import React, { useState, useEffect } from "react";
import { FaPlus, FaEdit, FaTrash, FaSearch, FaMusic, FaTimes } from "react-icons/fa";
import axios from "axios";
import "./SongManagementContent.css";

// Sử dụng PHP API giống như user side để load bài hát
const PHP_API_URL = "http://localhost:8081/music_API/online_music";
const NODE_API_URL = "http://localhost:5000/api";

export default function SongManagementContent() {
  const [songs, setSongs] = useState([]);
  const [artists, setArtists] = useState([]);
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState("");
  const [filterArtist, setFilterArtist] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
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

  useEffect(() => {
    console.log("Component mounted, fetching data...");
    fetchSongs();
    fetchArtists();
    fetchGenres();
  }, [currentPage, searchTerm, filterArtist]);

  const fetchSongs = async () => {
    try {
      setLoading(true);
      setError("");
      
      console.log("Fetching songs from PHP API...");
      // Gọi PHP API giống như user side
      const response = await axios.get(`${PHP_API_URL}/song/get_songs.php`);
      console.log("Songs response:", response.data);
      
      if (response.data.status && Array.isArray(response.data.songs)) {
        // Chuẩn hóa dữ liệu từ PHP API
        const formattedSongs = response.data.songs.map((song) => ({
          song_id: song.song_id || song.id,
          title: song.title || "Không rõ tên",
          artist_name: song.artist || "Không rõ nghệ sĩ",
          artist_id: song.artist_id,
          album: song.album || "",
          genre: song.genre || "",
          duration: song.duration || 0,
          cover_url: fixLocalUrl(song.cover),
          audio_url: fixLocalUrl(song.audio || song.url),
          play_count: song.play_count || 0,
        }));

        // Apply client-side search filter
        let filteredSongs = formattedSongs;
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          filteredSongs = filteredSongs.filter(song => 
            song.title.toLowerCase().includes(searchLower) ||
            song.artist_name.toLowerCase().includes(searchLower)
          );
        }

        // Apply artist filter
        if (filterArtist) {
          filteredSongs = filteredSongs.filter(song => 
            song.artist_id === parseInt(filterArtist)
          );
        }

        setTotalSongs(filteredSongs.length);

        // Apply pagination
        const startIndex = (currentPage - 1) * songsPerPage;
        const paginatedSongs = filteredSongs.slice(startIndex, startIndex + songsPerPage);
        
        setSongs(paginatedSongs);
        console.log(`✅ Loaded ${paginatedSongs.length} songs (total: ${filteredSongs.length})`);
      } else {
        console.warn("⚠️ API trả dữ liệu không hợp lệ:", response.data);
        setError("API không trả về dữ liệu hợp lệ");
        setSongs([]);
      }
    } catch (err) {
      console.error("❌ Error fetching songs:", err);
      console.error("Error details:", err.response?.data || err.message);
      
      if (err.code === "ERR_NETWORK") {
        setError("⚠️ Không thể kết nối với PHP API server!\n\n" +
                 "Vui lòng:\n" +
                 "1. Bật XAMPP Apache server\n" +
                 "2. Kiểm tra PHP API chạy ở: http://localhost:8081/music_API\n" +
                 "3. Đảm bảo file get_songs.php tồn tại");
      } else {
        setError("Không thể tải danh sách bài hát. Vui lòng thử lại.");
      }
      setSongs([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to fix localhost URLs
  const fixLocalUrl = (url) => {
    if (!url) return "";
    return url.replace("10.0.2.2", "localhost");
  };

  const fetchArtists = async () => {
    try {
      console.log("Fetching artists from songs...");
      // Lấy artists từ danh sách songs (vì PHP API không có endpoint riêng cho artists)
      const response = await axios.get(`${PHP_API_URL}/song/get_songs.php`);
      
      if (response.data.status && Array.isArray(response.data.songs)) {
        // Extract unique artists from songs
        const artistsMap = new Map();
        response.data.songs.forEach(song => {
          if (song.artist_id && song.artist && !artistsMap.has(song.artist_id)) {
            artistsMap.set(song.artist_id, {
              artist_id: song.artist_id,
              name: song.artist,
            });
          }
        });
        
        const uniqueArtists = Array.from(artistsMap.values());
        setArtists(uniqueArtists);
        console.log(`✅ Loaded ${uniqueArtists.length} unique artists`);
      }
    } catch (err) {
      console.error("❌ Error fetching artists:", err);
    }
  };

  const fetchGenres = async () => {
    setGenres([
      "Pop", "Rock", "Hip Hop", "R&B", "Country", "Jazz", "Blues",
      "Electronic", "Dance", "EDM", "Ballad", "Indie", "Reggae",
      "K-Pop", "J-Pop", "Latin", "Classical", "Lo-fi", "Acoustic",
      "Rap", "Soul", "Alternative", "V-Pop", "Bolero"
    ]);
  };

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
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
        // Sử dụng Node.js API cho admin operations
        const response = await axios.post(`${NODE_API_URL}/songs`, formDataToSend, {
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
        // Sử dụng Node.js API cho admin operations
        const response = await axios.put(
          `${NODE_API_URL}/songs/${currentSong.song_id}`,
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

  const handleDelete = async (songId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài hát này?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      // Sử dụng Node.js API cho admin operations
      const response = await axios.delete(`${NODE_API_URL}/songs/${songId}`, {
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

  const totalPages = Math.ceil(totalSongs / songsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="song-management-content">
      <div className="content-header">
        <div className="header-left">
          <h2><FaMusic /> Quản lý bài hát</h2>
          <p>Tổng số: <strong>{totalSongs}</strong> bài hát</p>
        </div>
        <button className="btn-add" onClick={() => openModal("create")}>
          <FaPlus /> Thêm bài hát
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
          <button onClick={() => setError("")}><FaTimes /></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span>{success}</span>
          <button onClick={() => setSuccess("")}><FaTimes /></button>
        </div>
      )}

      <div className="filters-bar">
        <div className="search-box">
          <FaSearch />
          <input
            type="text"
            placeholder="Tìm kiếm bài hát..."
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
          Đặt lại
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : error && songs.length === 0 ? (
        <div className="empty-state error">
          <FaMusic size={48} />
          <p>{error}</p>
          <button className="btn-add" onClick={fetchSongs}>
            <FaPlus /> Thử lại
          </button>
        </div>
      ) : songs.length === 0 ? (
        <div className="empty-state">
          <FaMusic size={48} />
          <p>Chưa có bài hát nào</p>
          <button className="btn-add" onClick={() => openModal("create")}>
            <FaPlus /> Thêm bài hát đầu tiên
          </button>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Cover</th>
                  <th>Tên bài hát</th>
                  <th>Nghệ sĩ</th>
                  <th>Thể loại</th>
                  <th>Album</th>
                  <th>Thời lượng</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {songs.map((song) => (
                  <tr key={song.song_id}>
                    <td>{song.song_id}</td>
                    <td>
                      {song.cover_url ? (
                        <img
                          src={song.cover_url}
                          alt={song.title}
                          className="cover-thumb"
                        />
                      ) : (
                        <div className="no-cover"><FaMusic /></div>
                      )}
                    </td>
                    <td className="song-title">{song.title}</td>
                    <td>{song.artist_name || "Chưa có"}</td>
                    <td>{song.genre || "-"}</td>
                    <td>{song.album || "-"}</td>
                    <td>{formatDuration(song.duration)}</td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon edit"
                          onClick={() => openModal("edit", song)}
                          title="Sửa"
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(song.song_id)}
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

          <div className="pagination">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              ‹ Trước
            </button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    className={page === currentPage ? "active" : ""}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page}>...</span>;
              }
              return null;
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau ›
            </button>
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === "create" ? "Thêm bài hát mới" : "Chỉnh sửa bài hát"}</h3>
              <button className="close-btn" onClick={closeModal}><FaTimes /></button>
            </div>

            <div className="modal-body">
              <form id="song-form" onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Tên bài hát <span className="required">*</span></label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nghệ sĩ <span className="required">*</span></label>
                  <select
                    name="artist_id"
                    value={formData.artist_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Chọn nghệ sĩ --</option>
                    {artists.map((artist) => (
                      <option key={artist.artist_id} value={artist.artist_id}>
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
                  />
                </div>

                <div className="form-group">
                  <label>Thời lượng (giây)</label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="0"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Ảnh bìa</label>
                <input
                  type="file"
                  name="cover"
                  accept="image/*"
                  onChange={handleFileChange}
                />
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
              </div>
              </form>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeModal}>
                Hủy
              </button>
              <button type="submit" form="song-form" className="btn-submit">
                {modalMode === "create" ? "Thêm" : "Cập nhật"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
