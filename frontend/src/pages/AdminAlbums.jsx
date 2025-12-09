import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaMusic, FaTimes } from "react-icons/fa";
import "../components/SongManagementContent.css";

function AdminAlbums() {
    // Helper: fix local url for preview
    const fixLocalUrl = (url) => {
      if (!url) return "";
      return url.replace("10.0.2.2", "localhost");
    };
  const [coverPreview, setCoverPreview] = useState("");
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

  const [artistList, setArtistList] = useState([]);
  const [artistSearch, setArtistSearch] = useState("");

  const [songList, setSongList] = useState([]);
  const [songSearch, setSongSearch] = useState("");

  useEffect(() => {
    fetchAlbums();
    fetchArtists();
    fetchSongs();
  }, []);

  const fetchArtists = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8081/music_API/online_music/artist/get_artists.php"
      );
      setArtistList(Array.isArray(res.data.artists) ? res.data.artists : []);
    } catch { }
  };

  const fetchSongs = async () => {
    try {
      const res = await axios.get(
        "http://localhost:8081/music_API/online_music/song/get_songs_web.php"
      );
      setSongList(Array.isArray(res.data.songs) ? res.data.songs : []);
    } catch { }
  };

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
      let songIds = Array.isArray(album.song_ids) ? album.song_ids : [];
      if (!songIds.length && Array.isArray(album.songs)) {
        songIds = album.songs.map((s) => s.song_id);
      }

      setFormData({
        name: album.name || "",
        artist_id: album.artist_id || "",
        description: album.description || "",
        release_date: album.release_date || "",
        cover_url: album.cover_url || "",
        song_ids: songIds
      });

      setCoverPreview(album.cover_url || "");
    } else {
      setFormData({
        name: "",
        artist_id: "",
        description: "",
        release_date: "",
        cover_url: "",
        song_ids: []
      });
      setCoverPreview("");
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

  // -------- UPLOAD COVER TO PHP --------
  const uploadCoverToPHP = async (file) => {
    const form = new FormData();
    form.append("image", file);

    try {
      const res = await axios.post("http://10.0.2.2:8081/music_API/online_music/album/upload_album_cover.php", form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      console.log("PHP response:", res.data);

      // nếu server trả về success + url:
      if (res.data.success && res.data.url && res.data.url.startsWith("http")) {
        return res.data.url;
      }

      // nếu server trả filename thì build thành url
      if (res.data.filename) {
        return `http://10.0.2.2:8081/music_API/online_music/album/album_cover/${res.data.filename}`;
      }

      return "";
    } catch (err) {
      console.error("Upload lỗi:", err);
      return "";
    }
  };

  // ---------- ADD ----------
  const addAlbum = async (data) => {
    try {
      const albumData = {
        ...data,
        song_ids: Array.isArray(data.song_ids) ? data.song_ids : []
      };

      if (albumData.release_date?.includes("T")) {
        albumData.release_date = albumData.release_date.split("T")[0];
      }

      await axios.post("/api/admin/albums", albumData);

      setSuccess("Thêm album thành công!");
      closeModal();
      fetchAlbums();
    } catch {
      setError("Có lỗi xảy ra khi thêm album");
    }
  };

  // ---------- EDIT ----------
  const editAlbum = async (data, albumId) => {
    try {
      const albumData = {
        ...data,
        song_ids: Array.isArray(data.song_ids) ? data.song_ids : []
      };

      if (albumData.release_date?.includes("T")) {
        albumData.release_date = albumData.release_date.split("T")[0];
      }

      await axios.put(`/api/admin/albums/${albumId}`, albumData);

      setSuccess("Cập nhật album thành công!");
      closeModal();
      fetchAlbums();
    } catch {
      setError("Có lỗi xảy ra khi chỉnh sửa album");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (modalMode === "create") await addAlbum(formData);
    else if (modalMode === "edit") await editAlbum(formData, currentAlbum.album_id);
  };

  const handleDelete = async (albumId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa album này?")) return;

    try {
      await axios.delete(`/api/admin/albums/${albumId}`);
      setSuccess("Xóa album thành công!");
      fetchAlbums();
    } catch {
      setError("Có lỗi xảy ra khi xóa album");
    }
  };

  // ---------- UI ----------
  return (
    <div className="song-management-content">
      <div className="content-header">
        <div className="header-left">
          <h2>
            <FaMusic /> Quản lý Album
          </h2>
          <p>
            Tổng số: <strong>{albums.length}</strong> album
          </p>
        </div>
        <button className="btn-add" onClick={() => openModal("create")}>
          <FaPlus /> Thêm album
        </button>
      </div>

      {/* --- Thanh tìm kiếm & lọc nghệ sĩ --- */}
      <div className="filters-bar" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div className="search-box" style={{ flex: 1, minWidth: 250, position: 'relative', display: 'flex', alignItems: 'center', background: 'white', border: '1px solid #e5e7eb', borderRadius: 8, padding: '0.75rem 1rem' }}>
          <input
            type="text"
            placeholder="Tìm kiếm album, nghệ sĩ..."
            value={artistSearch}
            onChange={e => setArtistSearch(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '1rem', background: 'transparent', color: '#1f2937', paddingRight: '2rem' }}
          />
          <FaMusic style={{ position: 'absolute', left: 15, color: '#9ca3af', fontSize: '1rem', pointerEvents: 'none' }} />
        </div>
        <select
          style={{ padding: '0.75rem 1rem', border: '1px solid #e5e7eb', borderRadius: 8, background: 'white', color: '#1f2937', fontSize: '1rem', minWidth: 180 }}
          value={formData.artist_id}
          onChange={e => setFormData({ ...formData, artist_id: e.target.value })}
        >
          <option value="">Tất cả nghệ sĩ</option>
          {artistList
            .filter((a) => a.name?.toLowerCase().includes(artistSearch.toLowerCase()))
            .map((a) => (
              <option key={a.artist_id} value={a.artist_id}>{a.name}</option>
            ))}
        </select>
        <button
          style={{ padding: '0.75rem 1.5rem', background: '#64748b', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          onClick={() => {
            setArtistSearch("");
            setFormData({ ...formData, artist_id: "" });
          }}
        >
          Đặt lại
        </button>
      </div>

      {/* Errors */}
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

      {/* Content */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : albums.length === 0 ? (
        <div className="empty-state">
          <FaMusic size={48} />
          <p>Chưa có album nào</p>
          <button className="btn-add" onClick={() => openModal("create")}>
            <FaPlus /> Thêm album đầu tiên
          </button>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cover</th>
                <th>Tên album</th>
                <th>Nghệ sĩ</th>
                <th>Số bài hát</th>
                <th>Ngày phát hành</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {albums.map((album) => (
                <tr key={album.album_id}>
                  <td>{album.album_id}</td>
                  <td>
                    <img
                      src={
                        album.cover_url
                          ? album.cover_url.replace("10.0.2.2", "localhost")
                          : "/default_cover.png"
                      }
                      alt={album.name || "cover"}
                      onError={(e) => (e.target.src = "/default_cover.png")}
                      style={{
                        width: 60,
                        height: 60,
                        objectFit: "cover",
                        borderRadius: 8,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
                      }}
                    />
                  </td>


                  <td>{album.name}</td>
                  <td>{album.artist_name}</td>
                  <td>{album.song_count}</td>
                  <td>{album.release_date}</td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-icon edit"
                        onClick={() => openModal("edit", album)}
                      >
                        <FaEdit />
                      </button>
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(album.album_id)}
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
      )}

      {/* ---------- MODAL ---------- */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.25)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 20,
              minWidth: 420,
              maxWidth: 800,
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                background: "linear-gradient(90deg,#2bc0e4 0%,#eaecc6 100%)",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                padding: "22px 32px 16px 32px",
                display: "flex",
                justifyContent: "space-between"
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 22, color: "#222" }}>
                {modalMode === "create" ? "Thêm album mới" : "Chỉnh sửa album"}
              </span>
              <button
                onClick={closeModal}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 28,
                  color: "#222",
                  cursor: "pointer"
                }}
              >
                &times;
              </button>
            </div>

            {/* FORM */}
            <form
              id="album-form"
              onSubmit={handleSubmit}
              style={{ padding: "24px 32px 16px 32px" }}
            >
              {/* Album name */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#000" }}>Tên Album *</label>
                <input
                  placeholder="Tên album..."
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e0e7ef",
                    color: "#000",
                    borderRadius: 10,
                    height: 44,
                    width: "100%",
                    padding: "0 16px"
                  }}
                />
              </div>

              {/* Artist */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#000" }}>Tìm nghệ sĩ</label>

                <input
                  type="text"
                  value={artistSearch}
                  onChange={(e) => setArtistSearch(e.target.value)}
                  placeholder="Tìm kiếm nghệ sĩ..."
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e0e7ef",
                    borderRadius: 10,
                    height: 44,
                    width: "100%",
                    padding: "0 16px",
                    marginBottom: 8
                  }}
                />

                <select
                  name="artist_id"
                  value={formData.artist_id}
                  onChange={handleInputChange}
                  required
                  style={{
                    background: "#f8fafc",
                    border: "2px solid #5a6ee6",
                    borderRadius: 10,
                    height: 44,
                    width: "100%"
                  }}
                >
                  <option value="">-- Chọn nghệ sĩ --</option>
                  {artistList
                    .filter((a) =>
                      a.name?.toLowerCase().includes(artistSearch.toLowerCase())
                    )
                    .map((a) => (
                      <option key={a.artist_id} value={a.artist_id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#000" }}>Mô tả</label>
                <textarea
                  placeholder="Mô tả..."
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e0e7ef",
                    borderRadius: 10,
                    width: "100%",
                    minHeight: 60,
                    padding: "12px 16px"
                  }}
                />
              </div>

              {/* Release date */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#000" }}>Ngày phát hành</label>
                <input
                  type="date"
                  name="release_date"
                  value={formData.release_date}
                  onChange={handleInputChange}
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e0e7ef",
                    borderRadius: 10,
                    height: 44,
                    width: "100%",
                    padding: "0 16px"
                  }}
                />
              </div>

              {/* Cover */}
              {/* Cover */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#000" }}>Ảnh Cover (URL)</label>
                <input
                  type="url"
                  name="cover_url"
                  value={formData.cover_url}
                  onChange={handleInputChange}
                  placeholder="URL ảnh album"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e0e7ef",
                    borderRadius: 10,
                    height: 44,
                    width: "100%",
                    padding: "0 16px",
                    marginBottom: 8
                  }}
                />
                {/* Hiển thị preview khi chỉnh sửa album */}
                {modalMode === "edit" && (
                  <div style={{ textAlign: "center", marginTop: 8 }}>
                    {formData.cover_url ? (
                      <img
                        src={fixLocalUrl(formData.cover_url)}
                        alt="Preview"
                        style={{ width: 80, borderRadius: 8 }}
                        onError={e => {e.target.onerror=null; e.target.src='https://via.placeholder.com/80x80?text=No+Image';}}
                      />
                    ) : (
                      <span style={{ color: "#888" }}>&lt;Preview&gt;</span>
                    )}
                  </div>
                )}
              </div>


              {/* Song selection */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, color: "#000" }}>Chọn bài hát</label>

                <input
                  type="text"
                  value={songSearch}
                  onChange={(e) => setSongSearch(e.target.value)}
                  placeholder="Tìm bài hát..."
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e0e7ef",
                    borderRadius: 10,
                    height: 38,
                    width: "100%",
                    padding: "0 16px",
                    marginBottom: 8
                  }}
                />

                <div
                  style={{
                    maxHeight: 140,
                    overflowY: "auto",
                    background: "#f8fafc",
                    borderRadius: 10,
                    border: "1px solid #e0e7ef",
                    padding: 8
                  }}
                >
                  {songList
                    .filter((s) => {
  const search = songSearch.toLowerCase();
  return (
    s.title?.toLowerCase().includes(search) ||
    s.artist?.toLowerCase().includes(search)
  );
})

                    .map((song) => (
                      <label
                        key={song.song_id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          background: "#fff",
                          color: "#000",
                          marginBottom: 4
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.song_ids.includes(song.song_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData((f) => ({
                                ...f,
                                song_ids: [...f.song_ids, song.song_id]
                              }));
                            } else {
                              setFormData((f) => ({
                                ...f,
                                song_ids: f.song_ids.filter(
                                  (id) => id !== song.song_id
                                )
                              }));
                            }
                          }}
                        />
                        {song.title} — {song.artist}
                      </label>
                    ))}
                </div>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 16,
                  marginTop: 32
                }}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: "#f8fafc",
                    borderRadius: 10,
                    padding: "12px 32px",
                    color: "#000"
                  }}
                >
                  HỦY
                </button>

                <button
                  type="submit"
                  form="album-form"
                  style={{
                    background: "#5a6ee6",
                    color: "#fff",
                    borderRadius: 10,
                    padding: "12px 32px"
                  }}
                >
                  {modalMode === "create" ? "Thêm album" : "Cập nhật"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAlbums;