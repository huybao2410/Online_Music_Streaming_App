// src/pages/AdminAlbums.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSearch, FaCompactDisc } from "react-icons/fa";
import "../components/SongManagementContent.css";

const NODE_API_URL = "http://localhost:5000/api";

function AdminAlbums() {
  const [albums, setAlbums] = useState([]);
  const [filteredAlbums, setFilteredAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
  const [coverPreview, setCoverPreview] = useState("");
  const [artistList, setArtistList] = useState([]);
  const [songList, setSongList] = useState([]);

  // 🔥 FIX QUAN TRỌNG: xử lý URL 10.0.2.2 → localhost cho Web
  const fixLocalUrl = (url) => {
    if (!url) return "";
    return url.replace("10.0.2.2", "localhost");
  };

  useEffect(() => {
    fetchAlbums();
    fetchArtists();
    fetchSongs();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      const filtered = albums.filter(
        (album) =>
          album.name?.toLowerCase().includes(lower) ||
          album.artist_name?.toLowerCase().includes(lower)
      );
      setFilteredAlbums(filtered);
    } else {
      setFilteredAlbums(albums);
    }
  }, [searchTerm, albums]);

  const fetchArtists = async () => {
    try {
      const res = await axios.get("http://localhost:8081/music_API/online_music/artist/get_artists.php");
      setArtistList(Array.isArray(res.data.artists) ? res.data.artists : []);
    } catch {}
  };

  const fetchSongs = async () => {
    try {
      const res = await axios.get("http://localhost:8081/music_API/online_music/song/get_songs.php");
      setSongList(Array.isArray(res.data.songs) ? res.data.songs : []);
    } catch {}
  };

  const fetchAlbums = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await axios.get(`${NODE_API_URL}/admin/albums`);
      const data = res.data.albums || [];
      setAlbums(data);
      setFilteredAlbums(data);
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
      setCoverPreview(fixLocalUrl(album.cover_url));
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
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDelete = async (albumId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa album này?")) return;
    try {
      await axios.delete(`${NODE_API_URL}/admin/albums/${albumId}`);
      setSuccess("Xóa album thành công!");
      fetchAlbums();
    } catch {
      setError("Có lỗi xảy ra khi xóa album");
    }
  };

  return (
    <div className="song-management-content">
      <div className="content-header">
        <div className="header-left">
          <h2><FaCompactDisc /> Quản lý Album</h2>
          <p>Tổng số: <strong>{filteredAlbums.length}</strong> album</p>
        </div>

        <button className="btn-add" onClick={() => openModal("create")}>
          <FaPlus /> Thêm album
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

      {/* Search bar */}
      <div className="filters-bar">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm album, nghệ sĩ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <p>Đang tải...</p>
      ) : filteredAlbums.length === 0 ? (
        <div className="empty-state">
          <FaCompactDisc size={48} />
          <p>Không tìm thấy album nào</p>
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
                <th>Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {filteredAlbums.map((album) => (
                <tr key={album.album_id}>
                  <td>{album.album_id}</td>

                  <td>
                    <div className="cover-thumb">
                      {album.cover_url ? (
                        <img
                          src={fixLocalUrl(album.cover_url)}
                          alt={album.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <div className="no-cover"><FaCompactDisc /></div>
                      )}
                    </div>
                  </td>

                  <td className="song-title">{album.name}</td>
                  <td>{album.artist_name}</td>
                  <td>{album.song_count}</td>
                  <td>{album.release_date}</td>

                  <td>
                    <div className="action-btns">
                      <button className="btn-icon edit" onClick={() => openModal("edit", album)}>
                        <FaEdit />
                      </button>

                      <button className="btn-icon delete" onClick={() => handleDelete(album.album_id)}>
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

      {/* Modal placeholder */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Form Album (placeholder)</h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAlbums;