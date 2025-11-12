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
  const [filterGenre, setFilterGenre] = useState("");

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [currentSong, setCurrentSong] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    title: "",
    artist_id: "",
    genre_id: "",
    album: "",
    cover_url: "",
    cover: null,
    audio: null,
  });

  // Preview states
  const [coverPreview, setCoverPreview] = useState(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSongs, setTotalSongs] = useState(0);
  const songsPerPage = 10;

  useEffect(() => {
    console.log("Component mounted, fetching data...");
    fetchSongs();
    fetchArtists();
    fetchGenres();
  }, [currentPage, searchTerm, filterArtist, filterGenre]);

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
        const formattedSongs = response.data.songs.map((song) => {
          const formatted = {
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
          };
          console.log("Song data:", song.title, "artist_id:", song.artist_id);
          return formatted;
        });

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
          console.log("Filtering by artist_id:", filterArtist);
          filteredSongs = filteredSongs.filter(song => {
            const match = song.artist_id && song.artist_id.toString() === filterArtist.toString();
            if (match) console.log("Matched song:", song.title, "artist_id:", song.artist_id);
            return match;
          });
          console.log(`Found ${filteredSongs.length} songs for artist ${filterArtist}`);
        }

        // Apply genre filter
        if (filterGenre) {
          console.log("Filtering by genre:", filterGenre);
          filteredSongs = filteredSongs.filter(song => 
            song.genre && song.genre.toLowerCase() === filterGenre.toLowerCase()
          );
          console.log(`Found ${filteredSongs.length} songs for genre ${filterGenre}`);
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
      console.log("Fetching artists from Node.js API...");
      const response = await axios.get(`${NODE_API_URL}/artists`);
      
      if (response.data.success && Array.isArray(response.data.artists)) {
        setArtists(response.data.artists);
        console.log(`✅ Loaded ${response.data.artists.length} artists`);
      }
    } catch (err) {
      console.error("❌ Error fetching artists:", err);
      setError("Không thể tải danh sách nghệ sĩ");
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await axios.get(`${NODE_API_URL}/genres`);
      if (response.data.success && response.data.genres) {
        setGenres(response.data.genres);
      }
    } catch (err) {
      console.error("Error fetching genres:", err);
      // Fallback to hardcoded list if API fails
      setGenres([
        { genre_id: 1, name: "Pop" },
        { genre_id: 2, name: "Rock" },
        { genre_id: 3, name: "Hip Hop" }
      ]);
    }
  };

  const openModal = (mode, song = null) => {
    setModalMode(mode);
    setCurrentSong(song);

    if (mode === "edit" && song) {
      setFormData({
        title: song.title || "",
        artist_id: song.artist_id || "",
        genre_id: "",
        album: song.album || "",
        cover: null,
        audio: null,
      });
    } else {
      setFormData({
        title: "",
        artist_id: "",
        genre_id: "",
        album: "",
        cover: null,
        audio: null,
      });
      setCoverPreview(null);
      setAudioFileName("");
    }

    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentSong(null);
    setFormData({
      title: "",
      artist_id: "",
      genre_id: "",
      album: "",
      cover_url: "",
      cover: null,
      audio: null,
    });
    setCoverPreview(null);
    setAudioFileName("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData({ ...formData, [name]: file });

      // Preview for cover image
      if (name === "cover") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverPreview(reader.result);
        };
        reader.readAsDataURL(file);
      }

      // Show filename for audio
      if (name === "audio") {
        setAudioFileName(file.name);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      if (modalMode === "create") {
        // Validate required fields
        if (!formData.title || !formData.artist_id || !formData.genre_id) {
          setError("Vui lòng điền đầy đủ thông tin");
          setIsSubmitting(false);
          return;
        }

        if (!formData.audio) {
          setError("Vui lòng chọn file nhạc");
          setIsSubmitting(false);
          return;
        }

        if (!formData.cover && !formData.cover_url) {
          setError("Vui lòng chọn ảnh bìa hoặc nhập URL ảnh");
          setIsSubmitting(false);
          return;
        }

        // Create FormData for file upload
        const uploadData = new FormData();
        uploadData.append("title", formData.title);
        uploadData.append("artist_id", formData.artist_id);
        uploadData.append("genre_id", formData.genre_id);
        uploadData.append("album", formData.album || "");
        uploadData.append("cover_url", formData.cover_url || "");
        uploadData.append("audio", formData.audio);
        if (formData.cover) {
          uploadData.append("cover", formData.cover);
        }

        console.log("Uploading song to PHP API...");
        const response = await axios.post(
          `${PHP_API_URL}/song/add_song.php`,
          uploadData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        console.log("Upload response:", response.data);

        if (response.data.status) {
          setSuccess("Thêm bài hát thành công!");
          fetchSongs();
          closeModal();
        } else {
          setError(response.data.message || "Có lỗi xảy ra khi thêm bài hát");
        }
      } else {
        // Edit mode - implement later
        setError("Chức năng chỉnh sửa đang được phát triển");
      }
    } catch (err) {
      console.error("Error submitting song:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi lưu bài hát"
      );
    } finally {
      setIsSubmitting(false);
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
          <input
            type="text"
            placeholder="Tìm kiếm bài hát, nghệ sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="search-icon-right" />
        </div>

        <select
          className="filter-select"
          value={filterArtist}
          onChange={(e) => setFilterArtist(e.target.value)}
        >
          <option value="">Tất cả nghệ sĩ</option>
          {artists.map((artist) => (
            <option key={artist.artist_id} value={artist.artist_id}>
              {artist.name}
            </option>
          ))}
        </select>

        <select
          className="filter-select"
          value={filterGenre}
          onChange={(e) => setFilterGenre(e.target.value)}
        >
          <option value="">Tất cả thể loại</option>
          {genres.map((genre) => (
            <option key={genre.genre_id} value={genre.name}>
              {genre.name}
            </option>
          ))}
        </select>

        <button className="btn-reset" onClick={() => {
          setSearchTerm("");
          setFilterArtist("");
          setFilterGenre("");
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
                  <label>Thể loại <span className="required">*</span></label>
                  <select
                    name="genre_id"
                    value={formData.genre_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Chọn thể loại --</option>
                    {genres.map((genre) => (
                      <option key={genre.genre_id} value={genre.genre_id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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

              {modalMode === "create" && (
                <>
                  <div className="form-group">
                    <label>URL ảnh bìa</label>
                    <input
                      type="url"
                      name="cover_url"
                      value={formData.cover_url || ""}
                      onChange={handleInputChange}
                      placeholder="https://example.com/image.jpg"
                    />
                    <small className="form-hint">Nhập URL ảnh hoặc tải file bên dưới</small>
                  </div>

                  <div className="form-group">
                    <label>Hoặc tải file ảnh bìa</label>
                    {coverPreview && (
                      <div className="image-preview">
                        <img src={coverPreview} alt="Cover preview" />
                      </div>
                    )}
                    <input
                      type="file"
                      name="cover"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <small className="form-hint">JPG, PNG, GIF, WEBP - Tối đa 5MB</small>
                  </div>

                  <div className="form-group">
                    <label>File nhạc <span className="required">*</span></label>
                    {audioFileName && (
                      <div className="file-selected">
                        <FaMusic /> {audioFileName}
                      </div>
                    )}
                    <input
                      type="file"
                      name="audio"
                      accept="audio/mp3,audio/wav,audio/ogg,audio/m4a"
                      onChange={handleFileChange}
                      required
                    />
                    <small className="form-hint">MP3, WAV, OGG, M4A - Tối đa 10MB</small>
                  </div>
                </>
              )}
              </form>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={closeModal} disabled={isSubmitting}>
                Hủy
              </button>
              <button type="submit" form="song-form" className="btn-submit" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : (modalMode === "create" ? "Thêm" : "Cập nhật")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
