// frontend/src/components/SongManagementContent.jsx
import React, { useState, useEffect } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaMusic,
  FaTimes,
  FaPlay,
} from "react-icons/fa";
import axios from "axios";
import "./SongManagementContent.css";

const NODE_API_URL = "http://localhost:5000/api";

export default function SongManagementContent({ setActiveTab, openArtistAddModal }) {
  const [providers, setProviders] = useState([]);
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

  // Form data - artists is an array of { artist_id, name }
  const [formData, setFormData] = useState({
    title: "",
    artists: [{ artist_id: "", name: "" }],
    genre_id: "",
    provider_id: "",   // ✅ THÊM
    cover: null,
    audio: null
  });

  // Preview states
  const [coverPreview, setCoverPreview] = useState(null);
  const [audioFileName, setAudioFileName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalSongs, setTotalSongs] = useState(0);
  const songsPerPage = 10;

  // Artist and genre search for modal
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [filteredArtistsMap, setFilteredArtistsMap] = useState({}); // keyed by artist-input-index
  const [genreSearchTerm, setGenreSearchTerm] = useState("");
  const [filteredGenres, setFilteredGenres] = useState([]);

  const fixMediaUrl = (url) => {
    if (!url) return "";

    // Android emulator → Web
    if (url.includes("10.0.2.2:8081")) {
      return url.replace("10.0.2.2:8081", "localhost:8081");
    }

    return url;
  };

  const fetchProviders = async () => {
    try {
      const res = await axios.get(`${NODE_API_URL}/providers`);
      if (res.data.success) {
        setProviders(res.data.providers);
      }
    } catch (err) {
      console.error("Fetch providers error", err);
    }
  };

  useEffect(() => {
    fetchSongs();
    fetchArtists();
    fetchGenres();
    fetchProviders();
  }, []);
  // ========== Fetch functions ==========
  const fetchSongs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${NODE_API_URL}/songs`);

      if (res.data.success) {
        setSongs(res.data.songs);
        setTotalSongs(res.data.songs.length);
      }
    } catch (err) {
      console.error(err);
      setError("Không thể tải bài hát từ server NodeJS");
    } finally {
      setLoading(false);
    }
  };

  const fetchArtists = async () => {
    try {
      const resp = await axios.get(`${NODE_API_URL}/artists`);
      if (resp.data.success && Array.isArray(resp.data.artists)) {
        setArtists(resp.data.artists);
      } else {
        setArtists([]);
      }
    } catch (err) {
      console.error("Error fetching artists:", err);
      setArtists([]);
    }
  };

  const fetchGenres = async () => {
    try {
      const resp = await axios.get(`${NODE_API_URL}/genres`);
      if (resp.data.success && resp.data.genres) {
        setGenres(resp.data.genres);
      } else {
        setGenres([]);
      }
    } catch (err) {
      console.error("Error fetching genres:", err);
      setGenres([]);
    }
  };

  // ========== Modal open/close ==========
  const openModal = (mode, song = null) => {
    setModalMode(mode);
    setCurrentSong(song);

    if (mode === "edit" && song) {
      // prepare artists array
      let artistsArr = [{ artist_id: "", name: "" }];
      if (Array.isArray(song.artist_ids) && song.artist_ids.length > 0) {
        artistsArr = song.artist_ids.map((aid) => {
          const found = artists.find((a) => String(a.artist_id) === String(aid));
          return { artist_id: aid, name: found ? found.name : "" };
        });
      } else if (song.artist_id) {
        const found = artists.find((a) => String(a.artist_id) === String(song.artist_id));
        artistsArr = [{ artist_id: song.artist_id, name: found ? found.name : song.artist_name || "" }];
      } else if (song.artist_name) {
        artistsArr = [{ artist_id: "", name: song.artist_name }];
      }

      setFormData({
        title: song.title || "",
        artists: artistsArr,
        genre_id: genres.find(g => g.name === song.genre)?.genre_id || "",
        cover_url: song.cover_url || "",
        cover: null,
        audio: null,
        provider_id: "",
        album: song.album || "",
      });

      setCoverPreview(song.cover_url || null);
      setAudioFileName(song.audio_url ? song.audio_url.split("/").pop() : "");
      setArtistSearchTerm(""); // reset
      setGenreSearchTerm(song.genre || "");
    } else {
      // create mode: reset
      setFormData({
        title: "",
        artists: [{ artist_id: "", name: "" }],
        genre_id: "",
        cover_url: "",
        cover: null,
        audio: null,
        provider_id: "",
        album: "",
      });
      setCoverPreview(null);
      setAudioFileName("");
      setArtistSearchTerm("");
      setGenreSearchTerm("");
    }

    setFilteredArtistsMap({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setCurrentSong(null);
    setFormData({
      title: "",
      artists: [{ artist_id: "", name: "" }],
      genre_id: "",
      cover_url: "",
      cover: null,
      audio: null,
      rovider_id: "",
      album: "",
    });
    setCoverPreview(null);
    setAudioFileName("");
    setFilteredArtistsMap({});
  };

  // ========== Artist multi-input handlers ==========
  // khi nhập vào ô artist thứ `index`
  const handleArtistSearch = (e, index) => {
    const value = e.target.value;
    const copy = [...formData.artists];
    copy[index] = { ...(copy[index] || {}), name: value, artist_id: copy[index]?.artist_id || "" };
    setFormData({ ...formData, artists: copy });

    // tìm artists list matching
    if (!value) {
      setFilteredArtistsMap(prev => ({ ...prev, [index]: [] }));
      return;
    }
    const q = value.toLowerCase();
    const matched = artists.filter(a => (a.name || "").toLowerCase().includes(q));
    setFilteredArtistsMap(prev => ({ ...prev, [index]: matched.slice(0, 10) }));
  };

  // chọn artist từ dropdown cho ô index
  const handleSelectArtist = (artistObj, index) => {
    const copy = [...formData.artists];
    copy[index] = { artist_id: artistObj.artist_id, name: artistObj.name };
    setFormData({ ...formData, artists: copy });

    // clear suggestions for that index
    setFilteredArtistsMap(prev => ({ ...prev, [index]: [] }));
  };

  const addArtistRow = () => {
    setFormData(prev => ({ ...prev, artists: [...prev.artists, { artist_id: "", name: "" }] }));
  };

  const removeArtistRow = (index) => {
    setFormData(prev => {
      const copy = [...prev.artists];
      copy.splice(index, 1);
      return { ...prev, artists: copy.length ? copy : [{ artist_id: "", name: "" }] };
    });
    setFilteredArtistsMap(prev => {
      const copy = { ...prev };
      delete copy[index];
      return copy;
    });
  };

  // ========== Other form handlers ==========
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));

      if (name === "cover") {
        const reader = new FileReader();
        reader.onloadend = () => setCoverPreview(reader.result);
        reader.readAsDataURL(file);
      }
      if (name === "audio") setAudioFileName(file.name);
    }
  };

  // ========== Submit (create) ==========
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Bạn chưa đăng nhập");
        return;
      }

      const data = new FormData();
      data.append("title", formData.title);
      data.append("genre_id", formData.genre_id);
      data.append("provider_id", formData.provider_id);
      data.append(
        "artists",
        JSON.stringify(formData.artists.map(a => a.artist_id))
      );

      if (formData.cover) data.append("cover", formData.cover);
      if (formData.audio) data.append("audio", formData.audio);

      let res;

      if (modalMode === "create") {
        res = await axios.post(`${NODE_API_URL}/songs`, data, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        });
      } else {
        res = await axios.put(
          `${NODE_API_URL}/songs/${currentSong.song_id}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data"
            }
          }
        );
      }

      if (res.data.success) {
        setSuccess(
          modalMode === "create"
            ? "Thêm bài hát thành công"
            : "Cập nhật bài hát thành công"
        );
        fetchSongs();
        closeModal();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Lỗi server");
    } finally {
      setIsSubmitting(false);
    }
  };








  // ========== Other actions ==========
  const handleDelete = async (songId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài hát này?")) return;
    try {
      const token = localStorage.getItem("token");
      const resp = await axios.delete(`${NODE_API_URL}/songs/${songId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (resp.data.success) {
        setSuccess("Xóa bài hát thành công!");
        fetchSongs();
      } else {
        setError(resp.data.message || "Xóa thất bại");
      }
    } catch (err) {
      console.error("Error deleting song:", err);
      setError(err.response?.data?.message || "Lỗi khi xóa bài hát");
    }
  };

  const handlePlaySong = (song) => {
    window.open(song.audio_url, "_blank");
  };

  const totalPages = Math.max(1, Math.ceil(totalSongs / songsPerPage));
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const formatDuration = (seconds) => {
    if (!seconds) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Filter artists for select dropdown in top filters
  useEffect(() => {
    if (artistSearchTerm) {
      const q = artistSearchTerm.toLowerCase();
      const filtered = artists.filter(a => (a.name || "").toLowerCase().includes(q));
      setFilteredArtistsMap(prev => ({ ...prev, top: filtered.slice(0, 20) }));
    } else {
      setFilteredArtistsMap(prev => ({ ...prev, top: [] }));
    }
  }, [artistSearchTerm, artists]);

  // Genres dropdown filter
  useEffect(() => {
    if (genreSearchTerm) {
      const q = genreSearchTerm.toLowerCase();
      setFilteredGenres(genres.filter(g => (g.name || "").toLowerCase().includes(q)).slice(0, 20));
    } else {
      setFilteredGenres(genres);
    }
  }, [genreSearchTerm, genres]);

  // ========== RENDER ==========
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
                  <th>Nhà cung cấp</th>
                  <th>Thời lượng</th>
                  <th>Hành động</th>
                </tr>
              </thead>

              <tbody>
                {songs.map(song => (
                  <tr key={song.song_id}>
                    {/* ID */}
                    <td>{song.song_id}</td>

                    {/* COVER */}
                    <td>
                      {song.cover_url ? (
                        <img
                          src={fixMediaUrl(song.cover_url)}
                          alt={song.title}
                          className="cover-thumb"
                        />
                      ) : (
                        <div className="no-cover">
                          <FaMusic />
                        </div>
                      )}
                    </td>

                    {/* TITLE */}
                    <td className="song-title">{song.title}</td>

                    {/* ARTISTS */}
                    <td>
                      {song.artist_ids && song.artist_ids.length > 0
                        ? song.artist_ids.map((aid, i) => {
                          const artist = artists.find(
                            a => String(a.artist_id) === String(aid)
                          );
                          return (
                            <span key={aid}>
                              {artist?.name || "Không rõ"}
                              {i < song.artist_ids.length - 1 ? ", " : ""}
                            </span>
                          );
                        })
                        : "—"}
                    </td>

                    {/* GENRE */}
                    <td>{song.genre || "—"}</td>

                    {/* PROVIDER */}
                    <td>{song.provider_name || "—"}</td>

                    {/* DURATION */}
                    <td>{formatDuration(song.duration)}</td>

                    {/* ACTIONS */}
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn-icon play"
                          title="Phát"
                          onClick={() => window.open(fixMediaUrl(song.audio_url), "_blank")}
                        >
                          <FaPlay />
                        </button>

                        <button
                          className="btn-icon edit"
                          title="Sửa"
                          onClick={() => openModal("edit", song)}
                        >
                          <FaEdit />
                        </button>

                        <button
                          className="btn-icon delete"
                          title="Xóa"
                          onClick={() => handleDelete(song.song_id)}
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
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹ Trước</button>

            {[...Array(totalPages)].map((_, index) => {
              const page = index + 1;
              if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                return (
                  <button key={page} className={page === currentPage ? "active" : ""} onClick={() => goToPage(page)}>
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page}>...</span>;
              }
              return null;
            })}

            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Sau ›</button>
          </div>
        </>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box song-modal-specific" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modalMode === "create" ? "Thêm bài hát mới" : "Chỉnh sửa bài hát"}</h3>
              <button className="close-btn" onClick={closeModal}><FaTimes /></button>
            </div>

            <div className="modal-body">
              <form id="song-form" onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Tên bài hát <span className="required">*</span></label>
                  <input type="text" name="title"  placeholder="Nhập tên bài hát..." value={formData.title} onChange={handleInputChange} required />
                </div>

                {/* MULTI ARTISTS */}
                <div className="form-group">
                  <label>Nghệ sĩ <span className="required">*</span></label>

                  {formData.artists.map((item, index) => (
                    <div key={index} className="artist-row">
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="Nhập tên nghệ sĩ..."
                          value={item.name}
                          onChange={(e) => handleArtistSearch(e, index)}
                          style={{ flex: 1 }}
                        />
                        {formData.artists.length > 1 && (
                          <button type="button" className="btn-remove-artist" onClick={() => removeArtistRow(index)}>
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Dropdown suggestions for this artist input */}
                      {filteredArtistsMap[index] && filteredArtistsMap[index].length > 0 && (
                        <div className="search-dropdown">
                          {filteredArtistsMap[index].map(a => (
                            <div key={a.artist_id} className="dropdown-item" onClick={() => handleSelectArtist(a, index)}>
                              {a.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div style={{ marginTop: 8 }}>
                    <button type="button" className="btn-add-artist" onClick={addArtistRow}>
                      <FaPlus /> Thêm nghệ sĩ
                    </button>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Thể loại <span className="required">*</span></label>

                    <select
                      name="genre_id"
                      value={formData.genre_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">-- Chọn thể loại --</option>
                      {genres.map(g => (
                        <option key={g.genre_id} value={g.genre_id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>


                <div className="form-group">
                  <div className="form-group">
                    <label>Nhà cung cấp <span className="required">*</span></label>

                    <select
                      name="provider_id"
                      value={formData.provider_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">-- Chọn nhà cung cấp --</option>
                      {providers.map(p => (
                        <option key={p.provider_id} value={p.provider_id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                  </div>

                </div>
                <div className="form-group">
                  <label>Tải file ảnh bìa</label>
                  {coverPreview && (
                    <div className="image-preview">
                      <img src={coverPreview} alt="Cover preview" />
                    </div>
                  )}
                  <input type="file" name="cover" accept="image/*" onChange={handleFileChange} />
                  <small className="form-hint">JPG, PNG, GIF, WEBP - Tối đa 5MB</small>
                </div>

                <div className="form-group">
                  <label>File nhạc {modalMode === "create" && <span className="required">*</span>}</label>
                  {audioFileName && (
                    <div className="file-selected">
                      <FaMusic /> {audioFileName}
                    </div>
                  )}
                  <input type="file" name="audio" accept="audio/*" onChange={handleFileChange} />
                  <small className="form-hint">MP3, WAV, OGG, M4A - Tối đa 10MB</small>
                </div>
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