import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import AdminAddEditAlbum from "./AdminAddEditAlbum";

const PHP_API_URL = "http://localhost:8081/music_API/online_music/album/manage_albums.php";

export default function AlbumManagementContent() {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editAlbum, setEditAlbum] = useState(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(PHP_API_URL);
      if (Array.isArray(res.data)) {
        setAlbums(res.data);
      } else {
        setAlbums([]);
      }
    } catch (err) {
      setError("Không thể tải danh sách album");
    }
    setLoading(false);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditAlbum(null);
    fetchAlbums();
  };

  return (
    <div className="album-management-content">
      <h2>Quản lý Album</h2>
      <button className="add-btn" onClick={() => { setShowModal(true); setEditAlbum(null); }}>
        <FaPlus /> Thêm Album
      </button>
      {loading ? (
        <p>Đang tải...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <table className="album-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên Album</th>
              <th>Artist ID</th>
              <th>Ngày phát hành</th>
              <th>Ảnh bìa</th>
            </tr>
          </thead>
          <tbody>
            {albums.map((album) => (
              <tr key={album.album_id}>
                <td>{album.album_id}</td>
                <td>{album.album_name}</td>
                <td>{album.artist_id}</td>
                <td>{album.release_date}</td>
                <td><img src={album.cover_url} alt="cover" style={{ width: 60 }} /></td>
                <td>
                  <button onClick={() => { setEditAlbum(album); setShowModal(true); }}><FaEdit /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {showModal && (
        <div className="modal-overlay" onClick={() => { setShowModal(false); setEditAlbum(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <AdminAddEditAlbum album={editAlbum} onSuccess={handleSuccess} />
            <button type="button" onClick={() => { setShowModal(false); setEditAlbum(null); }}>Đóng</button>
          </div>
        </div>
      )}
    </div>
  );
}
