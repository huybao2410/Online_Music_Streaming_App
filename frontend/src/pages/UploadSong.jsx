import React, { useState, useRef, useEffect } from "react";
import "./UploadSong.css";

export default function UploadSong() {
  const [songData, setSongData] = useState({
    title: "",
    artist: "",
    genre: "",
    file: null,
  });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const userName = localStorage.getItem("username") || "User";

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setSongData({ ...songData, file: files[0] });
    } else {
      setSongData({ ...songData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!songData.file) {
      alert("Vui lòng chọn file nhạc để upload!");
      return;
    }
    alert(`🎵 Bài hát "${songData.title}" đã được upload thành công!`);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    alert("Đăng xuất thành công!");
    setIsDropdownOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="upload-page">
      {/* ==== HEADER ==== */}
      <header className="upload-header">
        <div className="upload-header-inner">
          <div className="header-left">
            <div className="logo">🎵 MusicDBG</div>
            <nav className="nav-links">
              <a href="#">Khám Phá</a>
              <a href="#">Bài Hát</a>
              <a href="#">Playlist</a>
              <a href="#">Video</a>
              <a href="#">BXH</a>
              <a href="#">Top 100</a>
            </nav>
          </div>

          <div className="header-right">
            <div className="search-box">
              <input type="text" placeholder="Tìm kiếm..." />
            </div>
            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-icon"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                👤
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item">{userName}</div>
                  <div className="dropdown-item">Thông tin người dùng</div>
                  <div
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ==== FORM UPLOAD ==== */}
      <div className="upload-container">
        <h2>⬆️ Upload Bài Hát</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Tên bài hát:
            <input
              type="text"
              name="title"
              value={songData.title}
              onChange={handleChange}
              placeholder="Nhập tên bài hát..."
              required
            />
          </label>

          <label>
            Nghệ sĩ:
            <input
              type="text"
              name="artist"
              value={songData.artist}
              onChange={handleChange}
              placeholder="Nhập tên nghệ sĩ..."
              required
            />
          </label>

          <label>
            Thể loại:
            <select
              name="genre"
              value={songData.genre}
              onChange={handleChange}
              required
            >
              <option value="">-- Chọn thể loại --</option>
              <option value="Pop">Pop</option>
              <option value="Rock">Rock</option>
              <option value="R&B">R&B</option>
              <option value="Hip-hop">Hip-hop</option>
              <option value="EDM">EDM</option>
              <option value="Ballad">Ballad</option>
            </select>
          </label>

          <label>
            File nhạc:
            <input
              type="file"
              name="file"
              accept=".mp3,.wav"
              onChange={handleChange}
              required
            />
          </label>

          <button type="submit" className="upload-submit">
            Tải lên
          </button>
        </form>
      </div>

      {/* ==== HƯỚNG DẪN & QUY ĐỊNH ==== */}
      <div className="upload-info-section">
        <div className="info-box">
          <h3>📘 Hướng dẫn</h3>
          <ul>
            <li>Tài khoản phải được đăng nhập thành công trước khi tải lên.</li>
            <li>File upload không quá <b>120MB</b>, bit-rate tối thiểu <b>128kbps</b>.</li>
            <li>
              Hỗ trợ các định dạng: <b>.mp3, .wav, .flac, .mp4, .avi</b>.
            </li>
            <li>
              Thời gian kiểm duyệt: <b>72 giờ</b> (User thường) hoặc <b>12 giờ</b> (User VIP).
            </li>
            <li>
              Ảnh bìa bài hát cần kích thước ít nhất <b>640×640px</b>.
            </li>
          </ul>
        </div>

        <div className="info-box">
          <h3>⚖️ Quy định</h3>
          <ul>
            <li>
              Bài hát vi phạm bản quyền hoặc nội dung nhạy cảm sẽ bị xóa vĩnh viễn.
            </li>
            <li>
              Tài khoản vi phạm nhiều lần có thể bị khóa vĩnh viễn.
            </li>
            <li>
              Vui lòng tuân thủ <a href="#">điều khoản sử dụng</a> của hệ thống.
            </li>
          </ul>
        </div>
        <footer className="upload-footer">
  <div className="footer-inner">
    <div className="footer-left">
      <div className="footer-logo">🎵 MusicDBG</div>
      <p>Nền tảng chia sẻ âm nhạc sáng tạo, hiện đại và thân thiện.</p>
    </div>

    <div className="footer-links">
      <a href="#">Điều khoản sử dụng</a>
      <a href="#">Chính sách bảo mật</a>
      <a href="#">Liên hệ</a>
    </div>
  </div>

  <div className="footer-bottom">
    <p>© 2025 MusicDBG. All rights reserved.</p>
  </div>
</footer>
      </div>
    </div>
  );
}
