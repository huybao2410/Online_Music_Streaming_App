import React, { useState, useEffect } from "react";
import axios from "axios";
import "./AdminTopSongs.css"; // optional css

const PHP_API = "http://localhost:8081/music_API/online_music";

export default function AdminTopSongs() {
  const [songs, setSongs] = useState([]);
  const [selectedTop, setSelectedTop] = useState([]); // danh sách song_id đang được chọn
  const [loading, setLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const songsPerPage = 10;

  useEffect(() => {
    loadSongs();
  }, []);

  // =========================================
  // 📌 Load danh sách bài hát từ PHP
  // =========================================
  const loadSongs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${PHP_API}/song/get_songs_web.php`);

      if (res.data.status && Array.isArray(res.data.songs)) {
        setSongs(res.data.songs);

        // Lấy danh sách bài hát đang là TOP
        const topList = res.data.songs
          .filter((s) => s.is_top === 1)
          .map((s) => s.song_id);

        setSelectedTop(topList);
      }
    } catch (e) {
      console.error("Error load songs:", e);
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // 📌 Toggle checkbox
  // =========================================
  const toggleTopSong = (id) => {
    setSelectedTop((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // =========================================
  // 📌 Lưu thay đổi Top Songs
  // =========================================
  const handleSave = async () => {
    try {
      const form = new FormData();
      selectedTop.forEach((id) => form.append("top_songs[]", id));

      const res = await axios.post(
        `${PHP_API}/song/set_top_songs.php`,
        form
      );

      if (res.data.status) {
        alert("🔥 Cập nhật Top Songs thành công!");
        loadSongs();
      } else {
        alert("Lỗi cập nhật Top Songs");
      }
    } catch (err) {
      console.error(err);
      alert("Không thể lưu danh sách Top Songs");
    }
  };

  // =========================================
  // 📌 Pagination
  // =========================================
  const totalPages = Math.ceil(songs.length / songsPerPage);
  const indexStart = (currentPage - 1) * songsPerPage;
  const pageSongs = songs.slice(indexStart, indexStart + songsPerPage);

  const changePage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  // =========================================
  // 📌 UI Render
  // =========================================
  return (
    <div className="admin-top-songs">

      <div className="header-row">
        <h2>🔥 Quản Lý Top Songs</h2>
        <button className="btn-save" onClick={handleSave}>💾 Lưu Top Songs</button>
      </div>

      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <table className="top-songs-table">
            <thead>
              <tr>
                <th>Top</th>
                <th>Ảnh</th>
                <th>Tên bài hát</th>
                <th>Nghệ sĩ</th>
                <th>Thể loại</th>
                <th>Lượt nghe</th>
              </tr>
            </thead>

            <tbody>
              {pageSongs.map((song) => (
                <tr key={song.song_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedTop.includes(song.song_id)}
                      onChange={() => toggleTopSong(song.song_id)}
                    />
                  </td>

                  <td>
                    <img
                      src={song.cover || "https://placehold.co/60"}
                      alt="cover"
                      className="cover-img"
                    />
                  </td>

                  <td><strong>{song.title}</strong></td>

                  <td>{song.artist || "Không rõ"}</td>

                  <td>{song.genre || "-"}</td>

                  <td>{song.play_count ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* ===================== PAGINATION ===================== */}
          <div className="pagination">
            <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1}>
              ◀
            </button>

            {[...Array(totalPages)].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  className={page === currentPage ? "active" : ""}
                  onClick={() => changePage(page)}
                >
                  {page}
                </button>
              );
            })}

            <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages}>
              ▶
            </button>
          </div>
        </>
      )}
    </div>
  );
}
