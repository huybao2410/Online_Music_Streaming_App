
import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash, FaMusic, FaTimes } from "react-icons/fa";
import "../components/SongManagementContent.css";

function AdminAlbums() {
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
        songIds = album.songs.map(s => s.song_id);
      }
      setFormData({
        name: album.name || "",
        artist_id: album.artist_id || "",
        description: album.description || "",
        release_date: album.release_date || "",
        cover_url: album.cover_url || "",
        song_ids: songIds
      });
      // Nếu có cover_url thì set preview luôn
      if (album.cover_url) {
        setCoverPreview(album.cover_url);
      } else {
        setCoverPreview("");
      }
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

  // Thêm album
  const addAlbum = async (data) => {
    try {
      // Chuẩn bị dữ liệu album để lưu vào DB
      const albumData = {
        ...data,
        song_ids: Array.isArray(data.song_ids) ? data.song_ids : [],
      };
      delete albumData.cover_file;
      if (albumData.release_date && albumData.release_date.includes('T')) {
        albumData.release_date = albumData.release_date.split('T')[0];
      }
      await axios.post("/api/admin/albums", albumData);
      setSuccess("Thêm album thành công!");
      closeModal();
      fetchAlbums();
    } catch (err) {
      setError("Có lỗi xảy ra khi thêm album");
    }
  };

  // Chỉnh sửa album
  const editAlbum = async (data, albumId) => {
    try {
      // Chuẩn bị dữ liệu album để lưu vào DB
      const albumData = {
        ...data,
        song_ids: Array.isArray(data.song_ids) ? data.song_ids : [],
      };
      delete albumData.cover_file;
      if (albumData.release_date && albumData.release_date.includes('T')) {
        albumData.release_date = albumData.release_date.split('T')[0];
      }
      await axios.put(`/api/admin/albums/${albumId}`, albumData);
      setSuccess("Cập nhật album thành công!");
      closeModal();
      fetchAlbums();
    } catch (err) {
      setError("Có lỗi xảy ra khi chỉnh sửa album");
    }
  };

  // Xử lý submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (modalMode === "create") {
      await addAlbum(formData);
    } else if (modalMode === "edit" && currentAlbum) {
      await editAlbum(formData, currentAlbum.album_id);
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
                      <button className="btn-icon edit" onClick={() => openModal("edit", album)} title="Sửa"
                        style={{ background: '#4a6cf7', color: '#fff', border: 'none', borderRadius: 12, width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginRight: 8, boxShadow: '0 2px 8px #e0e7ef', cursor: 'pointer' }}>
                        <FaEdit />
                      </button>
                      <button className="btn-icon delete" onClick={() => handleDelete(album.album_id)} title="Xóa"
                        style={{ background: '#ffeaea', color: '#e53e3e', border: 'none', borderRadius: 12, width: 44, height: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 2px 8px #e0e7ef', cursor: 'pointer' }}>
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
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }} onClick={closeModal}>
          <div style={{
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 2px 24px #0002',
            minWidth: 420,
            maxWidth: 540,
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative'
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              background: 'linear-gradient(90deg,#2bc0e4 0%,#eaecc6 100%)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: '22px 32px 16px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>{modalMode === "create" ? "Thêm album mới" : "Chỉnh sửa album"}</span>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', fontSize: 28, color: '#222', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
            </div>
            <form id="album-form" onSubmit={handleSubmit} style={{ padding: '24px 32px 16px 32px' }}>
              {/* Tên Album */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', color: '#222' }}>Tên Album *</label>
                <input type="text" name="name" value={formData.name} onChange={handleInputChange} required
                  style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 10, height: 44, fontSize: 16, color: '#222', width: '100%', padding: '0 16px' }}
                  placeholder="Nhập tên album..." />
              </div>
              {/* Tìm nghệ sĩ */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', color: '#222' }}>Tìm nghệ sĩ</label>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <span style={{ position: 'absolute', left: 12, top: 12, color: '#5a6ee6', fontSize: 18 }}>🔍</span>
                  <input type="text" value={artistSearch} onChange={e => setArtistSearch(e.target.value)}
                    style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 10, height: 44, fontSize: 16, color: '#222', width: '100%', padding: '0 16px 0 36px' }} placeholder="Tìm kiếm nghệ sĩ..." />
                </div>
                <select name="artist_id" value={formData.artist_id} onChange={handleInputChange} required
                  style={{ background: '#f8fafc', border: '2px solid #5a6ee6', borderRadius: 10, height: 44, fontSize: 16, color: '#222', width: '100%', padding: '0 16px' }}>
                  <option value="">-- Chọn nghệ sĩ --</option>
                  {artistList.filter(a => a.name?.toLowerCase().includes(artistSearch.toLowerCase())).map(a => (
                    <option key={a.artist_id} value={a.artist_id}>{a.name}</option>
                  ))}
                </select>
              </div>
              {/* Mô tả */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', color: '#222' }}>Mô tả</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                  style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 10, fontSize: 16, color: '#222', width: '100%', padding: '12px 16px', minHeight: 60 }}
                  placeholder="Mô tả về album..." />
              </div>
              {/* Ngày phát hành */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', color: '#222' }}>Ngày phát hành</label>
                <input type="date" name="release_date" value={formData.release_date} onChange={handleInputChange}
                  style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 10, height: 44, fontSize: 16, color: '#222', width: '100%', padding: '0 16px' }}
                  placeholder="dd/mm/yyyy" />
              </div>
              {/* Ảnh Cover */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', color: '#222' }}>Ảnh Cover</label>
                <div style={{ position: 'relative', marginBottom: 8 }}>
                  <span style={{ position: 'absolute', left: 12, top: 12, color: '#5a6ee6', fontSize: 18 }}>🔗</span>
                  <input type="url" name="cover_url" value={formData.cover_url} onChange={handleInputChange}
                    style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 10, height: 44, fontSize: 16, color: '#222', width: '100%', padding: '0 16px 0 36px' }}
                    placeholder="URL ảnh (tùy chọn)" />
                </div>
                <input type="file" name="cover_file" accept="image/*" onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    setFormData(f => ({ ...f, cover_file: file }));
                    const reader = new FileReader();
                    reader.onload = ev => {
                      setCoverPreview(ev.target.result);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                  style={{ background: '#f8fafc', border: 'none', borderRadius: 10, height: 44, fontSize: 16, color: '#222', width: '100%', padding: '0 16px', marginBottom: 4 }} />
                {/* Preview ảnh */}
                <div style={{ textAlign: 'center', marginTop: 8 }}>
                  {coverPreview ? (
                    <img src={coverPreview} alt="Preview" style={{ width: 80, borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef', display: 'inline-block' }} />
                  ) : (
                    <span style={{ color: '#888', fontSize: 15 }}>&lt;Preview&gt;</span>
                  )}
                </div>
                // ...existing code...
                const [coverPreview, setCoverPreview] = useState("");
              </div>
              {/* Chọn bài hát */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontWeight: 500, marginBottom: 6, display: 'block', color: '#222' }}>Chọn bài hát</label>
                {/* Tìm bài hát */}
                <input type="text" value={songSearch} onChange={e => setSongSearch(e.target.value)} placeholder="Tìm bài hát..."
                  style={{ background: '#f8fafc', border: '1px solid #e0e7ef', borderRadius: 10, height: 38, fontSize: 15, color: '#222', width: '100%', padding: '0 16px', marginBottom: 8 }} />
                {/* Danh sách bài hát checkbox */}
                <div style={{ maxHeight: 140, overflowY: 'auto', background: '#f8fafc', borderRadius: 10, border: '1px solid #e0e7ef', padding: 8 }}>
                  {songList.filter(s => s.title?.toLowerCase().includes(songSearch.toLowerCase())).map(song => (
                    <label key={song.song_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 500, color: '#222', marginBottom: 4, background: '#fff', boxShadow: '0 1px 4px #e0e7ef', transition: 'background 0.2s' }}
                      onMouseOver={e => e.currentTarget.style.background = '#f3f6fd'}
                      onMouseOut={e => e.currentTarget.style.background = '#fff'}>
                      <input type="checkbox" style={{ accentColor: '#5a6ee6', width: 18, height: 18 }}
                        checked={formData.song_ids.includes(song.song_id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setFormData(f => ({ ...f, song_ids: [...f.song_ids, song.song_id] }));
                          } else {
                            setFormData(f => ({ ...f, song_ids: f.song_ids.filter(id => id !== song.song_id) }));
                          }
                        }}
                      />
                      {song.title} — {song.artist}
                    </label>
                  ))}
                </div>
              </div>
              {/* Nút hành động */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32 }}>
                <button type="button" onClick={closeModal} style={{
                  background: '#f8fafc',
                  color: '#222',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 17,
                  padding: '12px 32px',
                  boxShadow: '0 2px 8px #e0e7ef',
                  cursor: 'pointer'
                }}>HỦY</button>
                <button type="submit" form="album-form" style={{
                  background: '#5a6ee6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                  fontSize: 17,
                  padding: '12px 32px',
                  boxShadow: '0 2px 8px #e0e7ef',
                  cursor: 'pointer'
                }}>{modalMode === "create" ? "Thêm album" : "Cập nhật"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminAlbums;
