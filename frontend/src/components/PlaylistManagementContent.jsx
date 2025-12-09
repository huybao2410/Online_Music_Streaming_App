import React, { useState, useEffect } from "react";
import axios from "axios";
import "./PlaylistManagementContent.css";

const PlaylistManagementContent = () => {
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchPlaylists();
    // eslint-disable-next-line
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/playlists", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPlaylists(res.data.playlists || []);
    } catch (err) {
      setError("Không thể tải danh sách playlist.");
    }
    setLoading(false);
  };

  const handleAddPlaylist = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name) {
      setError("Vui lòng nhập tên playlist.");
      return;
    }
    try {
      setLoading(true);
      await axios.post(
        "/api/playlists",
        { name, description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Thêm playlist thành công!");
      setName("");
      setDescription("");
      fetchPlaylists();
    } catch (err) {
      setError("Lỗi khi thêm playlist.");
    }
    setLoading(false);
  };

  return (
    <div className="tab-content">
      <h2>Quản lý Playlist</h2>
      <form onSubmit={handleAddPlaylist} style={{ marginBottom: 24 }}>
        <div className="playlist-form">
          <input
            type="text"
            placeholder="Tên playlist"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Mô tả (tuỳ chọn)"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
          <button type="submit" disabled={loading}>
            Thêm mới
          </button>
        </div>
        {error && <div className="playlist-error">{error}</div>}
        {success && <div className="playlist-success">{success}</div>}
      </form>
      <div>
        <h3>Danh sách playlist</h3>
        {loading ? (
          <div>Đang tải...</div>
        ) : (
          <table className="playlist-table">
            <thead>
              <tr>
                <th>Tên playlist</th>
                <th>Mô tả</th>
                <th>Người tạo</th>
              </tr>
            </thead>
            <tbody>
              {playlists.map((pl, idx) => (
                <tr key={idx}>
                  <td>{pl.name}</td>
                  <td>{pl.description}</td>
                  <td>{pl.owner_name || pl.owner_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PlaylistManagementContent;
