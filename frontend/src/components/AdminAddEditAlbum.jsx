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
      // Helper: fix local url for preview
      const fixLocalUrl = (url) => {
        if (!url) return "";
        return url.replace("10.0.2.2", "localhost");
      };
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

    // Khi album thay đổi (mở modal edit), cập nhật song_ids và cover preview vào formData
    useEffect(() => {
      if (isEdit && album) {
        setFormData(f => ({
          ...f,
          song_ids: album.song_ids || [],
          cover_url: album.cover_url || ""
        }));
        setCoverPreview(album.cover_url || "");
      }
    }, [album, isEdit]);

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
      <div className="modal-overlay" style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',background:'rgba(0,0,0,0.25)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div className="modal-box album-modal-specific" style={{background:'#fff',borderRadius:20,boxShadow:'0 2px 24px #0002',minWidth:420,maxWidth:540,width:'100%',maxHeight:'90vh',overflowY:'auto',position:'relative'}}>
          <div className="modal-header" style={{background:'linear-gradient(90deg,#2bc0e4 0%,#eaecc6 100%)',borderTopLeftRadius:20,borderTopRightRadius:20,padding:'22px 32px 16px 32px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <span style={{ fontWeight: 700, fontSize: 22, color: '#222' }}>{isEdit ? "Sửa album" : "Thêm album mới"}</span>
            <button className="close-btn" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 28, color: '#222', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
          </div>
          <form className="modal-form" onSubmit={handleSubmit} style={{ padding: '24px 32px 16px 32px' }}>
            <div className="form-group">
              <label>Tên album <span className="required">*</span></label>
              <input
                type="text"
                name="album_name"
                placeholder="Nhập tên album..."
                value={formData.album_name}
                onChange={e => setFormData({ ...formData, album_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Nghệ sĩ <span className="required">*</span></label>
              <input
                type="text"
                placeholder="Nhập tên nghệ sĩ..."
                value={artistSearch}
                onChange={e => setArtistSearch(e.target.value)}
                required
              />
              <div className="search-dropdown">
                {filteredArtists.map(a => (
                  <div key={a.artist_id} className="dropdown-item" onClick={() => { setFormData({ ...formData, artist_id: a.artist_id }); setArtistSearch(a.artist_name); }}>
                    {a.artist_name}
                  </div>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Mô tả</label>
              <input
                type="text"
                name="description"
                placeholder="Mô tả về album..."
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Ngày phát hành</label>
              <input
                type="date"
                name="release_date"
                placeholder="dd/mm/yyyy"
                value={formData.release_date}
                onChange={e => setFormData({ ...formData, release_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>URL ảnh bìa</label>
              <input
                type="url"
                name="cover_url"
                value={formData.cover_url}
                onChange={e => { setFormData({ ...formData, cover_url: e.target.value }); setCoverPreview(e.target.value); }}
                placeholder="https://example.com/image.jpg"
              />
              <small className="form-hint">Nhập URL ảnh hoặc tải file bên dưới</small>
            </div>
            <div className="form-group">
              <label>Hoặc tải file ảnh bìa</label>
              {coverPreview && (
                <div className="image-preview">
                  <img
                    src={fixLocalUrl(coverPreview)}
                    alt="Cover preview"
                    style={{width:120,margin:'0 auto',marginTop:8,borderRadius:8,boxShadow:'0 2px 8px #e0e7ef',display:'block'}}
                    onError={e => {e.target.onerror=null; e.target.src='https://via.placeholder.com/120x120?text=No+Image';}}
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverFileChange}
              />
              <small className="form-hint">JPG, PNG, GIF, WEBP - Tối đa 5MB</small>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 32 }}>
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading || uploading}>HỦY</button>
              <button type="submit" className="btn-submit" disabled={loading || uploading}>{isEdit ? "Lưu" : "Thêm"}</button>
            </div>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">{success}</p>}
          </form>
        </div>
      </div>
    );
  }
