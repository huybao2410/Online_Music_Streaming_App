import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaSave, FaSearch, FaLink } from "react-icons/fa";
  import React, { useState, useEffect } from "react";
  import axios from "axios";
  import { FaSave, FaSearch, FaLink } from "react-icons/fa";

  const PHP_API_URL = "http://localhost:8081/music_API/online_music/album/manage_albums.php";
  const PHP_ARTIST_API = "http://localhost:8081/music_API/online_music/artist/get_artists.php";
  const PHP_SONG_API = "http://localhost:8081/music_API/online_music/song/get_songs.php";

  export default function AdminAddEditAlbum({ album, onSuccess, onClose }) {
    const isEdit = !!album;
    const [formData, setFormData] = useState({
      album_name: album?.album_name || "",
      artist_id: album?.artist_id || "",
      description: album?.description || "",
      release_date: album?.release_date || "",
      cover_url: album?.cover_url || "",
      song_ids: album?.song_ids || []
    });
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(formData.cover_url || "");
    const [uploading, setUploading] = useState(false);

    // Artist search/select
    const [artistSearch, setArtistSearch] = useState("");
    const [artistList, setArtistList] = useState([]);

    // Song search/select
    const [songSearch, setSongSearch] = useState("");
    const [songList, setSongList] = useState([]);

    useEffect(() => {
      fetchArtists();
      fetchSongs();
    }, []);

    const fetchArtists = async () => {
      try {
        const res = await axios.get(PHP_ARTIST_API);
        setArtistList(Array.isArray(res.data) ? res.data : []);
      } catch {}
    };
    const fetchSongs = async () => {
      try {
        const res = await axios.get(PHP_SONG_API);
        setSongList(Array.isArray(res.data) ? res.data : []);
      } catch {}
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setError("");
      setSuccess("");
      setLoading(true);
      let finalCoverUrl = formData.cover_url;
      try {
        if (coverFile) {
          setUploading(true);
          const uploadData = new FormData();
          uploadData.append('cover_file', coverFile);
          const uploadRes = await axios.post('http://localhost:5000/api/upload-album-cover', uploadData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          if (uploadRes.data && uploadRes.data.cover_url) {
            finalCoverUrl = uploadRes.data.cover_url;
            setFormData(f => ({ ...f, cover_url: finalCoverUrl }));
          } else {
            setError('Upload ảnh thất bại');
            setUploading(false);
            setLoading(false);
            return;
          }
          setUploading(false);
        }
        let res;
        const submitData = { ...formData, cover_url: finalCoverUrl };
        if (isEdit) {
          res = await axios.put(PHP_API_URL, { ...submitData, album_id: album.album_id });
        } else {
          res = await axios.post(PHP_API_URL, submitData);
        }
        if (res.data && res.data.success) {
          setSuccess(isEdit ? 'Cập nhật album thành công!' : 'Thêm album thành công!');
          if (onSuccess) onSuccess();
        } else {
          setError(res.data.message || (isEdit ? 'Cập nhật thất bại' : 'Thêm thất bại'));
        }
      } catch (err) {
        setError('Lỗi khi gửi dữ liệu');
      }
      setLoading(false);
    };

    // Artist select
    const filteredArtists = artistList.filter(a =>
      a.artist_name?.toLowerCase().includes(artistSearch.toLowerCase())
    );

    // Song select
    const filteredSongs = songList.filter(s =>
      s.song_name?.toLowerCase().includes(songSearch.toLowerCase())
    );

    const handleCoverFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      }
    };

    // Popup/modal style
    return (
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
      }}>
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
        }}>
          <div style={{
            background: 'linear-gradient(90deg,#2bc0e4 0%,#eaecc6 100%)',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: '22px 32px 16px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>{isEdit ? "Sửa album" : "Thêm album mới"}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 28, color: '#222', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
          </div>
          <form className="admin-album-form" onSubmit={handleSubmit} style={{ padding: '24px 32px 16px 32px' }}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Tên album *</label>
              <input
                type="text"
                placeholder="Nhập tên album..."
                value={formData.album_name}
                onChange={e => setFormData({ ...formData, album_name: e.target.value })}
                required
                style={{ borderRadius: 8, border: '1px solid #e0e7ef', background: '#f8fafc', height: 40, fontSize: 15, color: '#333', width: '100%', padding: '0 12px' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>ID nghệ sĩ *</label>
              <input
                type="text"
                placeholder="Nhập ID nghệ sĩ..."
                value={formData.artist_id}
                onChange={e => setFormData({ ...formData, artist_id: e.target.value })}
                required
                style={{ borderRadius: 8, border: '1px solid #e0e7ef', background: '#f8fafc', height: 40, fontSize: 15, color: '#333', width: '100%', padding: '0 12px' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Mô tả</label>
              <input
                type="text"
                placeholder="Mô tả về album..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                style={{ borderRadius: 8, border: '1px solid #e0e7ef', background: '#f8fafc', height: 40, fontSize: 15, color: '#333', width: '100%', padding: '0 12px' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Ngày phát hành</label>
              <input
                type="date"
                placeholder="dd/mm/yyyy"
                value={formData.release_date}
                onChange={e => setFormData({ ...formData, release_date: e.target.value })}
                style={{ borderRadius: 8, border: '1px solid #e0e7ef', background: '#f8fafc', height: 40, fontSize: 15, color: '#333', width: '100%', padding: '0 12px' }}
              />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontWeight: 500, marginBottom: 6, display: 'block' }}>Ảnh Cover</label>
              <input
                type="text"
                placeholder="URL ảnh (tùy chọn)"
                value={formData.cover_url}
                onChange={e => { setFormData({ ...formData, cover_url: e.target.value }); setCoverPreview(e.target.value); }}
                style={{ borderRadius: 8, border: '1px solid #e0e7ef', background: '#f8fafc', height: 40, fontSize: 15, color: '#333', width: '100%', padding: '0 12px' }}
              />
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
                style={{ borderRadius: 8, border: '1px solid #e0e7ef', background: '#f8fafc', height: 40, fontSize: 15, color: '#333', width: '100%', marginTop: 8, padding: '8px 12px' }}
              />
              {coverPreview && (
                <img src={coverPreview} alt="Preview" style={{ width: 120, margin: '0 auto', marginTop: 8, borderRadius: 8, boxShadow: '0 2px 8px #e0e7ef', display: 'block' }} />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32 }}>
              <button type="button" onClick={onClose} style={{
                background: '#f8fafc',
                color: '#222',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 17,
                padding: '12px 32px',
                boxShadow: '0 2px 8px #e0e7ef',
                cursor: 'pointer'
              }}>HỦY</button>
              <button type="submit" disabled={loading || uploading} style={{
                background: 'linear-gradient(90deg,#2bc0e4 0%,#eaecc6 100%)',
                color: '#222',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 17,
                padding: '12px 32px',
                boxShadow: '0 2px 8px #e0e7ef',
                cursor: 'pointer'
              }}>{isEdit ? "Lưu" : "Thêm"}</button>
            </div>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
          </form>
        </div>
      </div>
    );
  }
